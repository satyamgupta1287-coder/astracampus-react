import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function ManageMaterials() {
    const navigate = useNavigate();
    const [adminSchoolId, setAdminSchoolId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [className, setClassName] = useState("10");
    const [year, setYear] = useState("");
    const [category, setCategory] = useState("notes");

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

    const handleUploadClick = () => {
        if (!title.trim()) return console.log("Please enter a title first!");
        
        if (window.cloudinary) {
            window.cloudinary.createUploadWidget({
                cloudName: 'dl1cddemu', 
                uploadPreset: 'upload',
                resourceType: 'raw' 
            }, async (err, result) => {
                if (!err && result.event === "success") {
                    if (!adminSchoolId) return console.log("School ID missing! Please refresh.");
                    
                    setIsSaving(true);
                    try {
                        await addDoc(collection(db, "study_materials"), { 
                            schoolId: adminSchoolId, 
                            title: title || 'Untitled',
                            subject: subject || 'General',
                            year: year || 'N/A',
                            targetClass: className,
                            type: category,
                            fileUrl: result.info.secure_url,
                            createdAt: serverTimestamp()
                        });
                        try {
                            await addDoc(collection(db, "notifications"), {
                                schoolId: adminSchoolId,
                                targetClass: className,
                                title: "New Study Material",
                                message: `${title || 'Untitled'} added for ${subject || 'General'}`,
                                type: "material",
                                createdAt: serverTimestamp()
                            });
                        } catch (err) { console.error(err); }
                        console.log("File uploaded successfully! ✅");
                        setTitle("");
                        setSubject("");
                    } catch (e) {
                        console.log("Error saving: " + e.message);
                    } finally {
                        setIsSaving(false);
                    }
                }
            }).open();
        }
    };

    return (
        <div className="bg-gray-50 p-4 font-sans pb-24 min-h-screen">
            <div className="max-w-md mx-auto">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-4">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-blue-600 transition">
                        <i className="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Study Materials</h1>
                    <div></div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-t-4 border-blue-500">
                    <h2 className="text-sm font-bold text-gray-400 uppercase mb-4"><i className="fas fa-file-pdf text-blue-500 mr-2"></i>Upload Material</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Title *</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Chapter 1 Notes" className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Science" className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Target Class *</label>
                                <select value={className} onChange={e => setClassName(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-blue-500">
                                    <option value="9">Class 9</option>
                                    <option value="10">Class 10</option>
                                    <option value="11">Class 11</option>
                                    <option value="12">Class 12</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Year (Optional)</label>
                                <input type="text" value={year} onChange={e => setYear(e.target.value)} placeholder="e.g., 2026" className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Category *</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-blue-500">
                                    <option value="book">Books</option>
                                    <option value="notes">Notes</option>
                                    <option value="pyq">PYQ</option>
                                    <option value="model">Model Papers</option>
                                </select>
                            </div>
                        </div>

                        <button onClick={handleUploadClick} disabled={isSaving} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 shadow-md transition flex justify-center items-center mt-2 disabled:opacity-50">
                            {isSaving ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-cloud-upload-alt mr-2"></i>}
                            {isSaving ? "Saving..." : "Select & Upload PDF"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
