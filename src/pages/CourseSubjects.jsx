import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";

export default function CourseSubjects() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const selectedCourse = params.get('course');
    
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedCourse) {
            navigate("/courses");
            return;
        }

        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                navigate("/");
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (!userDoc.exists()) {
                    setError("User profile not found in database.");
                    setLoading(false);
                    return;
                }

                const userData = userDoc.data();
                const schoolId = String(userData.schoolId || "").trim();
                const studentClass = String(userData.class || "").trim();

                const q = query(collection(db, "videos"), where("schoolId", "==", schoolId));
                const unsub = onSnapshot(q, (snapshot) => {
                    const subjectMap = new Map();
                    snapshot.forEach((d) => {
                        const data = d.data();
                        if (
                            String(data.targetClass || "").trim() === studentClass &&
                            data.course === selectedCourse &&
                            data.subject
                        ) {
                            const existing = subjectMap.get(data.subject) || { teacherName: data.teacherName || '', count: 0 };
                            existing.count += 1;
                            if (!existing.teacherName && data.teacherName) existing.teacherName = data.teacherName;
                            subjectMap.set(data.subject, existing);
                        }
                    });

                    setSubjects(Array.from(subjectMap.entries()).sort((a,b) => a[0].localeCompare(b[0])));
                    setLoading(false);
                }, (err) => {
                    setError("Error loading subjects: " + err.message);
                    setLoading(false);
                });
                return () => unsub();
            } catch (err) {
                setError("Error: " + err.message);
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, [navigate, selectedCourse]);

    const palette = [
        { icon: 'fa-flask', bg: 'bg-blue-50', text: 'text-blue-600' },
        { icon: 'fa-atom', bg: 'bg-purple-50', text: 'text-purple-600' },
        { icon: 'fa-square-root-variable', bg: 'bg-emerald-50', text: 'text-emerald-600' },
        { icon: 'fa-graduation-cap', bg: 'bg-amber-50', text: 'text-amber-600' },
        { icon: 'fa-microscope', bg: 'bg-rose-50', text: 'text-rose-600' },
    ];

    return (
        <div className="pb-10 font-sans bg-slate-50 min-h-screen">
            <div className="bg-blue-600 text-white px-5 py-5 rounded-b-[24px] shadow-md flex items-center gap-4 sticky top-0 z-50">
                <button onClick={() => navigate('/courses')} className="text-white hover:text-blue-200 transition text-lg active:scale-95">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-lg font-bold flex items-center gap-2 truncate">
                    <i className="fas fa-book-open"></i> <span className="truncate">{selectedCourse || 'Subjects'}</span>
                </h1>
            </div>

            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-5 mt-6">
                <h3 className="font-bold text-slate-800 mb-4 text-sm px-1 flex items-center gap-2">
                    <i className="fas fa-chalkboard text-slate-400"></i> Choose a Subject
                </h3>

                <div className="space-y-3">
                    {loading ? (
                        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 text-center">
                            <p className="text-sm text-slate-400 font-medium"><i className="fas fa-spinner fa-spin mr-2"></i>Loading subjects...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 p-6 rounded-[20px] border border-red-100 text-center">
                            <p className="text-xs text-red-500 font-bold break-words">{error}</p>
                        </div>
                    ) : subjects.length === 0 ? (
                        <div className="bg-white p-8 rounded-[20px] border text-center shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 text-2xl mx-auto mb-3"><i className="fas fa-video-slash"></i></div>
                            <p className="text-sm text-slate-500 font-bold">No subjects found for this course.</p>
                        </div>
                    ) : (
                        subjects.map(([subject, info], i) => {
                            const style = palette[i % palette.length];
                            return (
                                <div key={subject} onClick={() => navigate(`/lectures?course=${encodeURIComponent(selectedCourse)}&subject=${encodeURIComponent(subject)}`)} 
                                     className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition">
                                    <div className={`w-12 h-12 ${style.bg} ${style.text} rounded-2xl flex items-center justify-center text-lg shrink-0`}>
                                        <i className={`fas ${style.icon}`}></i>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 text-sm truncate">{subject}</h4>
                                        <p className="text-[11px] text-slate-400 font-medium truncate">
                                            {info.teacherName ? <><i className="fas fa-user mr-1"></i>{info.teacherName} &middot; </> : ''}{info.count} video{info.count > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <i className="fas fa-chevron-right text-slate-300 text-sm"></i>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
