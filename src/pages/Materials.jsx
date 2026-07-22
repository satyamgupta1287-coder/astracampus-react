import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";

export default function Materials() {
    const navigate = useNavigate();
    const [currentClass, setCurrentClass] = useState("");
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentTab, setCurrentTab] = useState("book");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const studentClass = userDoc.data().class;
                    const studentSchoolId = userDoc.data().schoolId;
                    setCurrentClass(studentClass);

                    if (!studentClass || !studentSchoolId) {
                        setError("Profile Incomplete! Please ask admin to update your class/school profile.");
                        setLoading(false);
                        return;
                    }

                    const q = query(collection(db, "study_materials"), where("schoolId", "==", studentSchoolId));
                    const unsubscribeMaterials = onSnapshot(q, (snapshot) => {
                        const docs = [];
                        snapshot.forEach((docSnap) => {
                            const data = docSnap.data();
                            if(String(data.targetClass) === String(studentClass)) {
                                docs.push({ id: docSnap.id, ...data });
                            }
                        });
                        docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
                        setMaterials(docs);
                        setLoading(false);
                    });
                    return () => unsubscribeMaterials();
                } else {
                    navigate("/");
                }
            } else {
                navigate("/");
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]);

    const filteredMaterials = materials.filter(m => m.type === currentTab && (m.title?.toLowerCase().includes(searchTerm.toLowerCase()) || m.subject?.toLowerCase().includes(searchTerm.toLowerCase())));

    return (
        <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto min-h-screen bg-gray-50 pb-6 font-sans">
            <div className="bg-blue-600 text-white p-4 rounded-b-3xl shadow-md sticky top-0 z-50">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => navigate('/dashboard')} className="hover:bg-white/20 p-2 rounded-xl transition">
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1 className="text-lg font-bold">Study Materials</h1>
                    <div className="w-8"></div>
                </div>
                <div className="relative">
                    <i className="fas fa-search absolute left-4 top-3 text-gray-400"></i>
                    <input type="text" placeholder="Search subject or title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white text-gray-800 py-2.5 pl-10 pr-4 rounded-xl text-sm outline-none shadow-sm focus:ring-2 focus:ring-blue-300" />
                </div>
            </div>

            <div className="px-4 mt-4">
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    <button onClick={() => setCurrentTab('book')} className={`tab-btn px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${currentTab === 'book' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>Books</button>
                    <button onClick={() => setCurrentTab('notes')} className={`tab-btn px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${currentTab === 'notes' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>Notes</button>
                    <button onClick={() => setCurrentTab('pyq')} className={`tab-btn px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${currentTab === 'pyq' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>Prev. Year (PYQ)</button>
                    <button onClick={() => setCurrentTab('model')} className={`tab-btn px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${currentTab === 'model' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>Model Papers</button>
                </div>
            </div>

            <div className="px-4 mt-4 flex justify-between items-center">
                <p className="text-xs text-gray-500 font-bold uppercase">Showing resources for:</p>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded">
                    {currentClass ? `Class ${currentClass}` : 'Class ...'}
                </span>
            </div>

            <div className="px-4 mt-3">
                {loading ? (
                    <div className="text-center py-10">
                        <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-2"></i>
                        <p className="text-sm text-gray-500">Loading materials...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center mt-4">
                        <i className="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>
                        <p className="text-sm text-red-600 font-bold">{error.split('!')[0]}!</p>
                        <p className="text-xs text-gray-500 mt-1">{error.split('!')[1]}</p>
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center mt-4">
                        <i className="fas fa-folder-open text-gray-300 text-4xl mb-3"></i>
                        <p className="text-sm font-bold text-gray-600">No {currentTab}s found.</p>
                        <p className="text-xs text-gray-400 mt-1">Admin has not uploaded any {currentTab} for your class yet.</p>
                    </div>
                ) : (
                    filteredMaterials.map(data => (
                        <div key={data.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3 flex gap-4 items-center">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                <i className={`fas ${data.type === 'pyq' ? 'fa-history' : data.type === 'notes' ? 'fa-file-signature' : 'fa-book'} text-xl`}></i>
                            </div>
                            <div className="flex-grow">
                                <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{data.title}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{data.subject} {data.year && data.year !== 'N/A' ? `• ${data.year}` : ''}</p>
                            </div>
                            <a href={data.fileUrl} target="_blank" rel="noreferrer" className="w-10 h-10 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 transition flex-shrink-0">
                                <i className="fas fa-download text-sm"></i>
                            </a>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
