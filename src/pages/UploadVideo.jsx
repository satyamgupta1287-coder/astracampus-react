import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, addDoc, getDoc, doc, deleteDoc, query, where, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

const WISTIA_ACCESS_TOKEN = "52e25c62ca626beb4dc90b4c6207ebc45861e5de7e6569d99c6ee0fe06b6b286";

export default function UploadVideo() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [adminSchoolId, setAdminSchoolId] = useState(null);
    const [allVideos, setAllVideos] = useState([]);
    const [allCourseMeta, setAllCourseMeta] = useState({});

    const [currentStep, setCurrentStep] = useState(1);
    const [activeCourse, setActiveCourse] = useState("");
    const [activeSubject, setActiveSubject] = useState("");

    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [isEditingCourse, setIsEditingCourse] = useState(false);
    const [editingMetaId, setEditingMetaId] = useState(null);
    const [newCourseName, setNewCourseName] = useState("");
    const [coursePrice, setCoursePrice] = useState("");
    const [courseOriginalPrice, setCourseOriginalPrice] = useState("");
    const [courseLanguage, setCourseLanguage] = useState("");
    const [courseFeatures, setCourseFeatures] = useState("");
    const [newCoursePhotoUrl, setNewCoursePhotoUrl] = useState("");

    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState("");

    const [targetClass, setTargetClass] = useState(localStorage.getItem('ast_class') || "");
    const [teacherName, setTeacherName] = useState(localStorage.getItem('ast_teacher') || "");
    const [title, setTitle] = useState("");
    const [videoFile, setVideoFile] = useState(null);
    const [notesUrl, setNotesUrl] = useState("");
    const [testUrl, setTestUrl] = useState("");

    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadBytes, setUploadBytes] = useState("");
    const [uploadStatus, setUploadStatus] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const adminDoc = await getDoc(doc(db, 'users', user.uid));
                if (adminDoc.exists()) {
                    setAdminSchoolId(adminDoc.data().schoolId || "UNKNOWN");
                }
            } else {
                navigate('/');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (!adminSchoolId) return;

        const unsubMeta = onSnapshot(query(collection(db, "courseMeta"), where("schoolId", "==", adminSchoolId)), (snap) => {
            let meta = {};
            snap.forEach(d => { meta[d.data().course] = { docId: d.id, ...d.data() }; });
            setAllCourseMeta(meta);
        });

        const unsubVideos = onSnapshot(query(collection(db, "videos"), where("schoolId", "==", adminSchoolId)), (snap) => {
            let vids = [];
            snap.forEach(d => {
                const data = d.data();
                if (data.course && data.course !== 'undefined' && data.subject && data.subject !== 'undefined') {
                    vids.push({ id: d.id, ...data });
                }
            });
            vids.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setAllVideos(vids);
        });

        return () => {
            unsubMeta();
            unsubVideos();
        };
    }, [adminSchoolId]);

    const formatBytes = (bytes) => {
        if (!bytes) return "0 MB";
        const mb = bytes / (1024 * 1024);
        return mb >= 1 ? mb.toFixed(1) + " MB" : (bytes / 1024).toFixed(0) + " KB";
    };

    const clearAppGarbage = () => {
        localStorage.removeItem('ast_teacher');
        localStorage.removeItem('ast_class');
        localStorage.removeItem('ast_course');
        localStorage.removeItem('ast_subject');
        console.log("Cache Cleared Successfully!");
        window.location.reload();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setVideoFile(file || null);
    };

    const openCloudinary = (type) => {
        if (window.cloudinary) {
            window.cloudinary.createUploadWidget({
                cloudName: 'dl1cddemu', 
                uploadPreset: 'upload', 
                resourceType: type === 'photo' ? 'image' : 'auto'
            }, (err, result) => {
                if (!err && result && result.event === "success") {
                    if (type === 'photo') setNewCoursePhotoUrl(result.info.secure_url);
                    if (type === 'notes') setNotesUrl(result.info.secure_url);
                    if (type === 'test') setTestUrl(result.info.secure_url);
                }
            }).open();
        }
    };

    const saveCourse = async () => {
        const cName = newCourseName.trim();
        if (!cName) return console.log("Enter valid course name!");
        const metaId = editingMetaId ? editingMetaId : `${adminSchoolId}_${cName}`.replace(/\s+/g, '_').toLowerCase();
        
        await setDoc(doc(db, "courseMeta", metaId), { 
            schoolId: adminSchoolId, 
            course: cName, 
            photoUrl: newCoursePhotoUrl || 'https://via.placeholder.com/600x338/e2e8f0/94a3b8?text=Course+Cover',
            price: Number(coursePrice || 499),
            originalPrice: Number(courseOriginalPrice || 1999),
            language: courseLanguage || 'Hinglish',
            features: courseFeatures || 'Live Classes, PDF Notes, Test Series'
        }, { merge: true });
        
        setIsCourseModalOpen(false);
        if (!isEditingCourse) {
            setActiveCourse(cName);
            setCurrentStep(2);
        }
    };

    const saveSubject = () => {
        if (!newSubjectName.trim()) return console.log("Enter valid subject name!");
        setIsSubjectModalOpen(false);
        setActiveSubject(newSubjectName.trim());
        setCurrentStep(3);
    };

    const uploadWithProgress = (formData) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://upload.wistia.com/');
            xhr.setRequestHeader('Authorization', 'Bearer ' + WISTIA_ACCESS_TOKEN);
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(percent);
                    setUploadBytes(`${formatBytes(e.loaded)} / ${formatBytes(e.total)}`);
                }
            };
            xhr.onload = () => { 
                if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText)); 
                else reject(new Error("Wistia Error: " + xhr.responseText)); 
            };
            xhr.onerror = () => reject(new Error("Network connection error"));
            xhr.send(formData);
        });
    };

    const handleVideoSubmit = async (e) => {
        e.preventDefault();
        if (!videoFile) return console.log("Select video file!");

        localStorage.setItem('ast_teacher', teacherName);
        localStorage.setItem('ast_class', targetClass);

        setIsUploading(true);
        setUploadStatus("Please wait, uploading video... (Do not close app)");

        try {
            const formData = new FormData();
            let finalFileName = videoFile.name || "lecture_video.mp4";
            if (!finalFileName.includes('.')) finalFileName += ".mp4";
            formData.append('file', videoFile, finalFileName);
            formData.append('name', title || "Untitled");

            const wistiaData = await uploadWithProgress(formData);
            if (!wistiaData || !wistiaData.hashed_id) throw new Error("Video ID not received from Wistia.");
            
            await addDoc(collection(db, "videos"), {
                schoolId: adminSchoolId || "UNKNOWN",
                course: activeCourse,      
                subject: activeSubject,    
                teacherName: teacherName,
                targetClass: targetClass,
                title: title || "Untitled",
                wistiaId: wistiaData.hashed_id,
                notesUrl: notesUrl || "", 
                testUrl: testUrl || "",   
                createdAt: serverTimestamp()
            });

            setTitle('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            setVideoFile(null);
            setNotesUrl('');
            setTestUrl('');
            setUploadStatus("✅ Published successfully!");
            setTimeout(() => setUploadStatus(""), 3000);
        } catch (error) {
            setUploadStatus("❌ Error: " + error.message);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Derived states
    const courseSet = new Set(Object.keys(allCourseMeta));
    allVideos.forEach(v => { if (v.course && v.course.trim() !== "") courseSet.add(v.course); });
    const courses = Array.from(courseSet).sort();

    const subjSet = new Set();
    allVideos.forEach(v => { if (v.course === activeCourse && v.subject && v.subject.trim() !== "") subjSet.add(v.subject); });
    const subjects = Array.from(subjSet).sort();

    const filteredVideos = allVideos.filter(v => v.course === activeCourse && v.subject === activeSubject);

    return (
        <div className="pb-10 bg-slate-50 min-h-screen font-sans">
            <div className="bg-blue-800 text-white px-5 py-4 rounded-b-[24px] shadow-md flex items-center gap-4 sticky top-0 z-50">
                <button onClick={() => currentStep === 3 ? setCurrentStep(2) : (currentStep === 2 ? setCurrentStep(1) : navigate(-1))} className="text-white hover:text-blue-200 transition text-lg active:scale-95">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-base font-bold truncate">{currentStep === 1 ? 'Manage Batches (Pro)' : (currentStep === 2 ? activeCourse : activeSubject)}</h1>
                    <p className="text-[10px] text-blue-200 font-medium truncate uppercase tracking-wider">
                        {currentStep === 1 ? 'Admin Area' : (currentStep === 2 ? `Courses / ${activeCourse}` : `${activeCourse} / ${activeSubject}`)}
                    </p>
                </div>
            </div>

            <div className="max-w-md mx-auto px-5 mt-6">
                {currentStep === 1 && (
                    <div className="space-y-4">
                        <button onClick={() => {
                            setIsEditingCourse(false); setEditingMetaId(null); setNewCourseName(""); setCoursePrice(""); setCourseOriginalPrice(""); setCourseLanguage(""); setCourseFeatures(""); setNewCoursePhotoUrl(""); setIsCourseModalOpen(true);
                        }} className="w-full bg-blue-50 border-2 border-dashed border-blue-200 text-blue-600 font-bold py-4 rounded-2xl flex justify-center items-center gap-2 active:scale-95 transition">
                            <i className="fas fa-plus-circle text-lg"></i> Create New Batch / Course
                        </button>
                        <h3 className="font-bold text-slate-800 text-sm mt-6 mb-2 px-1"><i className="fas fa-layer-group text-slate-400 mr-1"></i> Your Active Courses</h3>
                        <div className="space-y-3">
                            {courses.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No courses created yet.</p> : courses.map(course => {
                                const meta = allCourseMeta[course] || {};
                                return (
                                    <div key={course} className="bg-white p-3 rounded-[20px] shadow-sm border border-slate-100 flex items-center justify-between gap-3 relative">
                                        <div className="flex-1 flex items-center gap-3 cursor-pointer active:scale-95 transition" onClick={() => { setActiveCourse(course); setCurrentStep(2); }}>
                                            <img src={meta.photoUrl || 'https://via.placeholder.com/150'} alt="Course" className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-800 text-sm truncate">{course}</h4>
                                                <p className="text-[11px] text-slate-400">Tap to view subjects</p>
                                            </div>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); setIsEditingCourse(true); setEditingMetaId(meta.docId); setNewCourseName(course); setCoursePrice(meta.price); setCourseOriginalPrice(meta.originalPrice); setCourseLanguage(meta.language); setCourseFeatures(meta.features); setNewCoursePhotoUrl(meta.photoUrl); setIsCourseModalOpen(true); }} className="w-10 h-10 shrink-0 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full flex items-center justify-center border border-blue-100 shadow-sm z-10">
                                            <i className="fas fa-edit"></i>
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                        <button onClick={clearAppGarbage} className="w-full mt-6 py-3 text-xs font-bold text-red-500 bg-red-50 rounded-xl border border-red-100 active:scale-95 transition">
                            <i className="fas fa-broom mr-1"></i> Clear 'Undefined' Error Cache
                        </button>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-4">
                        <button onClick={() => { setNewSubjectName(""); setIsSubjectModalOpen(true); }} className="w-full bg-purple-50 border-2 border-dashed border-purple-200 text-purple-600 font-bold py-4 rounded-2xl flex justify-center items-center gap-2 active:scale-95 transition">
                            <i className="fas fa-plus-circle text-lg"></i> Add New Subject
                        </button>
                        <h3 className="font-bold text-slate-800 text-sm mt-6 mb-2 px-1"><i className="fas fa-book-open text-slate-400 mr-1"></i> Subjects in <span className="text-blue-600">{activeCourse}</span></h3>
                        <div className="space-y-3">
                            {subjects.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No subjects found.</p> : subjects.map(subj => (
                                <div key={subj} onClick={() => { setActiveSubject(subj); setCurrentStep(3); }} className="bg-white p-4 rounded-[20px] shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer active:scale-95 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><i className="fas fa-book"></i></div>
                                        <h4 className="font-bold text-slate-800 text-sm">{subj}</h4>
                                    </div>
                                    <i className="fas fa-chevron-right text-slate-300"></i>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div>
                        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 mb-8">
                            <h2 className="text-sm font-bold text-slate-800 mb-4"><i className="fas fa-cloud-upload-alt text-blue-500 mr-2"></i>Upload to <span className="text-blue-600">{activeSubject}</span></h2>
                            <form onSubmit={handleVideoSubmit} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Class</label><input type="text" value={targetClass} onChange={e => setTargetClass(e.target.value)} required placeholder="e.g. 10" className="w-full p-2.5 text-sm border rounded-xl outline-none focus:border-blue-500 bg-slate-50" /></div>
                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Teacher Name</label><input type="text" value={teacherName} onChange={e => setTeacherName(e.target.value)} required placeholder="e.g. Mr. Sharma" className="w-full p-2.5 text-sm border rounded-xl outline-none focus:border-blue-500 bg-slate-50" /></div>
                                </div>
                                <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Lecture Title / Topic</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Newton's Laws" className="w-full p-2.5 text-sm border rounded-xl outline-none focus:border-blue-500 bg-slate-50" /></div>
                                
                                <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 text-center bg-blue-50 relative overflow-hidden">
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/mp4,video/x-m4v,video/*" required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    <i className="fas fa-film text-blue-400 text-2xl mb-2"></i>
                                    <p className={`text-xs font-bold truncate px-2 ${videoFile ? 'text-blue-600' : 'text-slate-600'}`}>{videoFile ? videoFile.name : "Tap to select video (.mp4)"}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{videoFile ? formatBytes(videoFile.size) : ""}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <button type="button" onClick={() => openCloudinary('notes')} className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition ${notesUrl ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                                        <i className="fas fa-file-pdf text-xl mb-1"></i>
                                        <span className="text-[10px] font-bold uppercase tracking-wide">{notesUrl ? "Notes Attached ✓" : "Attach Notes"}</span>
                                    </button>
                                    <button type="button" onClick={() => openCloudinary('test')} className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition ${testUrl ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-purple-50 border-purple-200 text-purple-600'}`}>
                                        <i className="fas fa-file-alt text-xl mb-1"></i>
                                        <span className="text-[10px] font-bold uppercase tracking-wide">{testUrl ? "Test Attached ✓" : "Attach DPP / Test"}</span>
                                    </button>
                                </div>

                                {isUploading && (
                                    <div className="mt-3">
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-[10px] font-bold text-blue-600">{uploadProgress}%</span>
                                            <span className="text-[10px] text-slate-400">{uploadBytes}</span>
                                        </div>
                                    </div>
                                )}

                                <button type="submit" disabled={isUploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl mt-3 transition flex justify-center items-center gap-2 disabled:opacity-50">
                                    {isUploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-upload"></i>} 
                                    {isUploading ? "Uploading..." : "Start Upload & Publish"}
                                </button>
                                {uploadStatus && <p className={`text-[11px] text-center font-bold mt-2 ${uploadStatus.includes('Error') ? 'text-red-600' : 'text-blue-600'}`}>{uploadStatus}</p>}
                            </form>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-sm font-bold text-slate-800 mb-4 px-1 flex items-center justify-between">
                                <span><i className="fas fa-list text-blue-500 mr-1"></i> Uploaded Lectures</span>
                                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full">{filteredVideos.length}</span>
                            </h2>
                            <div className="space-y-3">
                                {filteredVideos.length === 0 ? <p className="text-sm text-slate-400 text-center">No videos uploaded in this subject.</p> : filteredVideos.map(video => (
                                    <div key={video.id} className="bg-white rounded-[20px] shadow-sm border border-slate-100 flex items-center gap-3 p-3">
                                        <img src={`https://fast.wistia.com/embed/medias/${video.wistiaId}/swatch`} alt="Thumbnail" className="w-24 h-16 rounded-xl object-cover bg-slate-200 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 text-xs mb-1 truncate">{video.title}</h4>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {video.targetClass && <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full">Class {video.targetClass}</span>}
                                                {video.notesUrl && <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full"><i className="fas fa-file-pdf"></i></span>}
                                                {video.testUrl && <span className="bg-purple-100 text-purple-700 text-[9px] font-bold px-2 py-0.5 rounded-full"><i className="fas fa-file-alt"></i></span>}
                                            </div>
                                        </div>
                                        <button onClick={() => { if(window.confirm("Delete this video?")) deleteDoc(doc(db, "videos", video.id)) }} className="w-9 h-9 shrink-0 bg-red-50 hover:bg-red-100 text-red-500 rounded-full flex items-center justify-center active:scale-90"><i className="fas fa-trash-alt text-sm"></i></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {isCourseModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 overflow-y-auto py-10">
                    <div className="bg-white w-full max-w-sm rounded-[24px] p-6 shadow-2xl my-auto">
                        <h3 className="font-bold text-slate-800 text-lg mb-4">{isEditingCourse ? "Edit Premium Batch" : "Create Premium Batch"}</h3>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Batch Name *</label>
                        <input type="text" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} disabled={isEditingCourse} placeholder="e.g. Arjuna JEE 2026" className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500 bg-slate-50 mb-3 text-sm" />
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Selling Price (₹)</label><input type="number" value={coursePrice} onChange={e => setCoursePrice(e.target.value)} className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500 bg-slate-50 text-sm" /></div>
                            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Original Price (₹)</label><input type="number" value={courseOriginalPrice} onChange={e => setCourseOriginalPrice(e.target.value)} className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500 bg-slate-50 text-sm" /></div>
                        </div>

                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Language</label>
                        <input type="text" value={courseLanguage} onChange={e => setCourseLanguage(e.target.value)} className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500 bg-slate-50 mb-3 text-sm" />

                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Features</label>
                        <textarea value={courseFeatures} onChange={e => setCourseFeatures(e.target.value)} rows="2" className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500 bg-slate-50 mb-3 text-sm"></textarea>
                        
                        <button type="button" onClick={() => openCloudinary('photo')} className="w-full p-3 text-sm border-2 border-dashed border-blue-200 rounded-xl bg-blue-50 text-blue-600 font-bold flex flex-col items-center justify-center gap-1 mb-4">
                            <i className="fas fa-image text-xl"></i> <span>{newCoursePhotoUrl ? "Photo Uploaded ✓" : "Upload Cover Photo"}</span>
                        </button>
                        
                        <div className="flex gap-3 mt-2">
                            <button onClick={() => setIsCourseModalOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold active:scale-95 transition">Cancel</button>
                            <button onClick={saveCourse} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold active:scale-95 transition">Save Batch</button>
                        </div>
                    </div>
                </div>
            )}

            {isSubjectModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-6">
                    <div className="bg-white w-full max-w-sm rounded-[24px] p-6 shadow-2xl">
                        <h3 className="font-bold text-slate-800 text-lg mb-4">Add Subject to <span className="text-blue-600">{activeCourse}</span></h3>
                        <input type="text" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} placeholder="e.g. Physics, Math" className="w-full p-3 border rounded-xl outline-none focus:border-purple-500 bg-slate-50 mb-5 text-sm" />
                        <div className="flex gap-3">
                            <button onClick={() => setIsSubjectModalOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold active:scale-95 transition">Cancel</button>
                            <button onClick={saveSubject} className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold active:scale-95 transition">Add Subject</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
