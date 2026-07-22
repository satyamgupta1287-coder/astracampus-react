import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { doc, getDoc, collection, onSnapshot, query, orderBy, where } from "firebase/firestore";

export default function Notices() {
    const navigate = useNavigate();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if(userDoc.exists()) {
                    const schoolId = userDoc.data().schoolId;
                    const studentClass = String(userDoc.data().class || "");

                    const q = query(collection(db, "announcements"), where("schoolId", "==", schoolId), orderBy("createdAt", "desc"));
                    const unsub = onSnapshot(q, (snapshot) => {
                        const docs = [];
                        snapshot.forEach((docSnap) => {
                            const data = docSnap.data();
                            const target = String(data.targetClass);
                            if(target === "All" || target === studentClass) {
                                docs.push({ id: docSnap.id, ...data });
                            }
                        });
                        setNotices(docs);
                        setLoading(false);
                    });
                    return () => unsub();
                } else {
                    navigate("/");
                }
            } else {
                navigate("/");
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]);

    return (
        <div className="bg-gray-50 p-4 font-sans pb-20 min-h-screen">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6 pt-4">
                    <button onClick={() => navigate('/dashboard')} className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 text-gray-600 hover:text-yellow-600 transition">
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Notice Board</h1>
                    <div className="w-10"></div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm p-6 min-h-[75vh] border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center"><i className="fas fa-bullhorn text-yellow-500 mr-2"></i> Latest Updates</h2>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-10">
                                <i className="fas fa-spinner fa-spin text-3xl text-yellow-500 mb-2"></i>
                                <p className="text-sm text-gray-500">Checking for notices...</p>
                            </div>
                        ) : notices.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
                                <i className="fas fa-check-circle text-4xl text-gray-300 mb-3"></i>
                                <p className="text-gray-500 font-bold">You're all caught up!</p>
                                <p className="text-xs text-gray-400 mt-1">No active announcements right now.</p>
                            </div>
                        ) : (
                            notices.map(data => {
                                const dateStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Just now';
                                return (
                                    <div key={data.id} className="border-l-4 border-yellow-500 bg-yellow-50/50 p-5 rounded-r-2xl border-y border-r border-gray-100 shadow-sm relative">
                                        <span className="absolute top-4 right-4 text-[10px] text-gray-400 font-bold"><i className="far fa-clock mr-1"></i>{dateStr}</span>
                                        <h4 className="font-bold text-gray-800 text-base pr-20 mb-2">{data.title}</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">{data.description || data.message}</p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
