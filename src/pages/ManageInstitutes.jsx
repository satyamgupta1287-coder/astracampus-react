import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase-init';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function ManageInstitutes() {
    const navigate = useNavigate();
    const [instName, setInstName] = useState("");
    const [instAddress, setInstAddress] = useState("");
    const [instPhone, setInstPhone] = useState("");
    const [instEmail, setInstEmail] = useState("");
    const [schoolId, setSchoolId] = useState("");
    
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const adminDoc = await getDoc(doc(db, 'users', user.uid));
                if (adminDoc.exists()) {
                    const sid = adminDoc.data().schoolId;
                    setSchoolId(sid);
                    
                    if (sid) {
                        const instDoc = await getDoc(doc(db, "institutes", sid));
                        if (instDoc.exists()) {
                            const data = instDoc.data();
                            setInstName(data.name || "");
                            setInstAddress(data.address || "");
                            setInstPhone(data.phone || "");
                            setInstEmail(data.email || "");
                        }
                    }
                }
                setLoading(false);
            } else {
                navigate('/');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleSave = async () => {
        if (!instName || !schoolId) return console.log("Institute name is required.");
        setIsSaving(true);
        try {
            await setDoc(doc(db, "institutes", schoolId), { 
                name: instName, 
                address: instAddress,
                phone: instPhone,
                email: instEmail
            }, { merge: true });
            console.log("Institute Details Updated!");
            navigate(-1);
        } catch (error) {
            console.log("Error: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="bg-gray-50 p-4 min-h-screen">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto bg-white rounded-2xl shadow-sm p-6 mt-10 border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-indigo-600 transition">
                        <i className="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h2 className="text-xl font-bold text-gray-800">Institute Details</h2>
                    <div></div>
                </div>
                
                <p className="text-sm text-slate-500 mb-6">These details will be used on the Fee Receipts and reports.</p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Institute Name</label>
                        <input type="text" value={instName} onChange={e => setInstName(e.target.value)} placeholder="e.g. AstraCampus Public School" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Address</label>
                        <textarea value={instAddress} onChange={e => setInstAddress(e.target.value)} placeholder="e.g. 123 Education Lane, Knowledge City, IN" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium h-24 resize-none"></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label>
                        <input type="text" value={instPhone} onChange={e => setInstPhone(e.target.value)} placeholder="e.g. 1800-1234-5678" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
                        <input type="email" value={instEmail} onChange={e => setInstEmail(e.target.value)} placeholder="e.g. info@astracampus.edu" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
                    </div>
                    
                    <button onClick={handleSave} disabled={isSaving} className="w-full bg-indigo-600 text-white font-bold py-3.5 mt-4 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-md">
                        {isSaving ? "Updating..." : "Save Details"}
                    </button>
                </div>
            </div>
        </div>
    );
}
