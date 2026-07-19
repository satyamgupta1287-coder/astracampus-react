import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, query, where, onSnapshot, getDoc, doc, updateDoc } from 'firebase/firestore';

export default function ManageLeaves() {
    const navigate = useNavigate();
    const [adminSchoolId, setAdminSchoolId] = useState(null);
    const [leaves, setLeaves] = useState([]);

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
        const q = query(collection(db, "leaves"), where("schoolId", "==", adminSchoolId));
        const unsub = onSnapshot(q, (snapshot) => {
            let items = [];
            snapshot.forEach(d => items.push({ id: d.id, ...d.data() }));
            items.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setLeaves(items);
        });
        return () => unsub();
    }, [adminSchoolId]);

    const updateStatus = async (id, newStatus) => {
        if (window.confirm(`Mark this leave as ${newStatus}?`)) {
            await updateDoc(doc(db, "leaves", id), { status: newStatus });
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="bg-slate-50 pb-10 min-h-screen font-sans">
            <div className="bg-green-700 text-white px-5 py-5 rounded-b-[24px] shadow-md flex items-center gap-4 sticky top-0 z-50">
                <button onClick={() => navigate(-1)} className="text-white hover:text-green-200 transition text-lg active:scale-95">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-lg font-bold">Leave Requests</h1>
            </div>

            <div className="max-w-md mx-auto px-5 mt-6">
                <div className="space-y-4">
                    {leaves.length === 0 ? (
                        <div className="bg-white p-6 rounded-2xl border text-center"><p className="text-sm text-slate-400 font-medium">No leave requests pending.</p></div>
                    ) : (
                        leaves.map(item => {
                            const status = item.status || 'Pending';
                            let color = status === 'Approved' ? 'text-emerald-600' : 'text-red-500';
                            
                            return (
                                <div key={item.id} className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-slate-800">{item.studentName}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Class {item.targetClass}</p>
                                        </div>
                                        <div className="text-right text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border">
                                            {formatDate(item.fromDate)} - {formatDate(item.toDate)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{item.reason}</p>
                                    
                                    {status === 'Pending' ? (
                                        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                                            <button onClick={() => updateStatus(item.id, 'Approved')} className="flex-1 bg-emerald-50 text-emerald-600 font-bold py-2 rounded-xl text-sm hover:bg-emerald-100 transition">Approve</button>
                                            <button onClick={() => updateStatus(item.id, 'Rejected')} className="flex-1 bg-red-50 text-red-500 font-bold py-2 rounded-xl text-sm hover:bg-red-100 transition">Reject</button>
                                        </div>
                                    ) : (
                                        <p className={`mt-3 text-xs font-bold ${color} text-right uppercase tracking-wide`}>{status}</p>
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
