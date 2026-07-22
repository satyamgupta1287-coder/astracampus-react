import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, where, getDoc, serverTimestamp } from 'firebase/firestore';

export default function ManageGallery() {
    const navigate = useNavigate();
    const [adminSchoolId, setAdminSchoolId] = useState(null);
    const [caption, setCaption] = useState("");
    const [photos, setPhotos] = useState([]);

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
        const q = query(collection(db, "gallery"), where("schoolId", "==", adminSchoolId), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            let loaded = [];
            snapshot.forEach(docSnap => loaded.push({ id: docSnap.id, ...docSnap.data() }));
            setPhotos(loaded);
        });
        return () => unsub();
    }, [adminSchoolId]);

    const openUploadWidget = () => {
        if (window.cloudinary) {
            window.cloudinary.createUploadWidget({
                cloudName: 'dl1cddemu', 
                uploadPreset: 'upload',
                clientAllowedFormats: ["jpg", "png", "jpeg", "webp"]
            }, async (err, result) => {
                if (!err && result && result.event === "success") {
                    if (!adminSchoolId) return console.log("School ID missing!");
                    try {
                        await addDoc(collection(db, "gallery"), { 
                            schoolId: adminSchoolId, 
                            caption: caption || "School Memory", 
                            imageUrl: result.info.secure_url, 
                            createdAt: serverTimestamp()
                        });
                        try {
                            await addDoc(collection(db, "notifications"), {
                                schoolId: adminSchoolId,
                                title: "New Gallery Photo",
                                message: caption || "New photo added",
                                type: "gallery",
                                createdAt: serverTimestamp()
                            });
                        } catch (err) { console.error(err); }
                        setCaption("");
                    } catch (error) {
                        console.log("Error saving photo: " + error.message);
                    }
                }
            }).open();
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this photo?")) {
            await deleteDoc(doc(db, 'gallery', id));
        }
    };

    return (
        <div className="bg-gray-50 p-4 font-sans pb-24 min-h-screen">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-4">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-pink-500 transition">
                        <i className="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">School Gallery</h1>
                    <div></div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 border-t-4 border-pink-500">
                    <h2 className="text-sm font-bold text-gray-400 uppercase mb-4"><i className="fas fa-image text-pink-500 mr-2"></i>Add New Photo</h2>
                    <input type="text" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Write a short caption..." className="w-full p-3 border border-gray-200 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50" />
                    <button onClick={openUploadWidget} className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3.5 rounded-xl font-bold shadow-md transition flex justify-center items-center">
                        <i className="fas fa-upload mr-2"></i> Select & Upload Photo
                    </button>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Uploaded Photos</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 md:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 lg:grid-cols-5 lg:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                        {photos.length === 0 ? (
                            <p className="col-span-2 text-center text-sm text-gray-400 py-4">No photos uploaded yet.</p>
                        ) : (
                            photos.map(photo => (
                                <div key={photo.id} className="bg-gray-50 p-2 rounded-xl border border-gray-100 relative group">
                                    <img src={photo.imageUrl} alt={photo.caption} className="w-full h-32 object-cover rounded-lg shadow-sm" />
                                    <p className="text-xs text-gray-600 font-bold mt-2 truncate px-1">{photo.caption}</p>
                                    
                                    <button onClick={() => handleDelete(photo.id)} className="absolute top-3 right-3 bg-white text-red-500 w-8 h-8 rounded-full shadow-md flex items-center justify-center opacity-90 hover:opacity-100 transition">
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
