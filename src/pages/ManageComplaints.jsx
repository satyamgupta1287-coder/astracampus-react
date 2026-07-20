import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, query, where, onSnapshot, getDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ManageComplaints() {
    const navigate = useNavigate();
    const [adminSchoolId, setAdminSchoolId] = useState(null);
    const [complaints, setComplaints] = useState([]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const adminDoc = await getDoc(doc(db, 'users', user.uid));
                if (adminDoc.exists()) {
                    setAdminSchoolId(adminDoc.data().schoolId);
                }
            } else {
                navigate('/');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (!adminSchoolId) return;
        const q = query(collection(db, "complaints"), where("schoolId", "==", adminSchoolId));
        const unsub = onSnapshot(q, (snapshot) => {
            let items = [];
            snapshot.forEach(d => items.push({ id: d.id, ...d.data() }));
            items.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setComplaints(items);
        });
        return () => unsub();
    }, [adminSchoolId]);

    const resolveComplaint = async (id) => {
        if (window.confirm("Are you sure you want to mark this issue as resolved?")) {
            try {
                await updateDoc(doc(db, "complaints", id), { status: 'Resolved' });
                try {
                    const comp = complaints.find(c => c.id === id);
                    if (comp) {
                        await addDoc(collection(db, "notifications"), {
                            schoolId: adminSchoolId,
                            userId: comp.studentId,
                            title: "Complaint Resolved",
                            message: `Your complaint "${comp.title}" has been marked as resolved.`,
                            type: "complaint_reply",
                            createdAt: serverTimestamp()
                        });
                    }
                } catch (err) { console.error(err); }
            } catch (error) {
                console.log("Error updating status: " + error.message);
            }
        }
    };

    return (
        <div className="bg-slate-50 pb-10 min-h-screen font-sans">
            <div className="bg-red-600 text-white px-5 py-5 rounded-b-[24px] shadow-md flex items-center gap-4 sticky top-0 z-50">
                <button onClick={() => navigate(-1)} className="text-white hover:text-red-200 transition text-lg active:scale-95">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-lg font-bold">Helpdesk & Complaints</h1>
            </div>

            <div className="max-w-md mx-auto px-5 mt-6">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h2 className="text-sm font-bold text-slate-800">Student Tickets</h2>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-200 px-2 py-1 rounded-md">{complaints.length} Total</span>
                </div>

                <div className="space-y-4">
                    {complaints.length === 0 ? (
                        <div className="bg-white p-8 rounded-[20px] border border-slate-100 text-center shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 text-2xl mx-auto mb-3">
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <p className="text-sm text-slate-500 font-bold">All clear! No complaints found.</p>
                        </div>
                    ) : (
                        complaints.map(item => {
                            const isResolved = item.status === 'Resolved';
                            const statusColor = isResolved ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600';
                            const dateStr = item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString('en-GB', {day:'numeric', month:'short'}) : 'Just now';

                            return (
                                <div key={item.id} className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 transition hover:shadow-md">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm mb-0.5">{item.title}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                <i className="fas fa-user-graduate mr-1"></i> {item.studentName} (Class {item.studentClass})
                                            </p>
                                        </div>
                                        <span className="text-[9px] font-bold px-2 py-1 rounded text-slate-500 bg-slate-100 shrink-0 ml-2">{dateStr}</span>
                                    </div>
                                    
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                                        <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${statusColor}`}>
                                            {isResolved ? 'Resolved' : 'Pending'}
                                        </span>
                                    </div>
                                    {!isResolved && (
                                        <button onClick={() => resolveComplaint(item.id)} className="w-full mt-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-600 hover:text-emerald-600 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2">
                                            <i className="fas fa-check"></i> Mark as Resolved
                                        </button>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
