import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, where, getDoc } from 'firebase/firestore';

export default function ManageClasses() {
    const navigate = useNavigate();
    const [adminSchoolId, setAdminSchoolId] = useState(null);
    const [classes, setClasses] = useState([]);

    const [targetClass, setTargetClass] = useState("");
    const [classTime, setClassTime] = useState("");
    const [subject, setSubject] = useState("");
    const [teacherName, setTeacherName] = useState("");
    const [meetingLink, setMeetingLink] = useState("");
    const [isScheduling, setIsScheduling] = useState(false);

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
        const q = query(
            collection(db, "live_classes"), 
            where("schoolId", "==", adminSchoolId),
            orderBy("createdAt", "desc")
        );
        const unsub = onSnapshot(q, (snapshot) => {
            let loaded = [];
            snapshot.forEach(docSnap => loaded.push({ id: docSnap.id, ...docSnap.data() }));
            setClasses(loaded);
        });
        return () => unsub();
    }, [adminSchoolId]);

    const handleSchedule = async (e) => {
        e.preventDefault();
        if (!adminSchoolId) return console.log("School ID missing!");

        const timeParts = classTime.split(':');
        let hours = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; 
        const formattedTime = hours + ':' + minutes + ' ' + ampm;

        setIsScheduling(true);
        try {
            await addDoc(collection(db, "live_classes"), {
                schoolId: adminSchoolId,
                targetClass,
                time: formattedTime,
                rawTime: classTime,
                subject,
                teacherName,
                meetingLink,
                createdAt: serverTimestamp()
            });
            console.log("Live Class Scheduled Successfully! 🎥");
            setTargetClass(""); setClassTime(""); setSubject(""); setTeacherName(""); setMeetingLink("");
        } catch (err) {
            console.log("Error: " + err.message);
        } finally {
            setIsScheduling(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this scheduled class?")) {
            await deleteDoc(doc(db, "live_classes", id));
        }
    };

    return (
        <div className="bg-gray-50 p-4 font-sans pb-24 min-h-screen">
            <div className="max-w-md mx-auto">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-4">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-blue-600 transition">
                        <i className="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Live Classes</h1>
                    <div></div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-t-4 border-red-500">
                    <h2 className="text-sm font-bold text-gray-400 uppercase mb-4"><i className="fas fa-video text-red-500 mr-2"></i>Schedule New Class</h2>
                    <form onSubmit={handleSchedule} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Target Class *</label>
                                <select value={targetClass} onChange={e => setTargetClass(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-red-500">
                                    <option value="">Select Class</option>
                                    {[...Array(12).keys()].map(i => <option key={i+1} value={i+1}>Class {i+1}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Time *</label>
                                <input type="time" value={classTime} onChange={e => setClassTime(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-red-500" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Subject *</label>
                                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required placeholder="e.g., Math" className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-red-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Teacher Name *</label>
                                <input type="text" value={teacherName} onChange={e => setTeacherName(e.target.value)} required placeholder="e.g., Rahul Sir" className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-red-500" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Meeting Link (Zoom/Meet) *</label>
                            <input type="url" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} required placeholder="https://meet.google.com/..." className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-red-500 text-blue-600" />
                        </div>

                        <button type="submit" disabled={isScheduling} className="w-full bg-red-500 text-white font-bold py-3.5 rounded-xl hover:bg-red-600 shadow-md transition flex justify-center items-center">
                            {isScheduling ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-calendar-plus mr-2"></i>} Schedule Class
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Upcoming Classes</h2>
                    <div className="space-y-3">
                        {classes.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-4">No upcoming classes.</p>
                        ) : (
                            classes.map(c => (
                                <div key={c.id} className="p-4 border rounded-xl bg-gray-50 relative">
                                    <button onClick={() => handleDelete(c.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition">
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                    
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-lg shadow-inner">
                                            <i className="fas fa-video"></i>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-600">Class {c.targetClass}</span>
                                            <h4 className="font-bold text-gray-800 text-sm mt-1">{c.subject} by {c.teacherName}</h4>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center mt-3 bg-white p-2 rounded-lg border border-gray-200">
                                        <p className="text-xs font-bold text-gray-600"><i className="far fa-clock text-red-500 mr-1"></i> {c.time}</p>
                                        <a href={c.meetingLink} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-white bg-blue-500 px-3 py-1.5 rounded hover:bg-blue-600 transition shadow-sm">
                                            Join Link
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
