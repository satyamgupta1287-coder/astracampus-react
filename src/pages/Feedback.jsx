import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, addDoc, getDoc, doc, serverTimestamp } from "firebase/firestore";

export default function Feedback() {
    const navigate = useNavigate();
    const [currentUserData, setCurrentUserData] = useState(null);
    const [formData, setFormData] = useState({ category: 'Suggestion', message: '' });
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" });

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) setCurrentUserData({ uid: user.uid, ...userDoc.data() });
            } else {
                navigate("/");
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!currentUserData) return;
        setSubmitting(true);
        try {
            await addDoc(collection(db, "feedback"), {
                schoolId: currentUserData.schoolId,
                studentId: currentUserData.uid,
                studentName: currentUserData.name || currentUserData.firstName,
                category: formData.category,
                message: formData.message,
                createdAt: serverTimestamp()
            });
            try {
                await addDoc(collection(db, "notifications"), {
                    schoolId: currentUserData.schoolId,
                    targetRole: "admin",
                    title: "New Feedback Received",
                    message: `${currentUserData.name || currentUserData.firstName} submitted feedback: ${formData.category}`,
                    type: "feedback",
                    createdAt: serverTimestamp()
                });
            } catch (err) { console.error(err); }
            setFormData({ category: 'Suggestion', message: '' });
            setMsg({ text: "🎉 Thank you! Your feedback has been recorded.", type: "text-emerald-600" });
        } catch(err) {
            setMsg({ text: "❌ Error: " + err.message, type: "text-red-500" });
        }
        setSubmitting(false);
        setTimeout(() => setMsg({ text: "", type: "" }), 5000);
    };

    return (
        <div className="pb-10 font-sans bg-slate-50 min-h-screen">
            <div className="bg-sky-500 text-white px-5 py-5 rounded-b-[24px] shadow-md flex items-center gap-4 sticky top-0 z-50">
                <button onClick={() => navigate('/dashboard')} className="text-white hover:text-sky-100 transition text-lg active:scale-95">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-lg font-bold">Share Feedback</h1>
            </div>

            <div className="max-w-md mx-auto px-5 mt-6">
                <div className="text-center mb-6 px-4">
                    <div className="w-16 h-16 bg-sky-100 text-sky-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                        <i className="fas fa-heart"></i>
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">We value your thoughts!</h2>
                    <p className="text-xs text-slate-500 mt-1">Help us improve your school experience by sharing your suggestions or feedback.</p>
                </div>

                <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 mb-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                            <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-slate-50">
                                <option value="Suggestion">💡 General Suggestion</option>
                                <option value="Academics">📚 Academics & Teaching</option>
                                <option value="Facilities">🏫 School Facilities</option>
                                <option value="App Feedback">📱 App UI & Experience</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Your Feedback</label>
                            <textarea rows="5" required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="Write your feedback here..." className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-slate-50 resize-none"></textarea>
                        </div>
                        {msg.text && <p className={`text-xs font-bold text-center ${msg.type}`}>{msg.text}</p>}
                        <button type="submit" disabled={submitting} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3.5 rounded-xl transition shadow-md shadow-sky-200">
                            {submitting ? "Submitting..." : "Submit Feedback"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
