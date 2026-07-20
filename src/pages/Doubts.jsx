import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { doc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

export default function Doubts() {
    const navigate = useNavigate();
    const [studentData, setStudentData] = useState(null);
    const [doubts, setDoubts] = useState([]);
    const [formData, setFormData] = useState({ subject: '', question: '' });
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setStudentData(userDoc.data());
                    
                    const q = query(collection(db, "doubts"), where("studentId", "==", user.uid), orderBy("createdAt", "desc"));
                    const unsubDoubts = onSnapshot(q, (snapshot) => {
                        const docs = [];
                        snapshot.forEach(docSnap => docs.push({ id: docSnap.id, ...docSnap.data() }));
                        setDoubts(docs);
                        setLoading(false);
                    });
                    return () => unsubDoubts();
                } else {
                    navigate("/");
                }
            } else {
                navigate("/");
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!studentData || !studentData.class || !studentData.schoolId) {
            console.log("Your profile is incomplete. Cannot send doubt.");
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, "doubts"), {
                studentId: auth.currentUser.uid,
                studentName: studentData.name || studentData.firstName,
                targetClass: studentData.class,
                schoolId: studentData.schoolId,
                subject: formData.subject,
                question: formData.question,
                reply: "", 
                status: "Pending", 
                createdAt: serverTimestamp()
            });
            try {
                await addDoc(collection(db, "notifications"), {
                    schoolId: studentData.schoolId,
                    targetRole: "admin",
                    title: "New Doubt Submitted",
                    message: `${formData.subject}: ${formData.question}`,
                    type: "doubt",
                    createdAt: serverTimestamp()
                });
            } catch (err) { console.error(err); }
            console.log("Doubt sent successfully! Your teacher will reply soon.");
            setFormData({ subject: '', question: '' });
        } catch (error) {
            console.log("Error sending doubt: " + error.message);
        }
        setSubmitting(false);
    };

    return (
        <div className="bg-gray-50 pb-20 font-sans min-h-screen">
            <div className="max-w-md mx-auto">
                <div className="bg-blue-600 text-white p-4 rounded-b-3xl shadow-md sticky top-0 z-50">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => navigate('/dashboard')} className="hover:bg-white/20 p-2 rounded-xl transition">
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <h1 className="text-lg font-bold">Ask Doubts</h1>
                        <div className="w-8"></div>
                    </div>
                    <p className="text-xs text-blue-200 text-center pb-2">Ask your teachers anything!</p>
                </div>

                <div className="px-4 mt-6">
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 mb-6">
                        <h2 className="text-sm font-bold text-gray-800 mb-3"><i className="fas fa-question-circle text-blue-500 mr-2"></i>New Doubt</h2>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Subject (e.g., Math, Science)" className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                            <div>
                                <textarea required value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})} placeholder="Type your full question or doubt here..." className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 h-24 focus:ring-2 focus:ring-blue-500 text-sm resize-none"></textarea>
                            </div>
                            <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-md transition text-sm flex justify-center items-center">
                                {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i> Sending...</> : <><i className="fas fa-paper-plane mr-2"></i> Send to Teacher</>}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="px-4">
                    <h2 className="text-sm font-bold text-gray-800 mb-3 px-1">My Previous Doubts</h2>
                    <div className="space-y-3">
                        {loading ? (
                            <div className="text-center py-8">
                                <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-2"></i>
                                <p className="text-sm text-gray-500">Loading your doubts...</p>
                            </div>
                        ) : doubts.length === 0 ? (
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center">
                                <i className="far fa-comments text-gray-300 text-4xl mb-3"></i>
                                <p className="text-sm font-bold text-gray-600">No doubts asked yet.</p>
                                <p className="text-xs text-gray-400 mt-1">If you have any questions, use the form above.</p>
                            </div>
                        ) : (
                            doubts.map(data => {
                                const dateStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'Just now';
                                const isPending = data.status === "Pending";
                                return (
                                    <div key={data.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-gray-800 text-sm">{data.subject}</h4>
                                            {isPending ? (
                                                <span className="bg-yellow-100 text-yellow-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Pending</span>
                                            ) : (
                                                <span className="bg-green-100 text-green-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Resolved</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mb-2"><i className="far fa-clock mr-1"></i>{dateStr}</p>
                                        <p className="text-xs text-gray-700 font-medium">Q: {data.question}</p>
                                        {isPending ? (
                                            <div className="mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs text-gray-400 italic">Waiting for teacher's reply...</div>
                                        ) : (
                                            <div className="mt-2 bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-gray-700 font-medium"><i className="fas fa-reply text-blue-400 mr-1"></i> <b>Reply:</b> {data.reply}</div>
                                        )}
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
