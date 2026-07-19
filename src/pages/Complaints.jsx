import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

export default function Complaints() {
    const navigate = useNavigate();
    const [studentData, setStudentData] = useState(null);
    const [formData, setFormData] = useState({ title: '', desc: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) setStudentData(userDoc.data());
            } else {
                navigate("/");
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!studentData || !studentData.schoolId) {
            console.log("Profile incomplete. Missing School ID. Please contact admin.");
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, "complaints"), {
                schoolId: studentData.schoolId,
                title: formData.title,
                desc: formData.desc,
                studentName: studentData.name || studentData.firstName || auth.currentUser.email,
                studentId: auth.currentUser.uid,
                studentClass: studentData.class || "N/A",
                status: "pending",
                createdAt: serverTimestamp()
            });
            console.log("Complaint Submitted Successfully! Admin will check it soon.");
            navigate('/dashboard');
        } catch(e) {
            console.log("Error saving complaint: " + e.message);
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-50 p-4 font-sans min-h-screen">
            <div className="max-w-md mx-auto">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-6">
                    <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-red-600 transition">
                        <i className="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Support & Complaints</h1>
                    <div></div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
                            <i className="fas fa-hands-helping"></i>
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">How can we help you?</h2>
                        <p className="text-xs text-gray-500 mt-1">Your concern will be directly sent to your school Admin securely.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Subject / Topic <span className="text-red-500">*</span></label>
                            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Issue with Fees, Bus delay, etc." className="w-full p-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 bg-gray-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Describe your concern <span className="text-red-500">*</span></label>
                            <textarea value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} required placeholder="Write your problem in detail here..." className="w-full p-3.5 border border-gray-200 rounded-xl outline-none h-32 focus:ring-2 focus:ring-red-500 bg-gray-50 resize-none"></textarea>
                        </div>
                        <button type="submit" disabled={submitting} className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 shadow-md transition flex justify-center items-center mt-2 text-lg">
                            {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i> Sending...</> : <><i className="fas fa-paper-plane mr-2"></i> Submit to Admin</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
