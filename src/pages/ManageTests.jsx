import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, where, getDoc } from 'firebase/firestore';

export default function ManageTests() {
    const navigate = useNavigate();
    const [adminSchoolId, setAdminSchoolId] = useState(null);
    const [tests, setTests] = useState([]);
    const [results, setResults] = useState([]);
    
    const [title, setTitle] = useState("");
    const [targetClass, setTargetClass] = useState("");
    const [duration, setDuration] = useState("");
    const [questions, setQuestions] = useState([{ question: "", optA: "", optB: "", optC: "", optD: "", correctOpt: "A" }]);
    const [isPublishing, setIsPublishing] = useState(false);

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

        const qTests = query(collection(db, "tests"), where("schoolId", "==", adminSchoolId), orderBy("createdAt", "desc"));
        const unsubTests = onSnapshot(qTests, (snapshot) => {
            let loadedTests = [];
            snapshot.forEach(docSnap => loadedTests.push({ id: docSnap.id, ...docSnap.data() }));
            setTests(loadedTests);
        });

        const qResults = query(collection(db, "results"), where("schoolId", "==", adminSchoolId));
        const unsubResults = onSnapshot(qResults, (snapshot) => {
            let loadedRes = [];
            snapshot.forEach(docSnap => loadedRes.push(docSnap.data()));
            loadedRes.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
            setResults(loadedRes);
        });

        return () => {
            unsubTests();
            unsubResults();
        };
    }, [adminSchoolId]);

    const handleAddQuestion = () => {
        setQuestions([...questions, { question: "", optA: "", optB: "", optC: "", optD: "", correctOpt: "A" }]);
    };

    const handleRemoveQuestion = (index) => {
        const newQs = [...questions];
        newQs.splice(index, 1);
        setQuestions(newQs);
    };

    const handleQuestionChange = (index, field, value) => {
        const newQs = [...questions];
        newQs[index][field] = value;
        setQuestions(newQs);
    };

    const handlePublish = async () => {
        if (!adminSchoolId) return console.log("School ID missing!");
        if (!title || !targetClass || !duration) return console.log("Please fill Test Title, Class, and Duration.");
        if (questions.length === 0) return console.log("Please add at least one question.");

        let hasError = false;
        const formattedQuestions = questions.map(q => {
            if (!q.question || !q.optA || !q.optB || !q.optC || !q.optD) hasError = true;
            return {
                question: q.question,
                options: { A: q.optA, B: q.optB, C: q.optC, D: q.optD },
                correctAnswer: q.correctOpt
            };
        });

        if (hasError) return console.log("Please fill all questions and options completely.");

        setIsPublishing(true);
        try {
            await addDoc(collection(db, "tests"), {
                schoolId: adminSchoolId,
                title, targetClass, duration: parseInt(duration),
                totalQuestions: formattedQuestions.length, questions: formattedQuestions,
                createdAt: serverTimestamp()
            });
            console.log("Test Published Successfully! 🎉");
            setTitle(""); setTargetClass(""); setDuration("");
            setQuestions([{ question: "", optA: "", optB: "", optC: "", optD: "", correctOpt: "A" }]);
        } catch (error) {
            console.log("Error saving test: " + error.message);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleDeleteTest = async (id) => {
        if (true || window.confirm("Are you sure you want to delete this Test?")) {
            await deleteDoc(doc(db, "tests", id));
        }
    };

    return (
        <div className="bg-gray-50 p-4 font-sans pb-20 min-h-screen">
            <div className="max-w-xl mx-auto">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-4">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-purple-600 transition">
                        <i className="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Create Mock Test</h1>
                    <div></div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-t-4 border-purple-600">
                    <h2 className="text-sm font-bold text-gray-400 uppercase mb-4"><i className="fas fa-cogs text-purple-500 mr-2"></i>Step 1: Test Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Test Title *</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Weekly Math Test - 1" className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Target Class *</label>
                                <select value={targetClass} onChange={e => setTargetClass(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-purple-500">
                                    <option value="">Select Class</option>
                                    {[...Array(12).keys()].map(i => <option key={i+1} value={String(i+1)}>Class {i+1}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Duration (Minutes) *</label>
                                <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g., 30" className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-purple-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <h2 className="text-sm font-bold text-gray-400 uppercase mb-4"><i className="fas fa-list-ol text-purple-500 mr-2"></i>Step 2: Add Questions</h2>
                    <div className="space-y-6">
                        {questions.map((q, index) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-xl bg-gray-50 relative">
                                {questions.length > 1 && (
                                    <button onClick={() => handleRemoveQuestion(index)} className="absolute top-2 right-3 text-red-400 hover:text-red-600"><i className="fas fa-times"></i></button>
                                )}
                                <p className="text-xs font-bold text-purple-600 mb-2 uppercase">Question {index + 1}</p>
                                
                                <textarea value={q.question} onChange={e => handleQuestionChange(index, 'question', e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg outline-none mb-3 text-sm focus:ring-2 focus:ring-purple-400" placeholder="Type your question here..."></textarea>
                                
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <input type="text" value={q.optA} onChange={e => handleQuestionChange(index, 'optA', e.target.value)} className="p-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="Option A" />
                                    <input type="text" value={q.optB} onChange={e => handleQuestionChange(index, 'optB', e.target.value)} className="p-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="Option B" />
                                    <input type="text" value={q.optC} onChange={e => handleQuestionChange(index, 'optC', e.target.value)} className="p-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="Option C" />
                                    <input type="text" value={q.optD} onChange={e => handleQuestionChange(index, 'optD', e.target.value)} className="p-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="Option D" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 mr-2">Correct Answer:</label>
                                    <select value={q.correctOpt} onChange={e => handleQuestionChange(index, 'correctOpt', e.target.value)} className="p-2 border border-gray-200 rounded-lg text-sm outline-none bg-white">
                                        <option value="A">Option A</option><option value="B">Option B</option>
                                        <option value="C">Option C</option><option value="D">Option D</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleAddQuestion} className="mt-4 w-full bg-purple-50 text-purple-600 font-bold py-3 rounded-xl border border-purple-200 hover:bg-purple-100 transition border-dashed">
                        <i className="fas fa-plus-circle mr-2"></i> Add Question
                    </button>
                </div>

                <button onClick={handlePublish} disabled={isPublishing} className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl hover:bg-purple-700 shadow-lg transition flex justify-center items-center text-lg mb-8 disabled:opacity-50">
                    {isPublishing ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-cloud-upload-alt mr-2"></i>}
                    {isPublishing ? "Publishing..." : "Publish Full Test"}
                </button>

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Active Published Tests</h2>
                    <div className="space-y-3">
                        {tests.length === 0 ? <p className="text-center text-sm text-gray-400 py-4">No tests published yet.</p> : tests.map(t => (
                            <div key={t.id} className="p-3 border rounded-xl bg-gray-50 flex justify-between items-center">
                                <div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-purple-100 text-purple-600 mb-1 inline-block">Class {t.targetClass}</span>
                                    <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{t.title}</h4>
                                    <p className="text-[11px] text-gray-500 mt-0.5">{t.totalQuestions} Questions • {t.duration} Mins</p>
                                </div>
                                <button onClick={() => handleDeleteTest(t.id)} className="bg-white text-red-500 p-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-red-50 transition shadow-sm"><i className="fas fa-trash"></i></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2"><i className="fas fa-chart-bar text-purple-500 mr-2"></i>Student Results</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {results.length === 0 ? <p className="text-center text-sm text-gray-400 py-4">No results submitted yet.</p> : results.map((r, i) => {
                            const percentage = (r.score / r.totalQuestions) * 100;
                            const badgeClass = percentage >= 40 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
                            return (
                                <div key={i} className="p-3 border border-gray-100 rounded-xl bg-gray-50 flex justify-between items-center hover:bg-gray-100 transition">
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm capitalize">{r.studentName || "Unknown Student"}</h4>
                                        <p className="text-[11px] font-bold text-purple-600 mt-0.5">{r.testTitle}</p>
                                    </div>
                                    <div className={`${badgeClass} px-3 py-1 rounded-lg text-sm font-bold shadow-sm border border-white`}>
                                        {r.score} / {r.totalQuestions}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
