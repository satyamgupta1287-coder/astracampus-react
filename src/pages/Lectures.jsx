import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore";

export default function Lectures() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const selectedCourse = params.get('course');
    const selectedSubject = params.get('subject');

    const [currentUserData, setCurrentUserData] = useState(null);
    const [isPurchased, setIsPurchased] = useState(false);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [videoInfo, setVideoInfo] = useState({ id: '', title: '' });
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        if (!selectedCourse || !selectedSubject) {
            navigate("/courses");
            return;
        }

        // Initialize wistia script
        if (!document.getElementById('wistia_script')) {
            const script = document.createElement('script');
            script.id = 'wistia_script';
            script.src = "https://fast.wistia.net/assets/external/E-v1.js";
            script.async = true;
            document.body.appendChild(script);
        }

        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (!user) { navigate("/"); return; }

            const unsubUser = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
                if (!userDoc.exists()) return;
                const userData = { uid: user.uid, ...userDoc.data() };
                setCurrentUserData(userData);
                const schoolId = String(userData.schoolId || "").trim();
                const studentClass = String(userData.class || "").trim();
                const purchasedCourses = userData.purchasedCourses || [];
                setIsPurchased(purchasedCourses.includes(selectedCourse));

                const unsubVideo = onSnapshot(query(collection(db, "videos"), where("schoolId", "==", schoolId)), (snapshot) => {
                    let vids = [];
                    snapshot.forEach((d) => {
                        const data = d.data();
                        if (String(data.targetClass || "").trim() === studentClass && data.course === selectedCourse && data.subject === selectedSubject) {
                            vids.push({ id: d.id, ...data });
                        }
                    });
                    vids.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
                    setVideos(vids);
                    setLoading(false);
                });
                return () => unsubVideo();
            });
            return () => unsubUser();
        });
        return () => unsubscribeAuth();
    }, [navigate, selectedCourse, selectedSubject]);

    const buyCourse = (price) => {
        if (!window.Razorpay) {
            console.log("Payment gateway not loaded yet.");
            return;
        }
        const options = {
            key: "rzp_test_T5RF77BGnGrTIV", 
            amount: price * 100,
            currency: "INR",
            name: "AstraCampus Premium",
            description: "Unlock: " + selectedCourse,
            handler: async function (response) {
                try {
                    await updateDoc(doc(db, "users", currentUserData.uid), { purchasedCourses: arrayUnion(selectedCourse) });
                    setShowSuccessModal(true);
                } catch (err) { console.log("Error: " + err.message); }
            },
            prefill: { name: currentUserData.name, email: currentUserData.email, contact: currentUserData.phone },
            theme: { color: "#5a4bda" }
        };
        const rzp = new window.Razorpay(options); 
        rzp.open();
    };

    const startVideo = (wistiaId, title) => {
        setVideoInfo({ id: wistiaId, title });
        setShowVideoModal(true);
    };

    return (
        <div className="pb-10 font-sans bg-slate-50 min-h-screen">
            <div className="bg-blue-600 text-white px-5 py-5 rounded-b-[24px] shadow-md flex items-center gap-4 sticky top-0 z-50">
                <button onClick={() => navigate(`/course-subjects?course=${encodeURIComponent(selectedCourse)}`)} className="text-white hover:text-blue-200 transition text-lg active:scale-95">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-lg font-bold flex items-center gap-2 truncate">
                    <i className="fas fa-play-circle"></i> <span className="truncate">{selectedSubject || 'Lectures'}</span>
                </h1>
            </div>

            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-5 mt-6">
                <h3 className="font-bold text-slate-800 mb-4 text-sm px-1 flex items-center gap-2">
                    <i className="fas fa-list text-slate-400"></i> Course Content
                </h3>
                
                <div className="space-y-5">
                    {loading ? (
                        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 text-center">
                            <p className="text-sm text-slate-400 font-medium"><i className="fas fa-spinner fa-spin mr-2"></i>Loading videos...</p>
                        </div>
                    ) : videos.length === 0 ? (
                        <div className="bg-white p-8 rounded-[20px] border text-center shadow-sm">
                            <p className="text-sm text-slate-500 font-bold">No lectures uploaded yet.</p>
                        </div>
                    ) : (
                        videos.map(video => {
                            const safeTitle = (video.title || "Untitled");

                            if (isPurchased) {
                                return (
                                    <div key={video.id} className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden mb-5">
                                        <div onClick={() => startVideo(video.wistiaId, safeTitle)} className="w-full relative bg-slate-900 cursor-pointer group" style={{aspectRatio: '16/9'}}>
                                            <img src={`https://fast.wistia.com/embed/medias/${video.wistiaId}/swatch`} className="absolute inset-0 w-full h-full object-cover opacity-90 group-active:opacity-100 transition" alt="Video cover" />
                                            <div className="absolute inset-0 flex items-center justify-center"><div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-xl"><i className="fas fa-play text-xl ml-1"></i></div></div>
                                        </div>
                                        <div className="p-4 flex justify-between items-center pb-2">
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1">{video.title}</h4>
                                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide"><i className="fas fa-chalkboard-teacher mr-1"></i>Class {video.targetClass}</p>
                                            </div>
                                        </div>
                                        {(video.notesUrl || video.testUrl) && (
                                            <div className="px-4 pb-4 flex gap-2 border-t border-slate-50 pt-3 mt-1">
                                                {video.notesUrl && <a href={video.notesUrl} target="_blank" rel="noreferrer" className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[11px] font-bold py-2 rounded-xl flex justify-center items-center gap-1.5 active:scale-95 transition"><i className="fas fa-file-pdf"></i> Class Notes</a>}
                                                {video.testUrl && <a href={video.testUrl} target="_blank" rel="noreferrer" className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-600 text-[11px] font-bold py-2 rounded-xl flex justify-center items-center gap-1.5 active:scale-95 transition"><i className="fas fa-file-alt"></i> DPP / Test</a>}
                                            </div>
                                        )}
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={video.id} className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden mb-5">
                                        <div onClick={() => buyCourse(499)} className="w-full relative bg-slate-900 cursor-pointer group" style={{aspectRatio: '16/9'}}>
                                            <img src={`https://fast.wistia.com/embed/medias/${video.wistiaId}/swatch`} className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale group-active:opacity-50 transition" alt="Video cover" />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-xl mb-2"><i className="fas fa-lock text-xl"></i></div>
                                                <span className="text-[10px] font-bold bg-[#5a4bda] px-3 py-1 rounded shadow-md tracking-wider">UNLOCK PREMIUM</span>
                                            </div>
                                        </div>
                                        <div className="p-4 flex justify-between items-center pb-2">
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1">{video.title}</h4>
                                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide"><i className="fas fa-chalkboard-teacher mr-1"></i>Class {video.targetClass}</p>
                                            </div>
                                        </div>
                                        {(video.notesUrl || video.testUrl) && (
                                            <div className="px-4 pb-4 flex gap-2 border-t border-slate-50 pt-3 mt-1">
                                                {video.notesUrl && <button onClick={() => buyCourse(499)} className="flex-1 bg-slate-50 text-slate-400 text-[11px] font-bold py-2 rounded-xl flex justify-center items-center gap-1.5 active:scale-95 transition"><i className="fas fa-lock"></i> Class Notes</button>}
                                                {video.testUrl && <button onClick={() => buyCourse(499)} className="flex-1 bg-slate-50 text-slate-400 text-[11px] font-bold py-2 rounded-xl flex justify-center items-center gap-1.5 active:scale-95 transition"><i className="fas fa-lock"></i> DPP / Test</button>}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        })
                    )}
                </div>
            </div>

            {showVideoModal && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center px-4">
                    <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl w-full bg-slate-900 rounded-[20px] overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <h3 className="text-white font-bold text-sm truncate pr-3">{videoInfo.title}</h3>
                            <button onClick={() => setShowVideoModal(false)} className="w-9 h-9 shrink-0 bg-white/10 hover:bg-white/20 rounded-full text-white flex justify-center items-center active:scale-90"><i className="fas fa-times"></i></button>
                        </div>
                        <div className="w-full relative bg-black" style={{aspectRatio: '16/9'}}>
                            <div className={`wistia_embed wistia_async_${videoInfo.id} seo=false videoFoam=false autoPlay=true playsinline=true`} style={{height:'100%', width:'100%', position:'relative'}}></div>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center px-4">
                    <div className="bg-white w-full max-w-sm rounded-[24px] p-6 text-center shadow-2xl animate-pulse">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 text-4xl mx-auto mb-4 shadow-inner">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Unlocked Successfully!</h2>
                        <p className="text-sm text-slate-500 mb-6">Enjoy your premium access.</p>
                        <button onClick={() => setShowSuccessModal(false)} className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl active:scale-95 transition">Watch Lectures</button>
                    </div>
                </div>
            )}
        </div>
    );
}
