import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

export default function Tests() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [allTests, setAllTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list', 'exam', 'result'
    const [currentActiveTest, setCurrentActiveTest] = useState(null);
    const [scoreInfo, setScoreInfo] = useState({ score: 0, total: 0, percentage: 0 });
    const [timerDisplay, setTimerDisplay] = useState("00:00");
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [timerWarning, setTimerWarning] = useState(false);
    const [timerIntervalId, setTimerIntervalId] = useState(null);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setCurrentUser(user);
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setStudentData(data);
                    if (data.class && data.schoolId) {
                        const q = query(
                            collection(db, "tests"),
                            where("targetClass", "==", String(data.class)),
                            where("schoolId", "==", data.schoolId)
                        );
                        const unsubTests = onSnapshot(q, (snapshot) => {
                            const tests = [];
                            snapshot.forEach(docSnap => tests.push({ id: docSnap.id, ...docSnap.data() }));
                            setAllTests(tests);
                            setLoading(false);
                        });
                        return () => unsubTests();
                    } else {
                        setLoading(false);
                    }
                } else {
                    navigate("/");
                }
            } else {
                navigate("/");
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]);

    const startExam = (testId) => {
        if(!true || window.confirm("Are you ready? The timer will start immediately.")) return;
        const test = allTests.find(t => t.id === testId);
        setCurrentActiveTest(test);
        setAnswers({});
        setView('exam');
        startTimer(test.duration);
    };

    const startTimer = (minutes) => {
        let timeInSeconds = minutes * 60;
        const id = setInterval(() => {
            const min = Math.floor(timeInSeconds / 60);
            const sec = timeInSeconds % 60;
            setTimerDisplay(`${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`);
            if (timeInSeconds <= 60) setTimerWarning(true);
            
            if (timeInSeconds <= 0) {
                clearInterval(id);
                console.log("Time is up! Auto-submitting your test.");
                submitTest(true);
            }
            timeInSeconds--;
        }, 1000);
        setTimerIntervalId(id);
    };

    const submitTest = async (isAuto = false) => {
        if (!isAuto && !true || window.confirm("Submit your test now?")) return;
        if(timerIntervalId) clearInterval(timerIntervalId);
        setSubmitting(true);

        let score = 0;
        const total = currentActiveTest.questions.length;
        currentActiveTest.questions.forEach((q, index) => {
            if (answers[index] === q.correctAnswer) score++;
        });

        try {
            await addDoc(collection(db, "results"), {
                studentId: currentUser.uid,
                studentName: studentData.name || studentData.firstName,
                testId: currentActiveTest.id,
                testTitle: currentActiveTest.title,
                schoolId: studentData.schoolId,
                score: score,
                totalQuestions: total,
                timestamp: serverTimestamp()
            });
            const percentage = Math.round((score / total) * 100);
            setScoreInfo({ score, total, percentage });
            setView('result');
        } catch (err) {
            console.log("Error saving result: " + err.message);
        }
        setSubmitting(false);
    };

    return (
        <div className="bg-gray-50 font-sans min-h-screen">
            <div className="max-w-md mx-auto relative h-full">
                {view === 'list' && (
                    <div className="pb-20">
                        <div className="bg-purple-600 text-white p-4 rounded-b-3xl shadow-md sticky top-0 z-50">
                            <div className="flex justify-between items-center mb-4">
                                <button onClick={() => navigate('/dashboard')} className="hover:bg-white/20 p-2 rounded-xl transition">
                                    <i className="fas fa-arrow-left"></i>
                                </button>
                                <h1 className="text-lg font-bold">Mock Tests</h1>
                                <div className="w-8"></div>
                            </div>
                            <div className="text-center pb-2">
                                <p className="text-xs text-purple-200 uppercase font-bold">Your Available Tests</p>
                            </div>
                        </div>

                        <div className="px-4 mt-6">
                            {loading ? (
                                <div className="text-center py-10">
                                    <i className="fas fa-spinner fa-spin text-3xl text-purple-500 mb-2"></i>
                                    <p className="text-sm text-gray-500">Finding your tests...</p>
                                </div>
                            ) : (!studentData?.class || !studentData?.schoolId) ? (
                                <p className="text-center text-red-500">Class or School ID missing.</p>
                            ) : allTests.length === 0 ? (
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center">
                                    <p className="text-sm font-bold text-gray-500">No tests available right now.</p>
                                </div>
                            ) : (
                                allTests.map(test => (
                                    <div key={test.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-purple-100 text-purple-600 text-[10px] font-bold px-3 py-1.5 rounded-bl-xl">{test.duration} Mins</div>
                                        <h3 className="font-bold text-gray-800 text-lg mb-1 pr-16">{test.title}</h3>
                                        <p className="text-xs text-gray-500 mb-4"><i className="fas fa-list-ol mr-1"></i> {test.totalQuestions} Questions</p>
                                        <button onClick={() => startExam(test.id)} className="w-full bg-purple-50 text-purple-600 font-bold py-2.5 rounded-xl border border-purple-200 hover:bg-purple-100 transition">
                                            Start Test Now
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {view === 'exam' && currentActiveTest && (
                    <div className="pb-24">
                        <div className="bg-white p-4 shadow-sm sticky top-0 z-50 border-b-4 border-purple-600 flex justify-between items-center">
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">{currentActiveTest.title}</h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Do not refresh page</p>
                            </div>
                            <div className={`bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 flex items-center gap-2 ${timerWarning ? 'text-red-700 animate-bounce' : 'text-red-600'}`}>
                                <i className="fas fa-clock animate-pulse"></i>
                                <span className="font-bold text-lg tracking-wider">{timerDisplay}</span>
                            </div>
                        </div>

                        <div className="px-4 mt-6 space-y-6">
                            {currentActiveTest.questions.map((q, index) => (
                                <div key={index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <p className="text-xs font-bold text-purple-600 mb-2 uppercase">Question {index + 1}</p>
                                    <h3 className="text-sm font-bold text-gray-800 mb-4">{q.question}</h3>
                                    <div className="space-y-3">
                                        {['A', 'B', 'C', 'D'].map(opt => (
                                            <label key={opt} className={`flex items-center gap-3 p-3 border border-gray-100 rounded-xl cursor-pointer transition ${answers[index] === opt ? 'bg-purple-100' : 'bg-gray-50 hover:bg-purple-50'}`}>
                                                <input type="radio" name={`q_${index}`} value={opt} checked={answers[index] === opt} onChange={() => setAnswers({...answers, [index]: opt})} className="accent-purple-600 w-4 h-4" /> 
                                                <span className="text-sm text-gray-700">{q.options[opt]}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-4 z-50">
                            <button onClick={() => submitTest(false)} disabled={submitting} className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-xl hover:bg-purple-700 shadow-md transition text-lg">
                                {submitting ? "Processing Results..." : "Submit Test"}
                            </button>
                        </div>
                    </div>
                )}

                {view === 'result' && (
                    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Test Submitted!</h1>
                        <p className="text-gray-500 mb-8">Great job completing the test.</p>

                        <div className="bg-white w-full p-6 rounded-3xl shadow-lg border border-gray-100 mb-8">
                            <p className="text-xs text-gray-400 font-bold uppercase mb-2">Your Score</p>
                            <div className="text-5xl font-bold text-purple-600 mb-4 tracking-tighter">{scoreInfo.score} / {scoreInfo.total}</div>
                            <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
                                <div className={`h-3 rounded-full transition-all duration-1000 ${scoreInfo.percentage > 75 ? 'bg-green-500' : (scoreInfo.percentage < 40 ? 'bg-red-500' : 'bg-purple-500')}`} style={{ width: `${scoreInfo.percentage}%` }}></div>
                            </div>
                            <p className="text-xs font-bold text-gray-500">{scoreInfo.percentage}% Accuracy</p>
                        </div>

                        <button onClick={() => navigate('/dashboard')} className="w-full bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-gray-900 transition">
                            Back to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
