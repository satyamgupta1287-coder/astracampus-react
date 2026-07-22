import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";

export default function Gallery() {
    const navigate = useNavigate();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalImg, setModalImg] = useState(null);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const schoolId = userDoc.data().schoolId;
                    if (schoolId) {
                        const galleryQuery = query(collection(db, "gallery"), where("schoolId", "==", schoolId));
                        const unsubGallery = onSnapshot(galleryQuery, (snapshot) => {
                            const docs = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
                            docs.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
                            setImages(docs);
                            setLoading(false);
                        });
                        return () => unsubGallery();
                    } else {
                        setLoading(false);
                    }
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
        <div className="bg-gray-50 pb-20 font-sans min-h-screen">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
                <div className="bg-pink-500 text-white p-4 rounded-b-3xl shadow-md sticky top-0 z-50">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => navigate('/dashboard')} className="hover:bg-white/20 p-2 rounded-xl transition">
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <h1 className="text-lg font-bold">School Gallery</h1>
                        <div className="w-8"></div>
                    </div>
                    <p className="text-xs text-pink-100 text-center pb-2">Memories & Events!</p>
                </div>

                <div className="px-4 mt-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 md:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 lg:grid-cols-5 lg:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {loading ? (
                            <div className="col-span-2 text-center py-10">
                                <i className="fas fa-spinner fa-spin text-3xl text-pink-500 mb-2"></i>
                                <p className="text-sm text-gray-500">Loading memories...</p>
                            </div>
                        ) : images.length === 0 ? (
                            <div className="col-span-2 bg-white p-8 rounded-2xl border border-gray-100 text-center mt-4">
                                <i className="far fa-images text-gray-300 text-5xl mb-3"></i>
                                <p className="text-sm font-bold text-gray-600">Gallery is empty.</p>
                                <p className="text-xs text-gray-400 mt-1">Check back later for event photos!</p>
                            </div>
                        ) : (
                            images.map(data => {
                                const dateStr = data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString() : '';
                                return (
                                    <div key={data.id} onClick={() => setModalImg({url: data.imageUrl, caption: data.caption, date: dateStr})} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition group">
                                        <div className="h-40 overflow-hidden relative">
                                            <img src={data.imageUrl} alt="Gallery" className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-3">
                                                <i className="fas fa-expand text-white text-sm"></i>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h4 className="font-bold text-gray-800 text-xs truncate">{data.caption}</h4>
                                            <p className="text-[9px] text-gray-400 mt-0.5">{dateStr}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {modalImg && (
                <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col justify-center items-center p-4 backdrop-blur-sm transition-all duration-300">
                    <button onClick={() => setModalImg(null)} className="absolute top-6 right-6 text-white/70 hover:text-white p-2 text-2xl">
                        <i className="fas fa-times"></i>
                    </button>
                    <img src={modalImg.url} alt="Full Screen" className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-2xl border border-white/10" />
                    <div className="mt-6 text-center w-full max-w-sm">
                        <h3 className="text-white font-bold text-lg mb-1">{modalImg.caption || 'School Event'}</h3>
                        <p className="text-white/50 text-xs font-medium">{modalImg.date}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
