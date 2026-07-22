import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";

export default function LiveClasses() {
    const navigate = useNavigate();
    const [currentClass, setCurrentClass] = useState("");
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const studentClass = userDoc.data().class;
                    const studentSchoolId = userDoc.data().schoolId;
                    setCurrentClass(studentClass);

                    if (!studentClass || !studentSchoolId) {
                        setError("Incomplete Profile! Please ask admin to update your class/school profile.");
                        setLoading(false);
                        return;
                    }

                    const q = query(collection(db, "live_classes"), where("schoolId", "==", studentSchoolId));
                    const unsubscribeClasses = onSnapshot(q, (snapshot) => {
                        const docs = snapshot.docs
                            .filter(d => String(d.data().targetClass || d.data().className) === String(studentClass))
                            .sort((a, b) => {
                                const aTime = a.data().createdAt?.toMillis ? a.data().createdAt.toMillis() : 0;
                                const bTime = b.data().createdAt?.toMillis ? b.data().createdAt.toMillis() : 0;
                                return bTime - aTime;
                            })
                            .map(d => ({ id: d.id, ...d.data() }));
                        setClasses(docs);
                        setLoading(false);
                    });
                    return () => unsubscribeClasses();
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
        <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto min-h-screen bg-gray-50 pb-6 font-sans">
            <div className="bg-red-500 text-white p-4 rounded-b-3xl shadow-md sticky top-0 z-50">
                <div className="flex justify-between items-center">
                    <button onClick={() => navigate('/dashboard')} className="hover:bg-white/20 p-2 rounded-xl transition">
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1 className="text-lg font-bold">Live Classes</h1>
                    <div className="w-8"></div>
                </div>
            </div>

            <div className="px-4 mt-4 flex justify-between items-center">
                <p className="text-xs text-gray-500 font-bold uppercase">Showing classes for:</p>
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded">
                    {currentClass ? `Class ${currentClass}` : 'Class ...'}
                </span>
            </div>

            <div className="px-4 mt-3">
                {loading ? (
                    <div className="text-center py-10">
                        <i className="fas fa-spinner fa-spin text-3xl text-red-500 mb-2"></i>
                        <p className="text-sm text-gray-500">Loading live classes...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center mt-4">
                        <i className="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>
                        <p className="text-sm text-red-600 font-bold">{error.split('!')[0]}!</p>
                        <p className="text-xs text-gray-500 mt-1">{error.split('!')[1]}</p>
                    </div>
                ) : classes.length === 0 ? (
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center mt-4">
                        <i className="fas fa-video-slash text-gray-300 text-4xl mb-3"></i>
                        <p className="text-sm font-bold text-gray-600">No live classes scheduled.</p>
                        <p className="text-xs text-gray-400 mt-1">Check back later for Class {currentClass}.</p>
                    </div>
                ) : (
                    classes.map((cls) => (
                        <div key={cls.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3 flex items-center gap-4 text-left">
                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                                <i className="fas fa-video text-xl"></i>
                            </div>
                            <div className="flex-grow">
                                <h4 className="font-bold text-gray-800 text-sm">{cls.subject}</h4>
                                <p className="text-[10px] text-gray-500 font-bold mb-1">
                                    <i className="far fa-user text-gray-400 mr-1"></i>{cls.teacherName}
                                </p>
                                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">
                                    <i className="far fa-clock mr-1"></i>{cls.time}
                                </span>
                            </div>
                            <a href={cls.meetingLink} target="_blank" rel="noreferrer" className="bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition flex-shrink-0">
                                <i className="fas fa-play ml-0.5"></i>
                            </a>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
