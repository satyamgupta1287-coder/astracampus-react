import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, addDoc, query, onSnapshot, doc, updateDoc, serverTimestamp, where, getDoc, deleteDoc } from 'firebase/firestore';

export default function CreateAssignment() {
    const navigate = useNavigate();
    const [adminSchoolId, setAdminSchoolId] = useState(null);
    
    const [title, setTitle] = useState("");
    const [targetClass, setTargetClass] = useState("");
    const [description, setDescription] = useState("");
    const [uploadedFileUrl, setUploadedFileUrl] = useState("");
    const [fileName, setFileName] = useState("");
    const [isPublishing, setIsPublishing] = useState(false);
    
    const [assignments, setAssignments] = useState([]);
    const [allSubmissions, setAllSubmissions] = useState([]);
    const [marksInputs, setMarksInputs] = useState({});

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
        const subUnsub = onSnapshot(collection(db, "submissions"), (subSnapshot) => {
            let subs = [];
            subSnapshot.forEach(d => subs.push({ id: d.id, ...d.data() }));
            setAllSubmissions(subs);
        });

        const qAssign = query(collection(db, "assignments"), where("schoolId", "==", adminSchoolId));
        const assignUnsub = onSnapshot(qAssign, (snapshot) => {
            let sortedDocs = [];
            snapshot.forEach(docSnap => sortedDocs.push({ id: docSnap.id, ...docSnap.data() }));
            sortedDocs.sort((a, b) => {
                const timeA = a.createdAt?.toMillis() || 0;
                const timeB = b.createdAt?.toMillis() || 0;
                return timeB - timeA;
            });
            setAssignments(sortedDocs);
        });

        return () => {
            subUnsub();
            assignUnsub();
        };
    }, [adminSchoolId]);

    const openUploadWidget = () => {
        if (window.cloudinary) {
            window.cloudinary.createUploadWidget({
                cloudName: 'dl1cddemu', 
                uploadPreset: 'upload', 
                resourceType: 'raw',
                clientAllowedFormats: ["pdf", "jpg", "png", "docx"]
            }, (error, result) => {
                if (!error && result && result.event === "success") {
                    let rawUrl = result.info.secure_url;
                    let url = rawUrl.includes('/upload/') ? rawUrl.replace('/upload/', '/upload/fl_attachment/') : rawUrl;
                    setUploadedFileUrl(url);
                    setFileName(result.info.original_filename);
                }
            }).open();
        }
    };

    const handlePublish = async () => {
        if (!adminSchoolId) return console.log("School ID missing!");
        if (!title.trim() || !targetClass) return console.log("Title and Class are required!");

        setIsPublishing(true);
        try {
            await addDoc(collection(db, "assignments"), {
                schoolId: adminSchoolId, 
                title: title.trim(),
                targetClass: targetClass,
                className: targetClass,
                description: description.trim(),
                fileUrl: uploadedFileUrl || "",
                createdAt: serverTimestamp()
            });
            console.log("🎉 Assignment Published!");
            setTitle(""); setTargetClass(""); setDescription(""); setUploadedFileUrl(""); setFileName("");
        } catch (e) {
            console.log("Error: " + e.message);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleSaveMarks = async (submissionId) => {
        const marksValue = marksInputs[submissionId];
        if (!marksValue || !marksValue.trim()) return console.log("Enter marks first!");
        try {
            await updateDoc(doc(db, "submissions", submissionId), { marks: marksValue.trim() });
            console.log("🎯 Marks saved successfully!");
        } catch (e) {
            console.log("Error updating marks: " + e.message);
        }
    };

    const handleDeleteAssignment = async (assignId) => {
        if (window.confirm("Are you sure you want to delete this assignment?")) {
            await deleteDoc(doc(db, "assignments", assignId));
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans pb-12">
            <header className="bg-gradient-to-r from-purple-700 to-indigo-800 p-6 text-white shadow-md text-center relative">
                <button onClick={() => navigate(-1)} className="absolute left-4 top-6 text-gray-300 hover:text-white transition">
                    <i className="fas fa-arrow-left text-xl"></i>
                </button>
                <h1 className="text-2xl font-bold mt-2">Assignment Control</h1>
                <p className="text-xs text-purple-200 mt-1">Upload assignments and grade submissions in one place</p>
            </header>

            <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i className="fas fa-plus-circle text-purple-600"></i> Create New Assignment
                    </h2>
                    
                    <div className="space-y-4">
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Assignment Title (e.g., Math Sheet 1)" className="w-full p-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-purple-500/20 text-gray-700" />
                        
                        <select value={targetClass} onChange={e => setTargetClass(e.target.value)} className="w-full p-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-purple-500/20 text-gray-700 bg-white">
                            <option value="">Select Target Class</option>
                            <option value="9">Class 9</option><option value="10">Class 10</option>
                            <option value="11">Class 11</option><option value="12">Class 12</option>
                        </select>

                        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Instructions/Description for students..." className="w-full p-3.5 border border-gray-200 rounded-xl outline-none h-24 focus:ring-2 ring-purple-500/20 text-gray-700"></textarea>

                        <button onClick={openUploadWidget} className="w-full bg-blue-50 text-blue-600 border border-blue-200 font-bold py-3 rounded-xl hover:bg-blue-100 transition flex justify-center items-center gap-2 text-sm shadow-sm">
                            <i className="fas fa-file-upload"></i> Upload Question PDF
                        </button>
                        {fileName && <p className="text-xs text-center font-semibold text-green-600"><i className="fas fa-check-circle"></i> Attached: {fileName}</p>}

                        <button onClick={handlePublish} disabled={isPublishing} className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl hover:bg-purple-700 transition shadow-md shadow-purple-500/20">
                            {isPublishing ? "Publishing..." : "Publish Assignment"}
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 px-1 flex items-center gap-2">
                        <i className="fas fa-folder-open text-indigo-600"></i> Active Assignments & Submissions
                    </h2>
                    <div className="space-y-4">
                        {assignments.length === 0 ? (
                            <div className="bg-white p-6 rounded-2xl text-center text-gray-400 text-sm shadow-sm">No assignments uploaded yet.</div>
                        ) : (
                            assignments.map(assign => {
                                const matchingSubmissions = allSubmissions.filter(sub => sub.assignmentId === assign.id);
                                return (
                                    <div key={assign.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[10px] bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full font-bold uppercase">Class {assign.targetClass}</span>
                                                <h3 className="font-bold text-gray-800 text-base mt-2">{assign.title}</h3>
                                                {assign.fileUrl && <a href={assign.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 font-semibold inline-block mt-1 hover:underline"><i className="fas fa-download text-[10px]"></i> View Qn Paper</a>}
                                            </div>
                                            <button onClick={() => handleDeleteAssignment(assign.id)} className="text-red-400 hover:text-red-600 transition"><i className="fas fa-trash"></i></button>
                                        </div>
                                        
                                        <div className="border-t border-gray-100 pt-3">
                                            <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Student Submissions ({matchingSubmissions.length})</h4>
                                            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                                                {matchingSubmissions.length === 0 ? (
                                                    <p className="text-xs text-gray-400 italic py-2 px-1">No submissions yet.</p>
                                                ) : (
                                                    matchingSubmissions.map(sub => (
                                                        <div key={sub.id} className="bg-gray-50 p-3 rounded-xl border border-gray-200/60 space-y-2 mt-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs font-bold text-gray-700"><i className="fas fa-user text-gray-400 mr-1"></i>{sub.studentName}</span>
                                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${sub.marks === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                                    {sub.marks === 'Pending' ? 'Unchecked' : 'Graded'}
                                                                </span>
                                                            </div>
                                                            <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="block text-center bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold py-1.5 rounded-lg transition">
                                                                <i className="fas fa-eye"></i> Student's Copy
                                                            </a>
                                                            <div className="flex gap-2 items-center">
                                                                <input type="text" value={marksInputs[sub.id] !== undefined ? marksInputs[sub.id] : (sub.marks === 'Pending' ? '' : sub.marks)} onChange={(e) => setMarksInputs({...marksInputs, [sub.id]: e.target.value})} placeholder="Marks (e.g., 9/10)" className="w-full p-1.5 text-xs border rounded-lg outline-none focus:border-purple-500 bg-white" />
                                                                <button onClick={() => handleSaveMarks(sub.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition">Save</button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
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
