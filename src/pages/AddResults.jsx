import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, addDoc, getDoc, getDocs, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

export default function AddResults() {
    const navigate = useNavigate();
    const [adminSchoolId, setAdminSchoolId] = useState(null);
    const [tests, setTests] = useState([]);
    const [students, setStudents] = useState([]);
    
    const [selectedTestId, setSelectedTestId] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [marks, setMarks] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                navigate('/');
            } else {
                try {
                    const adminDoc = await getDoc(doc(db, 'users', user.uid));
                    if (adminDoc.exists()) {
                        setAdminSchoolId(adminDoc.data().schoolId);
                    }
                } catch (error) {
                    console.error("Error fetching admin details:", error);
                }
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (!adminSchoolId) return;

        const loadTestsAndStudents = async () => {
            try {
                // Fetch tests
                const qTests = query(collection(db, "tests"), where("schoolId", "==", adminSchoolId), orderBy("createdAt", "desc"));
                const snapTests = await getDocs(qTests);
                let loadedTests = [];
                snapTests.forEach((docSnap) => {
                    loadedTests.push({ id: docSnap.id, ...docSnap.data() });
                });
                setTests(loadedTests);

                // Fetch students
                const qStudents = query(collection(db, "users"), where("role", "==", "student"), where("schoolId", "==", adminSchoolId));
                const snapStudents = await getDocs(qStudents);
                let loadedStudents = [];
                snapStudents.forEach((docSnap) => {
                    loadedStudents.push({ id: docSnap.id, ...docSnap.data() });
                });
                setStudents(loadedStudents);
            } catch (error) {
                console.error("Error loading data:", error);
            }
        };

        loadTestsAndStudents();
    }, [adminSchoolId]);

    const selectedTest = tests.find(t => t.id === selectedTestId);
    
    const availableStudents = selectedTest 
        ? students.filter(s => String(s.class) === String(selectedTest.targetClass))
        : [];

    const handleSave = async () => {
        if (!selectedTest) return console.log("Please select a test.");
        if (!selectedStudentId) return console.log("Please select a student.");
        const m = parseInt(marks);
        if (isNaN(m) || m < 0) return console.log("Please enter valid marks.");
        if (m > selectedTest.totalQuestions) return console.log(`Marks cannot exceed ${selectedTest.totalQuestions}.`);

        const student = students.find(s => s.id === selectedStudentId);
        const studentName = student ? (student.name || student.firstName || 'Unnamed Student') : 'Unnamed Student';

        setLoading(true);
        try {
            await addDoc(collection(db, "results"), {
                studentId: selectedStudentId,
                studentName: studentName,
                testId: selectedTest.id,
                testTitle: selectedTest.title,
                schoolId: adminSchoolId,
                score: m,
                totalQuestions: selectedTest.totalQuestions,
                manualEntry: true,
                timestamp: serverTimestamp()
            });
            try {
                await addDoc(collection(db, "notifications"), {
                    schoolId: adminSchoolId,
                    userId: selectedStudentId,
                    title: "Result Declared",
                    message: `Result declared for ${selectedTest.title}. You scored ${m}`,
                    type: "result",
                    createdAt: serverTimestamp()
                });
            } catch (err) { console.error(err); }
            console.log("Result saved successfully!");
            setMarks("");
            setSelectedStudentId("");
        } catch (error) {
            console.error("Error saving result:", error);
            console.log("Error saving result: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 p-4 font-sans pb-20 min-h-screen">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-4">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-teal-600 transition">
                        <i className="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Add Result Manually</h1>
                    <div></div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-teal-500">
                    <p className="text-xs text-gray-400 mb-4">Use this only for results entered by hand. Results from students taking the test online are saved automatically.</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Select Test *</label>
                            <select value={selectedTestId} onChange={(e) => setSelectedTestId(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-teal-500">
                                <option value="">{tests.length > 0 ? '-- Choose a Test --' : '-- No Tests Found --'}</option>
                                {tests.map(t => (
                                    <option key={t.id} value={t.id}>{t.title} (Class {t.targetClass})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Select Student *</label>
                            <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-teal-500">
                                <option value="">{selectedTest ? '-- Choose a Student --' : '-- Select a test first --'}</option>
                                {availableStudents.map(s => (
                                    <option key={s.id} value={s.id}>{s.name || s.firstName || 'Unnamed'}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Marks Obtained *</label>
                            <input type="number" value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="e.g., 8" min="0" max={selectedTest ? selectedTest.totalQuestions : ""} className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-teal-500" />
                            <p className="text-xs text-gray-400 mt-1">{selectedTest ? `Out of ${selectedTest.totalQuestions} questions` : ''}</p>
                        </div>

                        <button onClick={handleSave} disabled={loading} className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 transition disabled:opacity-50">
                            <i className={loading ? "fas fa-spinner fa-spin mr-2" : "fas fa-save mr-2"}></i> {loading ? "Saving..." : "Save Result"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
