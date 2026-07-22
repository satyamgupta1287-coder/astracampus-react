import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore";

export default function Courses() {
    const navigate = useNavigate();
    const [currentUserData, setCurrentUserData] = useState(null);
    const [courses, setCourses] = useState([]);
    const [coursePhotoMap, setCoursePhotoMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [successCourseName, setSuccessCourseName] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (!user) { navigate("/"); return; }

            const unsubUser = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
                if (!userDoc.exists()) return;
                const userData = { uid: user.uid, ...userDoc.data() };
                setCurrentUserData(userData);
                const schoolId = String(userData.schoolId || "").trim();

                const unsubMeta = onSnapshot(query(collection(db, "courseMeta"), where("schoolId", "==", schoolId)), (metaSnap) => {
                    const photos = {};
                    metaSnap.forEach((d) => { if (d.data().course) photos[d.data().course] = d.data().photoUrl; });
                    setCoursePhotoMap(photos);
                });

                const unsubVideo = onSnapshot(query(collection(db, "videos"), where("schoolId", "==", schoolId)), (videoSnap) => {
                    const courseSet = new Set();
                    videoSnap.forEach((d) => { if (d.data().course) courseSet.add(d.data().course); });
                    setCourses(Array.from(courseSet).sort());
                    setLoading(false);
                });

                return () => { unsubMeta(); unsubVideo(); };
            });
            return () => unsubUser();
        });
        return () => unsubscribeAuth();
    }, [navigate]);

    const buyCourse = (courseName, price) => {
        if (!window.Razorpay) {
            console.log("Payment gateway not loaded yet.");
            return;
        }
        const options = {
            key: "rzp_test_T5RF77BGnGrTIV", 
            amount: price * 100,
            currency: "INR",
            name: "AstraCampus Premium",
            description: "Unlock: " + courseName,
            handler: async function (response) {
                try {
                    await updateDoc(doc(db, "users", currentUserData.uid), { purchasedCourses: arrayUnion(courseName) });
                    setSuccessCourseName(courseName);
                    setShowSuccessModal(true);
                } catch (err) { console.log("Error: " + err.message); }
            },
            prefill: { name: currentUserData.name, email: currentUserData.email, contact: currentUserData.phone },
            theme: { color: "#5a4bda" }
        };
        const rzp = new window.Razorpay(options); 
        rzp.open();
    };

    return (
        <div className="pb-10 font-sans bg-slate-50 min-h-screen">
            <div className="bg-blue-600 text-white px-5 py-5 rounded-b-[24px] shadow-md flex items-center gap-4 sticky top-0 z-50">
                <button onClick={() => navigate('/dashboard')} className="text-white hover:text-blue-200 transition text-lg active:scale-95">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-lg font-bold flex items-center gap-2">
                    <i className="fas fa-crown text-yellow-300"></i> Pro Batches
                </h1>
            </div>

            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-5 mt-6">
                <h3 className="font-bold text-slate-800 mb-4 text-lg px-1 flex items-center gap-2">Premium Courses</h3>
                
                <div className="space-y-6">
                    {loading ? (
                        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 text-center">
                            <p className="text-sm text-slate-400 font-medium"><i className="fas fa-spinner fa-spin mr-2"></i>Loading batches...</p>
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="bg-white p-8 rounded-[20px] border text-center shadow-sm">
                            <p className="text-sm text-slate-500 font-bold">No batches available right now.</p>
                        </div>
                    ) : (
                        courses.map(course => {
                            const isPurchased = (currentUserData.purchasedCourses || []).includes(course);
                            const photo = coursePhotoMap[course] || 'https://via.placeholder.com/600x338/e2e8f0/94a3b8?text=Course+Cover';
                            const encodedCourse = encodeURIComponent(course);

                            if (isPurchased) {
                                return (
                                    <div key={course} className="bg-white rounded-2xl shadow-md border border-emerald-200 overflow-hidden relative">
                                        <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-lg z-10 shadow-sm"><i className="fas fa-check-circle mr-1"></i> ENROLLED</div>
                                        <div className="w-full relative aspect-[16/9] bg-slate-100 cursor-pointer" onClick={() => navigate(`/course-subjects?course=${encodedCourse}`)}>
                                            <img src={photo} className="w-full h-full object-cover" alt="Course Cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                        </div>
                                        <div className="p-4">
                                            <h2 className="text-lg font-bold text-slate-800 leading-tight mb-4">{course}</h2>
                                            <button onClick={() => navigate(`/course-subjects?course=${encodedCourse}`)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition shadow-lg shadow-emerald-200 flex justify-center items-center gap-2">CONTINUE LEARNING <i className="fas fa-arrow-right"></i></button>
                                        </div>
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={course} className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden relative">
                                        <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-br-xl z-10 shadow-sm tracking-wide">ONLINE</div>
                                        <div className="w-full relative aspect-[16/9] bg-slate-100 cursor-pointer" onClick={() => navigate(`/course-subjects?course=${encodedCourse}`)}>
                                            <img src={photo} className="w-full h-full object-cover" alt="Course Cover" />
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <h2 className="text-[17px] font-black text-slate-800 leading-tight">{course}</h2>
                                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200">Hinglish</span>
                                            </div>
                                            <div className="bg-slate-900 text-white text-[10px] font-bold px-3 py-2.5 rounded-xl mb-4 flex justify-between items-center shadow-inner">
                                                <span className="text-slate-200">Premium Features <span className="text-white">Included</span></span>
                                                <span className="bg-gradient-to-r from-[#d4af37] to-[#aa8017] text-black px-2.5 py-0.5 rounded shadow-sm tracking-wide">INFINITY</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 mb-4">
                                                <span className="text-[22px] font-black text-[#5a4bda]">₹499</span>
                                                <span className="text-sm text-slate-400 line-through font-medium">₹1,999</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={() => navigate(`/course-subjects?course=${encodedCourse}`)} className="flex-1 border-2 border-[#5a4bda] text-[#5a4bda] font-bold py-2.5 rounded-xl text-sm active:scale-95 transition tracking-wide">EXPLORE</button>
                                                <button onClick={() => buyCourse(course, 499)} className="flex-1 bg-[#5a4bda] hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm active:scale-95 transition shadow-lg shadow-indigo-200 tracking-wide">BUY NOW</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        })
                    )}
                </div>
            </div>

            {showSuccessModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center px-4">
                    <div className="bg-white w-full max-w-sm rounded-[24px] p-6 text-center shadow-2xl animate-pulse">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 text-4xl mx-auto mb-4 shadow-inner">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Payment Successful!</h2>
                        <p className="text-sm text-slate-500 mb-6">Welcome to the Premium Batch: <br/><strong className="text-blue-600">{successCourseName}</strong></p>
                        <button onClick={() => setShowSuccessModal(false)} className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl active:scale-95 transition shadow-lg shadow-emerald-200">Start Learning Now</button>
                    </div>
                </div>
            )}
        </div>
    );
}
