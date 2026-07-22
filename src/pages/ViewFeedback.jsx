import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';

export default function ViewFeedback() {
    const navigate = useNavigate();
    const [adminSchoolId, setAdminSchoolId] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);

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
        const q = query(collection(db, "feedback"), where("schoolId", "==", adminSchoolId));
        const unsub = onSnapshot(q, (snapshot) => {
            let items = [];
            snapshot.forEach(d => items.push({ id: d.id, ...d.data() }));
            items.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setFeedbacks(items);
        });
        return () => unsub();
    }, [adminSchoolId]);

    return (
        <div className="bg-slate-50 pb-10 min-h-screen font-sans">
            <div className="bg-sky-600 text-white px-5 py-5 rounded-b-[24px] shadow-md flex items-center gap-4 sticky top-0 z-50">
                <button onClick={() => navigate(-1)} className="text-white hover:text-sky-200 transition text-lg active:scale-95">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-lg font-bold">Student Feedback</h1>
            </div>

            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-5 mt-6">
                <div className="space-y-4">
                    {feedbacks.length === 0 ? (
                        <div className="bg-white p-6 rounded-2xl border text-center"><p className="text-sm text-slate-400 font-medium">No feedback received yet.</p></div>
                    ) : (
                        feedbacks.map(item => {
                            const dateStr = item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString('en-GB', {day:'numeric', month:'short'}) : 'Recently';
                            
                            let icon = "fa-comment-dots text-slate-500";
                            if (item.category === 'Suggestion') icon = "fa-lightbulb text-amber-500";
                            if (item.category === 'Academics') icon = "fa-book text-blue-500";
                            if (item.category === 'Facilities') icon = "fa-building text-emerald-500";
                            
                            return (
                                <div key={item.id} className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center border">
                                                <i className={`fas ${icon} text-sm`}></i>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-xs">{item.category}</h4>
                                                <p className="text-[10px] text-slate-400 font-medium">From: {item.studentName}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold">{dateStr}</span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">{item.message}</p>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
