import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, where, getDoc } from 'firebase/firestore';

export default function ManageNotices() {
    const navigate = useNavigate();
    const [adminSchoolId, setAdminSchoolId] = useState(null);
    const [notices, setNotices] = useState([]);
    const [isPosting, setIsPosting] = useState(false);

    const [title, setTitle] = useState("");
    const [targetClass, setTargetClass] = useState("All");
    const [description, setDescription] = useState("");

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
        const q = query(collection(db, "announcements"), where("schoolId", "==", adminSchoolId), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            let loaded = [];
            snapshot.forEach(docSnap => loaded.push({ id: docSnap.id, ...docSnap.data() }));
            setNotices(loaded);
        });
        return () => unsub();
    }, [adminSchoolId]);

    const handlePost = async (e) => {
        e.preventDefault();
        if (!adminSchoolId) return console.log("School ID missing!");

        setIsPosting(true);
        try {
            await addDoc(collection(db, "announcements"), {
                schoolId: adminSchoolId,
                title,
                targetClass,
                description,
                createdAt: serverTimestamp()
            });
            try {
                await addDoc(collection(db, "notifications"), {
                    schoolId: adminSchoolId,
                    targetClass: targetClass,
                    title: "New Notice",
                    message: title,
                    type: "notice",
                    createdAt: serverTimestamp()
                });
            } catch (err) { console.error(err); }
            console.log("Announcement Posted Successfully! 📢");
            setTitle("");
            setTargetClass("All");
            setDescription("");
        } catch (err) {
            console.log("Error: " + err.message);
        } finally {
            setIsPosting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this notice?")) {
            await deleteDoc(doc(db, "announcements", id));
        }
    };

    return (
        <div className="bg-gray-50 p-4 font-sans min-h-screen">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-4">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-blue-600">
                        <i className="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Announcements</h1>
                    <div></div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-t-4 border-yellow-500">
                    <h2 className="text-sm font-bold text-gray-400 uppercase mb-4"><i className="fas fa-bullhorn text-yellow-500 mr-2"></i>Post New Notice</h2>
                    <form onSubmit={handlePost} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Notice Title *</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g., Tomorrow is a Holiday" className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-yellow-500" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Target Audience *</label>
                            <select value={targetClass} onChange={e => setTargetClass(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-yellow-500">
                                <option value="All">All Classes (General Notice)</option>
                                {[...Array(12).keys()].map(i => <option key={i+1} value={i+1}>Class {i+1}</option>)}
                            </select>
                            <p className="text-[10px] text-gray-500 mt-1">Select "All Classes" to send to everyone.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Description / Details *</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="Write the full details of the announcement here..." className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 h-28 focus:ring-2 focus:ring-yellow-500"></textarea>
                        </div>

                        <button type="submit" disabled={isPosting} className="w-full bg-yellow-500 text-white font-bold py-3.5 rounded-xl hover:bg-yellow-600 shadow-md transition flex justify-center items-center">
                            {isPosting ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-paper-plane mr-2"></i>}
                            {isPosting ? "Posting..." : "Post Announcement"}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Active Announcements</h2>
                    <div className="space-y-4">
                        {notices.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-4">No active announcements.</p>
                        ) : (
                            notices.map(data => {
                                const dateStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'Just now';
                                const badgeClass = data.targetClass === 'All' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600';
                                const badgeText = data.targetClass === 'All' ? 'All Classes' : `Class ${data.targetClass}`;

                                return (
                                    <div key={data.id} className="p-4 border rounded-xl bg-gray-50 relative">
                                        <button onClick={() => handleDelete(data.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition">
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                        
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${badgeClass} mb-2 inline-block`}>{badgeText}</span>
                                        <h4 className="font-bold text-gray-800 text-sm mb-1 pr-6">{data.title}</h4>
                                        <p className="text-xs text-gray-600 mb-2">{data.description}</p>
                                        <p className="text-[9px] text-gray-400 font-medium"><i className="far fa-clock mr-1"></i>Posted: {dateStr}</p>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
