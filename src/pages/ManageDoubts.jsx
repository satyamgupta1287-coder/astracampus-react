import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, where, getDoc } from 'firebase/firestore';

export default function ManageDoubts() {
    const navigate = useNavigate();
    const [adminSchoolId, setAdminSchoolId] = useState(null);
    const [allDoubts, setAllDoubts] = useState([]);
    const [filter, setFilter] = useState("Pending");

    const [modalData, setModalData] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [isReplying, setIsReplying] = useState(false);

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
        const doubtsQuery = query(collection(db, "doubts"), where("schoolId", "==", adminSchoolId), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(doubtsQuery, (snapshot) => {
            let doubts = [];
            snapshot.forEach((docSnap) => {
                doubts.push({ id: docSnap.id, ...docSnap.data() });
            });
            setAllDoubts(doubts);
        });
        return () => unsub();
    }, [adminSchoolId]);

    const filteredDoubts = filter === "All" ? allDoubts : allDoubts.filter(d => d.status === filter);

    const openReplyModal = (doubt) => {
        setModalData(doubt);
        setReplyText("");
    };

    const submitReply = async () => {
        if (!replyText.trim()) return console.log("Please type a reply first.");
        setIsReplying(true);
        try {
            await updateDoc(doc(db, "doubts", modalData.id), {
                reply: replyText,
                status: "Resolved"
            });
            try {
                await addDoc(collection(db, "notifications"), {
                    schoolId: adminSchoolId,
                    userId: modalData.studentId,
                    title: "Doubt Resolved",
                    message: `Your doubt in ${modalData.subject} has been answered.`,
                    type: "doubt_reply",
                    createdAt: serverTimestamp()
                });
            } catch (err) { console.error(err); }
            setModalData(null);
        } catch (error) {
            console.log("Error sending reply: " + error.message);
        } finally {
            setIsReplying(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this doubt?")) {
            await deleteDoc(doc(db, "doubts", id));
        }
    };

    return (
        <div className="bg-gray-50 p-4 font-sans pb-24 min-h-screen relative">
            <div className="max-w-md mx-auto">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-4">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-blue-600 transition">
                        <i className="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Student Doubts</h1>
                    <div></div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border-t-4 border-indigo-500">
                    <label className="block text-sm font-bold text-gray-700 mb-2"><i className="fas fa-filter text-indigo-500 mr-2"></i>Filter by Status</label>
                    <select value={filter} onChange={e => setFilter(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-indigo-500 font-medium text-sm">
                        <option value="All">All Doubts</option>
                        <option value="Pending">Pending (Needs Reply)</option>
                        <option value="Resolved">Resolved (Answered)</option>
                    </select>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-lg font-bold text-gray-800">Doubts & Questions</h2>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{filteredDoubts.length} Found</span>
                    </div>
                    
                    <div className="space-y-4">
                        {filteredDoubts.length === 0 ? (
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                                <i className="fas fa-check-circle text-gray-300 text-4xl mb-3"></i>
                                <p className="text-sm font-bold text-gray-600">All clear!</p>
                                <p className="text-xs text-gray-400 mt-1">No {filter.toLowerCase()} doubts found.</p>
                            </div>
                        ) : (
                            filteredDoubts.map((data) => {
                                const isPending = data.status === "Pending";
                                return (
                                    <div key={data.id} className="p-4 border rounded-2xl bg-white shadow-sm relative">
                                        <button onClick={() => handleDelete(data.id)} className="absolute top-4 right-4 text-red-300 hover:text-red-500 transition">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                        
                                        <div className="flex items-start gap-3 mb-2 pr-6">
                                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                {data.studentName?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h4 className="font-bold text-gray-800 text-sm">{data.studentName}</h4>
                                                    {isPending ? (
                                                        <span className="bg-yellow-100 text-yellow-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Pending</span>
                                                    ) : (
                                                        <span className="bg-green-100 text-green-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Resolved</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">Class {data.targetClass} • {data.subject}</p>
                                            </div>
                                        </div>
                                        
                                        <p className="text-sm text-gray-800 font-medium bg-gray-50 p-2 rounded-lg border border-gray-100">Q: {data.question}</p>
                                        
                                        {isPending ? (
                                            <button onClick={() => openReplyModal(data)} className="w-full mt-3 bg-indigo-50 text-indigo-600 font-bold py-2 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition text-xs"><i className="fas fa-reply mr-1"></i> Give Reply</button>
                                        ) : (
                                            <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs text-gray-700 font-medium"><i className="fas fa-check text-green-500 mr-1"></i> <b>Your Reply:</b> {data.reply}</div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {modalData && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
                        <button onClick={() => setModalData(null)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
                            <i className="fas fa-times text-xl"></i>
                        </button>
                        
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center text-2xl mb-4 mx-auto shadow-inner">
                            <i className="fas fa-reply"></i>
                        </div>
                        <h2 className="text-lg font-bold text-center text-gray-800 mb-1">Reply to Student</h2>
                        <p className="text-[10px] text-center text-gray-500 font-bold mb-4 uppercase">{modalData.studentName} | Class {modalData.targetClass}</p>

                        <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Question:</p>
                            <p className="text-sm text-gray-700 font-medium">{modalData.question}</p>
                        </div>

                        <div className="mb-5">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Your Reply *</label>
                            <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type the answer here..." className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 h-28 focus:ring-2 focus:ring-indigo-500 text-sm resize-none"></textarea>
                        </div>

                        <button onClick={submitReply} disabled={isReplying} className="w-full bg-indigo-500 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-600 shadow-md transition flex justify-center items-center">
                            {isReplying ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-paper-plane mr-2"></i>} {isReplying ? "Sending..." : "Send Reply"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
