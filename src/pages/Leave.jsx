import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, addDoc, query, where, onSnapshot, getDoc, doc, serverTimestamp } from "firebase/firestore";

export default function Leave() {
    const navigate = useNavigate();
    const [currentUserData, setCurrentUserData] = useState(null);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [formData, setFormData] = useState({ fromDate: '', toDate: '', reason: '' });

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setCurrentUserData({ uid: user.uid, ...userDoc.data() });
                    
                    const historyQuery = query(collection(db, "leaves"), where("studentId", "==", user.uid));
                    const unsubscribeLeaves = onSnapshot(historyQuery, (snapshot) => {
                        let docs = [];
                        snapshot.forEach(d => docs.push({ id: d.id, ...d.data() }));
                        docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
                        setLeaves(docs);
                        setLoading(false);
                    });
                    return () => unsubscribeLeaves();
                } else {
                    navigate("/");
                }
            } else {
                navigate("/");
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]);

    const handleApply = async (e) => {
        e.preventDefault();
        if(!currentUserData) return;
        setSubmitting(true);
        try {
            await addDoc(collection(db, "leaves"), {
                schoolId: currentUserData.schoolId,
                studentId: currentUserData.uid,
                studentName: currentUserData.name || currentUserData.firstName,
                targetClass: String(currentUserData.class || ""),
                fromDate: formData.fromDate,
                toDate: formData.toDate,
                reason: formData.reason,
                status: "Pending",
                createdAt: serverTimestamp()
            });
            try {
                await addDoc(collection(db, "notifications"), {
                    schoolId: currentUserData.schoolId,
                    targetRole: "admin",
                    title: "New Leave Request",
                    message: `${currentUserData.name || currentUserData.firstName} requested leave from ${formData.fromDate} to ${formData.toDate}`,
                    type: "leave",
                    createdAt: serverTimestamp()
                });
            } catch (err) { console.error(err); }
            setFormData({ fromDate: '', toDate: '', reason: '' });
            showMessage("✅ Leave applied successfully!", "text-emerald-600");
        } catch(err) {
            showMessage("❌ Error: " + err.message, "text-red-500");
        }
        setSubmitting(false);
    };

    const showMessage = (text, type) => {
        setMsg({ text, type });
        setTimeout(() => setMsg({ text: "", type: "" }), 4000);
    };

    const formatDate = (dateStr) => {
        if(!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="pb-10 font-sans bg-slate-50 min-h-screen">
            <div className="bg-green-600 text-white px-5 py-5 rounded-b-[24px] shadow-md flex items-center gap-4 sticky top-0 z-50">
                <button onClick={() => navigate('/dashboard')} className="text-white hover:text-green-100 transition text-lg active:scale-95">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-lg font-bold">Leave Application</h1>
            </div>

            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-5 mt-6">
                <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 mb-8">
                    <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><i className="fas fa-calendar-plus text-green-500"></i> Request Leave</h2>
                    <form onSubmit={handleApply} className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 md:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 lg:grid-cols-5 lg:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">From Date</label>
                                <input type="date" min={new Date().toISOString().split("T")[0]} value={formData.fromDate} onChange={e => setFormData({...formData, fromDate: e.target.value, toDate: formData.toDate < e.target.value ? e.target.value : formData.toDate})} required className="w-full p-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-slate-50" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">To Date</label>
                                <input type="date" min={formData.fromDate || new Date().toISOString().split("T")[0]} value={formData.toDate} onChange={e => setFormData({...formData, toDate: e.target.value})} required className="w-full p-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-slate-50" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reason for Leave</label>
                            <textarea rows="3" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} required placeholder="Type your reason here..." className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-slate-50 resize-none"></textarea>
                        </div>
                        {msg.text && <p className={`text-xs font-bold text-center ${msg.type}`}>{msg.text}</p>}
                        <button type="submit" disabled={submitting} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-md shadow-green-200">
                            {submitting ? "Submitting..." : "Submit Request"}
                        </button>
                    </form>
                </div>

                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm px-1">
                    <i className="fas fa-history text-slate-400"></i> My Leave History
                </h3>
                <div className="space-y-3">
                    {loading ? (
                        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 text-center">
                            <p className="text-sm text-slate-400 font-medium">Loading history...</p>
                        </div>
                    ) : leaves.length === 0 ? (
                        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 text-center"><p className="text-sm text-slate-400 font-medium">No leave requests found.</p></div>
                    ) : (
                        leaves.map(leave => {
                            let statusColor = leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : (leave.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600');
                            return (
                                <div key={leave.id} className="bg-white p-4 rounded-[16px] shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] border border-slate-100 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{formatDate(leave.fromDate)} <i className="fas fa-arrow-right mx-1 text-[10px] text-slate-400"></i> {formatDate(leave.toDate)}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{leave.reason}</p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${statusColor}`}>{leave.status || 'Pending'}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
