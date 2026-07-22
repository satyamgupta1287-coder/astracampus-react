import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";

export default function Attendance() {
    const navigate = useNavigate();
    const [attData, setAttData] = useState({ percentage: 0, presentCount: 0, absentCount: 0, records: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const schoolId = userDoc.data().schoolId;
                    const attQuery = query(collection(db, "attendance"), where("schoolId", "==", schoolId));
                    const unsubAtt = onSnapshot(attQuery, (snapshot) => {
                        let presentCount = 0;
                        let absentCount = 0;
                        let studentRecords = [];

                        snapshot.forEach(docSnap => {
                            const data = docSnap.data();
                            if(data.studentId === user.uid || data.studentEmail === user.email) {
                                studentRecords.push(data);
                                if(data.status === 'present') presentCount++;
                                else if(data.status === 'absent') absentCount++;
                            }
                        });

                        let totalCount = presentCount + absentCount;
                        let percentage = totalCount === 0 ? 0 : Math.round((presentCount / totalCount) * 100);

                        studentRecords.sort((a, b) => {
                            const dateA = a.date ? new Date(a.date) : new Date(0);
                            const dateB = b.date ? new Date(b.date) : new Date(0);
                            return dateB - dateA;
                        });

                        setAttData({ percentage, presentCount, absentCount, records: studentRecords });
                        setLoading(false);
                    });
                    return () => unsubAtt();
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
        <div className="pb-10 font-sans bg-slate-50 min-h-screen">
            <div className="bg-blue-600 text-white px-5 py-5 rounded-b-[24px] shadow-md flex items-center gap-4 sticky top-0 z-50">
                <button onClick={() => navigate('/dashboard')} className="text-white hover:text-blue-100 transition text-lg active:scale-95">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-lg font-bold">Attendance Record</h1>
            </div>

            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-5 mt-6">
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-slate-100 p-6 mb-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Overall Summary</p>
                    <div className="flex items-baseline gap-2 mb-4">
                        <h2 className="text-4xl font-black text-blue-600">{attData.percentage}%</h2>
                        <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Attendance</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full mb-6 overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${attData.percentage}%` }}></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 md:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 lg:grid-cols-5 lg:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                        <div className="bg-emerald-50/50 rounded-[16px] p-4 border border-emerald-100">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Total Present</p>
                            <h3 className="text-2xl font-black text-emerald-600">{attData.presentCount}</h3>
                        </div>
                        <div className="bg-red-50/50 rounded-[16px] p-4 border border-red-100">
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1">Total Absent</p>
                            <h3 className="text-2xl font-black text-red-500">{attData.absentCount}</h3>
                        </div>
                    </div>
                </div>

                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm px-1">
                    <i className="fas fa-calendar-day text-blue-500"></i> Daily Log
                </h3>
                
                <div className="space-y-3">
                    {loading ? (
                        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 text-center">
                            <p className="text-sm text-slate-400 font-medium">Loading records...</p>
                        </div>
                    ) : attData.records.length === 0 ? (
                        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 text-center">
                            <p className="text-sm text-slate-400 font-medium">No attendance records found yet.</p>
                        </div>
                    ) : (
                        attData.records.map((record, index) => {
                            const isPresent = record.status === 'present';
                            const dateString = record.date ? new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                            return (
                                <div key={record.id || record.date || index} className="bg-white p-4 rounded-[20px] shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] border border-slate-100 flex justify-between items-center transition hover:border-slate-200">
                                    <div className="flex items-center gap-3.5">
                                        <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 border ${isPresent ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-red-500 bg-red-50 border-red-100'}`}>
                                            <i className={`fas ${isPresent ? 'fa-check text-emerald-500' : 'fa-times text-red-500'}`}></i>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{dateString}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Daily Record</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider ${isPresent ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-red-500 bg-red-50 border-red-100'}`}>
                                        {isPresent ? 'Present' : 'Absent'}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
