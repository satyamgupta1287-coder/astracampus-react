import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function TeacherDashboard() {
    const navigate = useNavigate();
    const [teacherData, setTeacherData] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                navigate('/');
            } else {
                try {
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.role === 'teacher' || data.role === 'staff' || data.role === 'admin') {
                            setTeacherData(data);
                        } else {
                            console.log("Unauthorized Access!");
                            navigate('/');
                        }
                    }
                } catch (error) {
                    console.error("Error fetching teacher details:", error);
                }
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleLogout = async () => {
        if (window.confirm("Are you sure you want to logout?")) {
            await signOut(auth);
            navigate('/');
        }
    };

    return (
        <div className="bg-gray-50 font-sans pb-20 min-h-screen">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-b-[2rem] p-6 text-white shadow-lg relative pb-12">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-2xl font-bold">Staff Dashboard</h1>
                            <p className="text-sm text-blue-200">
                                {teacherData ? `Welcome, ${teacherData.name || 'Staff'}` : 'Loading Profile...'}
                            </p>
                        </div>
                        <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 p-2.5 rounded-xl backdrop-blur-sm transition">
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                    <p className="text-xs font-bold bg-white/10 inline-block px-3 py-1 rounded-full border border-white/20 shadow-sm">
                        {teacherData ? `School Code: ${teacherData.schoolId}` : 'School ID: ...'}
                    </p>
                </div>

                <div className="px-4 mt-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Your Daily Workflow</h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 md:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 lg:grid-cols-5 lg:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        <button onClick={() => navigate('/manage-attendance')} className="bg-emerald-50 p-4 rounded-2xl flex flex-col items-center border border-emerald-100 hover:bg-emerald-100 transition shadow-sm">
                            <i className="fas fa-check-circle text-emerald-600 text-2xl mb-2"></i>
                            <span className="text-xs font-bold text-gray-700">Take Attendance</span>
                        </button>

                        <button onClick={() => navigate('/create-assignment')} className="bg-purple-50 p-4 rounded-2xl flex flex-col items-center border border-purple-100 hover:bg-purple-100 transition shadow-sm">
                            <i className="fas fa-clipboard-list text-purple-600 mb-2 text-2xl"></i>
                            <span className="text-xs font-bold text-gray-700">Assignments</span>
                        </button>

                        <button onClick={() => navigate('/manage-classes')} className="bg-red-50 p-4 rounded-2xl flex flex-col items-center border border-red-100 hover:bg-red-100 transition shadow-sm">
                            <i className="fas fa-video text-red-500 text-2xl mb-2"></i>
                            <span className="text-xs font-bold text-gray-700">Live Classes</span>
                        </button>

                        <button onClick={() => navigate('/manage-materials')} className="bg-indigo-50 p-4 rounded-2xl flex flex-col items-center border border-indigo-100 hover:bg-indigo-100 transition shadow-sm">
                            <i className="fas fa-book-open text-indigo-600 text-2xl mb-2"></i>
                            <span className="text-xs font-bold text-gray-700">Upload Notes</span>
                        </button>

                        <button onClick={() => navigate('/view-results')} className="bg-orange-50 p-4 rounded-2xl flex flex-col items-center border border-orange-100 hover:bg-orange-100 transition shadow-sm">
                            <i className="fas fa-trophy text-orange-600 text-2xl mb-2"></i>
                            <span className="text-xs font-bold text-gray-700">Test Results</span>
                        </button>

                        <button onClick={() => navigate('/manage-doubts')} className="bg-cyan-50 p-4 rounded-2xl flex flex-col items-center border border-cyan-100 hover:bg-cyan-100 transition shadow-sm">
                            <i className="fas fa-question-circle text-cyan-600 text-2xl mb-2"></i>
                            <span className="text-xs font-bold text-gray-700">Solve Doubts</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
