import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

export default function Assignments() {
    const navigate = useNavigate();
    const [currentUserData, setCurrentUserData] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [studentSubmissions, setStudentSubmissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [uploadAlert, setUploadAlert] = useState(false);
    const [currentAssignId, setCurrentAssignId] = useState("");

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userSnap = await getDoc(doc(db, "users", user.uid));
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setCurrentUserData({ uid: user.uid, ...data });

                    const subQuery = query(collection(db, "submissions"), where("studentId", "==", user.uid));
                    const unsubSub = onSnapshot(subQuery, (subSnapshot) => {
                        const subs = {};
                        subSnapshot.forEach(d => {
                            subs[d.data().assignmentId] = d.data();
                        });
                        setStudentSubmissions(subs);
                        
                        const q = query(collection(db, "assignments"), where("schoolId", "==", data.schoolId));
                        const unsubAssign = onSnapshot(q, (snapshot) => {
                            const targetClassStr = String(data.class || "");
                            const filteredDocs = snapshot.docs.filter(docSnap => {
                                const item = docSnap.data();
                                const itemClass = item.targetClass || item.className || "";
                                return String(itemClass) === targetClassStr;
                            });
                            filteredDocs.sort((a, b) => {
                                const timeA = a.data().createdAt?.toMillis() || 0;
                                const timeB = b.data().createdAt?.toMillis() || 0;
                                return timeB - timeA;
                            });
                            setAssignments(filteredDocs.map(d => ({ id: d.id, ...d.data() })));
                            setLoading(false);
                        });
                        return () => unsubAssign();
                    });
                    return () => unsubSub();
                } else {
                    navigate("/");
                }
            } else {
                navigate("/");
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]);

    const handleUpload = (assignId) => {
        setCurrentAssignId(assignId);
        window.cloudinary.createUploadWidget({
            cloudName: 'dl1cddemu',
            uploadPreset: 'upload',
            resourceType: 'raw',
            clientAllowedFormats: ["pdf", "jpg", "png"]
        }, async (err, result) => {
            if (!err && result && result.event === "success") {
                try {
                    let rawUrl = result.info.secure_url;
                    let finalUrl = rawUrl.includes('/upload/') ? rawUrl.replace('/upload/', '/upload/fl_attachment/') : rawUrl;

                    await addDoc(collection(db, "submissions"), {
                        assignmentId: assignId,
                        studentId: auth.currentUser.uid,
                        studentName: currentUserData.name || currentUserData.firstName || "Unknown Student",
                        className: currentUserData.class || "N/A",
                        schoolId: currentUserData.schoolId,
                        fileUrl: finalUrl,
                        marks: "Pending",
                        submittedAt: serverTimestamp()
                    });
                    setUploadAlert(true);
                    setTimeout(() => setUploadAlert(false), 4000);
                } catch (error) {
                    console.log("Database Error: " + error.message);
                }
            }
        }).open();
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans pb-20">
            <header className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white shadow-md rounded-b-[2.5rem] mb-6 flex items-center gap-4 relative">
                <button onClick={() => navigate('/dashboard')} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl backdrop-blur-sm transition">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <div>
                    <h1 className="text-2xl font-bold">My Assignments</h1>
                    <p className="text-xs text-green-100 mt-0.5">Track Submissions & View Marks</p>
                </div>
            </header>

            {uploadAlert && (
                <div className="max-w-md mx-auto px-4 mb-4">
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
                        <i className="fas fa-check-circle text-green-500 text-lg"></i>
                        <span>Assignment submitted successfully!</span>
                    </div>
                </div>
            )}

            <main className="max-w-md mx-auto px-4 space-y-4">
                {loading ? (
                    <>
                        <div className="animate-pulse w-full h-32 bg-gray-200 rounded-2xl"></div>
                        <div className="animate-pulse w-full h-32 bg-gray-200 rounded-2xl"></div>
                    </>
                ) : assignments.length === 0 ? (
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center mt-6">
                        <i className="fas fa-clipboard-check text-4xl text-green-200 mb-3"></i>
                        <p className="text-gray-800 font-bold text-lg">All Caught Up!</p>
                        <p className="text-sm text-gray-400 mt-1">No assignments found for your class.</p>
                    </div>
                ) : (
                    assignments.map(item => {
                        const subInfo = studentSubmissions[item.id];
                        const qnUrl = item.fileUrl ? (item.fileUrl.includes('/upload/') ? item.fileUrl.replace('/upload/', '/upload/fl_attachment/') : item.fileUrl) : "#";
                        
                        return (
                            <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4 relative overflow-hidden transition-all hover:shadow-md">
                                {!subInfo ? (
                                    <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-blue-100">Pending</div>
                                ) : subInfo.marks === "Pending" ? (
                                    <div className="absolute top-0 right-0 bg-yellow-50 text-yellow-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-yellow-100">Submitted</div>
                                ) : (
                                    <div className="absolute top-0 right-0 bg-green-50 text-green-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-green-100">Checked</div>
                                )}

                                <h3 className="font-bold text-gray-800 text-lg pr-20">{item.title || 'Untitled'}</h3>
                                {item.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                                
                                {subInfo && subInfo.marks !== "Pending" && (
                                    <div className="mt-3 bg-green-50 border border-green-200/60 p-3 rounded-xl flex justify-between items-center">
                                        <span className="text-xs font-bold text-green-700"><i className="fas fa-star mr-1"></i> Your Score:</span>
                                        <span className="text-sm font-black text-green-800 bg-white px-2.5 py-0.5 rounded-md border border-green-300">{subInfo.marks}</span>
                                    </div>
                                )}

                                <div className="mt-4 flex gap-2">
                                    {item.fileUrl && (
                                        <a href={qnUrl} target="_blank" rel="noreferrer" className="flex-1 bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 py-2.5 rounded-xl font-bold text-center text-xs flex items-center justify-center gap-2 transition"><i className="fas fa-download text-gray-500"></i> View Qns</a>
                                    )}
                                    {!subInfo ? (
                                        <button onClick={() => handleUpload(item.id)} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-bold text-xs shadow-md shadow-green-500/20 flex items-center justify-center gap-2 transition">
                                            <i className="fas fa-upload"></i> Upload
                                        </button>
                                    ) : subInfo.marks === "Pending" ? (
                                        <button onClick={() => handleUpload(item.id)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition">
                                            <i className="fas fa-edit"></i> Re-upload
                                        </button>
                                    ) : (
                                        <button disabled className="flex-1 bg-gray-100 text-gray-400 py-2.5 rounded-xl font-bold text-xs cursor-not-allowed flex items-center justify-center gap-2">
                                            <i className="fas fa-lock"></i> Locked
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </main>
        </div>
    );
}
