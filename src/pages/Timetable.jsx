import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";

export default function Timetable() {
    const navigate = useNavigate();
    const [currentDay, setCurrentDay] = useState("Monday");
    const [allSchedule, setAllSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const { schoolId, class: studentClass } = userDoc.data();
                    const ttQuery = query(collection(db, "timetable"), where("schoolId", "==", schoolId), where("targetClass", "==", String(studentClass)));
                    const unsubTT = onSnapshot(ttQuery, (snapshot) => {
                        const schedule = [];
                        snapshot.forEach(doc => schedule.push(doc.data()));
                        setAllSchedule(schedule);
                        setLoading(false);
                    });
                    return () => unsubTT();
                } else {
                    navigate("/");
                }
            } else {
                navigate("/");
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]);

    const todaySchedule = allSchedule.filter(s => s.day === currentDay).sort((a, b) => a.time.localeCompare(b.time));

    return (
        <div className="pb-10 font-sans bg-slate-50 min-h-screen">
            <div className="bg-indigo-600 text-white px-5 py-5 rounded-b-[24px] shadow-md flex items-center gap-4 sticky top-0 z-50">
                <button onClick={() => navigate('/dashboard')} className="text-white hover:text-indigo-100 transition text-lg active:scale-95">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-lg font-bold">Class Timetable</h1>
            </div>

            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto mt-5">
                <div className="flex overflow-x-auto gap-2 px-5 pb-2 no-scrollbar">
                    {days.map(day => (
                        <button key={day} onClick={() => setCurrentDay(day)} className={`px-5 py-2 rounded-full text-sm font-bold shrink-0 transition ${currentDay === day ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200'}`}>
                            {day.substring(0,3)}
                        </button>
                    ))}
                </div>

                <div className="px-5 mt-4 space-y-3">
                    {loading ? (
                        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 text-center">
                            <p className="text-sm text-slate-400 font-medium">Loading schedule...</p>
                        </div>
                    ) : todaySchedule.length === 0 ? (
                        <div className="bg-white p-8 rounded-[20px] shadow-sm border border-slate-100 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 text-2xl mx-auto mb-3"><i className="fas fa-bed"></i></div>
                            <p className="text-sm text-slate-500 font-bold">No classes scheduled for {currentDay}.</p>
                        </div>
                    ) : (
                        todaySchedule.map((period, index) => (
                            <div key={index} className="bg-white p-4 rounded-[20px] shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] border border-slate-100 flex gap-4 items-center">
                                <div className="w-14 h-14 rounded-[14px] bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center shrink-0">
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase">Period</span>
                                    <span className="text-lg font-black text-indigo-600">{index + 1}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-base">{period.subject}</h4>
                                    <p className="text-[11px] text-slate-500 font-medium mt-0.5"><i className="far fa-clock text-indigo-400 mr-1"></i> {period.time}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5"><i className="fas fa-user-tie mr-1"></i> {period.teacher}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
