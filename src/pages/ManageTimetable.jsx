import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, addDoc, query, where, onSnapshot, getDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export default function ManageTimetable() {
    const navigate = useNavigate();
    const [adminSchoolId, setAdminSchoolId] = useState(null);
    const [timetable, setTimetable] = useState([]);

    const [targetClass, setTargetClass] = useState("");
    const [day, setDay] = useState("Monday");
    const [subject, setSubject] = useState("");
    const [time, setTime] = useState("");
    const [teacher, setTeacher] = useState("");
    const [isAdding, setIsAdding] = useState(false);

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
        const q = query(collection(db, "timetable"), where("schoolId", "==", adminSchoolId));
        const unsub = onSnapshot(q, (snapshot) => {
            let items = [];
            snapshot.forEach(d => items.push({ id: d.id, ...d.data() }));
            items.sort((a, b) => a.targetClass.localeCompare(b.targetClass) || a.day.localeCompare(b.day));
            setTimetable(items);
        });
        return () => unsub();
    }, [adminSchoolId]);

    const handleAdd = async (e) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            await addDoc(collection(db, "timetable"), {
                schoolId: adminSchoolId,
                targetClass: targetClass.trim(),
                day: day,
                subject: subject.trim(),
                time: time.trim(),
                teacher: teacher.trim(),
                createdAt: serverTimestamp()
            });
            setTargetClass(""); setSubject(""); setTime(""); setTeacher("");
            console.log("Period added successfully!");
        } catch (error) {
            console.log("Error: " + error.message);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this period?")) {
            await deleteDoc(doc(db, "timetable", id));
        }
    };

    return (
        <div className="bg-slate-50 pb-10 min-h-screen font-sans">
            <div className="bg-indigo-800 text-white px-5 py-5 rounded-b-[24px] shadow-md flex items-center gap-4 sticky top-0 z-50">
                <button onClick={() => navigate(-1)} className="text-white hover:text-indigo-200 transition text-lg active:scale-95">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-lg font-bold">Manage Timetable</h1>
            </div>

            <div className="max-w-md mx-auto px-5 mt-6">
                <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 mb-8">
                    <h2 className="text-sm font-bold text-slate-800 mb-4"><i className="fas fa-plus-circle text-indigo-500 mr-2"></i>Add Period</h2>
                    <form onSubmit={handleAdd} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Class</label>
                                <input type="text" value={targetClass} onChange={e => setTargetClass(e.target.value)} required placeholder="e.g. 10" className="w-full p-2.5 text-sm border rounded-xl outline-none focus:border-indigo-500 bg-slate-50" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Day</label>
                                <select value={day} onChange={e => setDay(e.target.value)} required className="w-full p-2.5 text-sm border rounded-xl outline-none focus:border-indigo-500 bg-slate-50">
                                    <option value="Monday">Monday</option><option value="Tuesday">Tuesday</option>
                                    <option value="Wednesday">Wednesday</option><option value="Thursday">Thursday</option>
                                    <option value="Friday">Friday</option><option value="Saturday">Saturday</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subject</label>
                                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required placeholder="e.g. Math" className="w-full p-2.5 text-sm border rounded-xl outline-none focus:border-indigo-500 bg-slate-50" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Time</label>
                                <input type="text" value={time} onChange={e => setTime(e.target.value)} required placeholder="e.g. 09:00 AM" className="w-full p-2.5 text-sm border rounded-xl outline-none focus:border-indigo-500 bg-slate-50" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Teacher Name</label>
                            <input type="text" value={teacher} onChange={e => setTeacher(e.target.value)} required placeholder="e.g. Mr. Sharma" className="w-full p-2.5 text-sm border rounded-xl outline-none focus:border-indigo-500 bg-slate-50" />
                        </div>
                        <button type="submit" disabled={isAdding} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl mt-2 transition disabled:opacity-50">
                            {isAdding ? "Adding..." : "Add to Schedule"}
                        </button>
                    </form>
                </div>

                <h3 className="font-bold text-slate-800 mb-3 text-sm px-1">Added Classes</h3>
                <div className="space-y-3">
                    {timetable.length === 0 ? (
                        <div className="bg-white p-5 rounded-2xl border text-center"><p className="text-sm text-slate-400">No periods added yet.</p></div>
                    ) : (
                        timetable.map(item => (
                            <div key={item.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center shadow-sm">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Class {item.targetClass}</span>
                                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{item.day}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm">{item.subject} <span className="text-slate-400 font-normal text-xs">({item.time})</span></h4>
                                    <p className="text-xs text-slate-500 mt-0.5"><i className="fas fa-chalkboard-teacher mr-1"></i>{item.teacher}</p>
                                </div>
                                <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition shrink-0">
                                    <i className="fas fa-trash text-xs"></i>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
