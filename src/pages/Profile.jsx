import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function Profile() {
    const navigate = useNavigate();
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists() && userDoc.data().class) {
                        setData(userDoc.data());
                    } else {
                        const q = query(collection(db, "users"), where("email", "==", user.email));
                        const querySnapshot = await getDocs(q);
                        let adminDataFound = false;
                        let oldDocId = null;
                        let fullData = { email: user.email };

                        querySnapshot.forEach((docSnap) => {
                            if(docSnap.id !== user.uid) {
                                adminDataFound = true;
                                fullData = { ...docSnap.data(), ...fullData };
                                oldDocId = docSnap.id;
                            }
                        });

                        if (adminDataFound) {
                            await setDoc(userDocRef, fullData, { merge: true });
                            setData(fullData);
                            if(oldDocId) {
                                await deleteDoc(doc(db, "users", oldDocId));
                            }
                        } else if (userDoc.exists()) {
                            setData(userDoc.data());
                        } else {
                            setData({ email: user.email });
                        }
                    }
                } catch (error) {
                    console.error("Error fetching/syncing profile: ", error);
                    window.alert("Error loading profile details.");
                }
                setLoading(false);
            } else {
                navigate("/");
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]);

    const handleLogout = async () => {
        if(window.confirm("Are you sure you want to logout?")) {
            await signOut(auth);
            navigate("/");
        }
    };

    const getAddress = () => {
        let addressText = "N/A";
        if(data.currAddress) {
            addressText = data.currAddress;
            if(data.city) addressText += `, ${data.city}`;
            if(data.state) addressText += `, ${data.state}`;
        }
        return addressText;
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans pb-24">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto bg-gray-50 min-h-screen relative shadow-sm">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-44 rounded-b-[2.5rem] relative flex flex-col items-center pt-6 text-white shadow-lg">
                    <div className="flex justify-between items-center w-full px-6 mb-2">
                        <button onClick={() => navigate('/dashboard')} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl backdrop-blur-sm transition">
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <h1 className="text-xl font-bold tracking-wide">My Profile</h1>
                        <div className="w-9 h-9"></div> 
                    </div>
                    
                    <div className="absolute -bottom-12 w-24 h-24 bg-white rounded-full p-1 shadow-md border border-gray-100">
                        <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center overflow-hidden">
                            <img src={data.photoUrl || data.photoBase64 || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                        </div>
                    </div>
                </div>

                <div className="mt-16 text-center px-4">
                    <h2 className="text-2xl font-black text-gray-800 truncate">{loading ? "Syncing Data..." : (data.name || data.firstName || 'Student')}</h2>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">{loading ? "Please wait..." : `ID: ${data.studentId || data.admissionNo || 'N/A'}`}</p>
                </div>

                {!loading && (
                    <div className="px-4 mt-8 space-y-5">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">Academic Details</h3>
                            <div className="space-y-3">
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-lg"><i className="fas fa-school"></i></div>
                                    <div className="flex-1">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">School Code</p>
                                        <h4 className="text-base font-bold text-gray-800">{data.schoolId || 'Not Linked'}</h4>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-lg"><i className="fas fa-graduation-cap"></i></div>
                                    <div className="flex-1">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Class & Batch</p>
                                        <h4 className="text-base font-bold text-gray-800">{(data.class ? `Class ${data.class}` : 'Unassigned') + (data.section ? ` - ${data.section}` : '')}</h4>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-lg"><i className="fas fa-id-card"></i></div>
                                    <div className="flex-1">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Admission Number</p>
                                        <h4 className="text-base font-bold text-gray-800">{data.admissionNo || data.studentId || 'N/A'}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">Personal Info</h3>
                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                    <span className="text-gray-500 font-medium">Date of Birth</span>
                                    <span className="font-bold text-gray-800">{data.dob || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                    <span className="text-gray-500 font-medium">Gender</span>
                                    <span className="font-bold text-gray-800">{data.gender || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Blood Group</span>
                                    <span className="font-bold text-red-500">{data.bloodGroup || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">Contact Details</h3>
                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                                <div className="flex flex-col border-b border-gray-50 pb-3">
                                    <span className="text-gray-400 text-[10px] font-bold uppercase mb-0.5">Mobile Number</span>
                                    <span className="font-bold text-gray-800 text-sm">{data.mobile || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col border-b border-gray-50 pb-3">
                                    <span className="text-gray-400 text-[10px] font-bold uppercase mb-0.5">Email Address</span>
                                    <span className="font-bold text-gray-800 text-sm truncate">{data.email || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-[10px] font-bold uppercase mb-0.5">Current Address</span>
                                    <span className="font-bold text-gray-800 text-sm leading-tight">{getAddress()}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">Family Details</h3>
                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                    <span className="text-gray-500 font-medium">Father's Name</span>
                                    <span className="font-bold text-gray-800 text-right">{data.fatherName || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Mother's Name</span>
                                    <span className="font-bold text-gray-800 text-right">{data.motherName || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">Fee Summary Ledger</h3>
                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                    <span className="text-gray-500 font-medium">Total Course Fee</span>
                                    <span className="font-bold text-gray-800">₹{data.totalFee || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                    <span className="text-gray-500 font-medium">Total Paid Fee</span>
                                    <span className="font-bold text-green-600">₹{data.paidFee || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-1">
                                    <span className="text-gray-700 font-bold">Pending Dues</span>
                                    <span className="font-black text-red-600 bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-100">₹{(data.totalFee || 0) - (data.paidFee || 0)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 border border-red-200/60 font-bold py-4 rounded-2xl hover:bg-red-100 transition flex justify-center items-center gap-2 shadow-sm">
                                <i className="fas fa-sign-out-alt"></i> Logout Account
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
