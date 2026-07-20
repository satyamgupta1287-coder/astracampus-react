import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, onSnapshot, query, where, doc, setDoc, getDoc, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

export default function ManageAttendance() {
    const navigate = useNavigate();
    const [adminSchoolId, setAdminSchoolId] = useState("");
    
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState("");
    
    const [students, setStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});
    const [isViewMode, setIsViewMode] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                navigate('/');
            } else {
                const adminSnap = await getDoc(doc(db, 'users', user.uid));
                if (adminSnap.exists()) {
                    setAdminSchoolId(adminSnap.data().schoolId);
                }
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const loadClassData = async () => {
        if (!date || !selectedClass) {
            console.log("⚠️ Date and Class are required!");
            return;
        }

        setIsLoaded(false);
        setStudents([]);
        setAttendanceData({});

        const q = query(
            collection(db, "users"), 
            where("role", "==", "student"), 
            where("schoolId", "==", adminSchoolId),
            where("class", "==", selectedClass)
        );
        
        const snapshot = await getDocs(q);
        let loadedStudents = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loadedStudents.push({ id: docSnap.id, name: data.name || data.firstName || "Student", class: data.class });
        });
        
        setStudents(loadedStudents);
        
        if (loadedStudents.length > 0) {
            checkDateAttendance(loadedStudents, date, selectedClass);
        } else {
            setIsLoaded(true);
        }
    };

    const checkDateAttendance = async (studentList, selectedDate, cls) => {
        let currentAtt = {};
        let viewMode = false;

        const q = query(
            collection(db, "attendance"), 
            where("schoolId", "==", adminSchoolId),
            where("date", "==", selectedDate)
        );
        const snap = await getDocs(q);

        let attendanceExists = false;
        snap.forEach(docSnap => {
            const data = docSnap.data();
            if (studentList.find(s => s.id === data.studentId)) {
                attendanceExists = true;
                currentAtt[data.studentId] = data.status; 
            }
        });

        if (attendanceExists) {
            viewMode = true;
        }

        setAttendanceData(currentAtt);
        setIsViewMode(viewMode);
        setIsLoaded(true);
    };

    const markAttendance = (id, status) => {
        if (isViewMode) return;
        setAttendanceData(prev => ({ ...prev, [id]: status }));
    };

    const submitAttendance = async () => {
        if (isViewMode) return;
        
        if (Object.keys(attendanceData).length < students.length) {
            return window.alert("⚠️ Please mark Present or Absent for ALL students before submitting.");
        }

        if (!window.confirm(`Submit final attendance for Class ${selectedClass} on ${date}?`)) return;

        setIsSubmitting(true);
        try {
            for (let student of students) {
                const status = attendanceData[student.id];
                const docId = `${date}_${student.id}`; 
                
                await setDoc(doc(db, "attendance", docId), {
                    schoolId: adminSchoolId, 
                    studentId: student.id,
                    studentName: student.name,
                    className: student.class,
                    date: date,
                    status: status,
                    createdAt: serverTimestamp()
                });
            }
            try {
                await addDoc(collection(db, "notifications"), {
                    schoolId: adminSchoolId,
                    targetClass: selectedClass,
                    title: "Attendance Marked",
                    message: `Attendance marked for class ${selectedClass} on ${date}`,
                    type: "attendance",
                    createdAt: serverTimestamp()
                });
            } catch (err) { console.error(err); }
            window.alert("✅ Attendance Saved Successfully!");
            setIsViewMode(true);
        } catch (error) {
            console.log("Error saving attendance: " + error.message);
        }
        setIsSubmitting(false);
    };

    const presentCount = Object.values(attendanceData).filter(s => s === 'present').length;
    const absentCount = Object.values(attendanceData).filter(s => s === 'absent').length;

    return (
        <div className="bg-gray-50 p-4 font-sans pb-24 min-h-screen">
            <div className="max-w-md mx-auto">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-4">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-blue-600 transition">
                        <i className="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Attendance</h1>
                    <div></div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-t-4 border-blue-600">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <h2 className="text-xs font-bold text-gray-400 uppercase mb-2"><i className="fas fa-calendar-alt text-blue-500 mr-2"></i>Date</h2>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="w-full p-2.5 border border-gray-200 rounded-xl outline-none bg-gray-50 font-bold text-gray-700 text-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-xs font-bold text-gray-400 uppercase mb-2"><i className="fas fa-users text-blue-500 mr-2"></i>Class</h2>
                            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl outline-none bg-gray-50 font-bold text-gray-700 text-sm focus:ring-2 focus:ring-blue-500">
                                <option value="">Select Class</option>
                                {[...Array(12).keys()].map(i => <option key={i+1} value={String(i+1)}>Class {i+1}</option>)}
                            </select>
                        </div>
                    </div>
                    <button onClick={loadClassData} className="w-full bg-blue-50 border border-blue-200 text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-100 transition text-sm">
                        Load Students
                    </button>
                </div>

                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-4 border border-gray-100">
                    <div className="text-center flex-1 border-r border-gray-200">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
                        <p className="text-xl font-black text-gray-700">{students.length}</p>
                    </div>
                    <div className="text-center flex-1 border-r border-gray-200">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Present</p>
                        <p className="text-xl font-black text-green-500">{presentCount}</p>
                    </div>
                    <div className="text-center flex-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Absent</p>
                        <p className="text-xl font-black text-red-500">{absentCount}</p>
                    </div>
                </div>

                {isViewMode && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl mb-4 text-xs font-bold text-center flex items-center justify-center gap-2">
                        <i className="fas fa-check-circle text-emerald-500 text-lg"></i>
                        Attendance already submitted. (View Only)
                    </div>
                )}
                
                <div className="bg-transparent rounded-2xl mb-6">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <h2 className="text-sm font-bold text-gray-500 uppercase">Student List</h2>
                    </div>
                    <div className="space-y-3">
                        {!isLoaded ? (
                            <p className="text-center text-sm text-gray-400 py-4">Please select Class & Date, then click 'Load Students'.</p>
                        ) : students.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-4 bg-white rounded-2xl shadow-sm">No students found.</p>
                        ) : (
                            students.map(student => {
                                const status = attendanceData[student.id];
                                let btnPresent = "bg-gray-50 text-gray-400 border border-gray-200";
                                let btnAbsent = "bg-gray-50 text-gray-400 border border-gray-200";

                                if (status === 'present') {
                                    btnPresent = "bg-green-500 text-white shadow-md border-transparent";
                                } else if (status === 'absent') {
                                    btnAbsent = "bg-red-500 text-white shadow-md border-transparent";
                                } else if (!isViewMode) {
                                    btnPresent = "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100";
                                    btnAbsent = "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100";
                                }

                                return (
                                    <div key={student.id} className="flex flex-col p-3 border border-gray-100 rounded-xl bg-white shadow-sm mb-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-gray-800 text-sm capitalize">{student.name}</span>
                                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Class {student.class}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => markAttendance(student.id, 'present')} className={`${btnPresent} py-2 rounded-lg text-xs font-bold transition uppercase`}>
                                                <i className="fas fa-check mr-1"></i> Present
                                            </button>
                                            <button onClick={() => markAttendance(student.id, 'absent')} className={`${btnAbsent} py-2 rounded-lg text-xs font-bold transition uppercase`}>
                                                <i className="fas fa-times mr-1"></i> Absent
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {!isViewMode && isLoaded && students.length > 0 && (
                    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-4 z-50">
                        <button onClick={submitAttendance} disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 shadow-md transition text-lg flex justify-center items-center">
                            {isSubmitting ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-check-circle mr-2"></i>} 
                            {isSubmitting ? "Submitting..." : "Submit Attendance"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
