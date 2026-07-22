import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, query, onSnapshot, where, getDoc, doc } from 'firebase/firestore';

export default function ViewResults() {
    const navigate = useNavigate();
    const [adminSchoolId, setAdminSchoolId] = useState(null);
    const [tests, setTests] = useState([]);
    const [selectedTestId, setSelectedTestId] = useState("");
    const [results, setResults] = useState([]);

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
        const testQuery = query(collection(db, "tests"), where("schoolId", "==", adminSchoolId));
        const unsub = onSnapshot(testQuery, (snapshot) => {
            let allTests = [];
            snapshot.forEach(docSnap => allTests.push({ id: docSnap.id, ...docSnap.data() }));
            allTests.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setTests(allTests);
        });
        return () => unsub();
    }, [adminSchoolId]);

    useEffect(() => {
        if (!selectedTestId) {
            setResults([]);
            return;
        }
        const resultsQuery = query(collection(db, "results"), where("testId", "==", selectedTestId));
        const unsub = onSnapshot(resultsQuery, (snapshot) => {
            let allResults = [];
            snapshot.forEach(docSnap => allResults.push(docSnap.data()));
            allResults.sort((a, b) => b.score - a.score);
            setResults(allResults);
        }, (error) => {
            console.error("Error loading results:", error);
            setResults([]);
        });
        return () => unsub();
    }, [selectedTestId]);

    return (
        <div className="bg-gray-50 p-4 font-sans pb-20 min-h-screen">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-4">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-blue-600 transition">
                        <i className="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Test Results</h1>
                    <button onClick={() => navigate('/add-results')} className="text-gray-500 hover:text-teal-600 transition">
                        <i className="fas fa-plus-circle text-xl"></i>
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-t-4 border-green-500">
                    <label className="block text-sm font-bold text-gray-700 mb-2"><i className="fas fa-filter text-green-500 mr-2"></i>Select Test</label>
                    <select value={selectedTestId} onChange={e => setSelectedTestId(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-green-500 font-medium">
                        <option value="">{tests.length > 0 ? '-- Choose a Test --' : '-- No tests published --'}</option>
                        {tests.map(t => <option key={t.id} value={t.id}>{t.title} (Class {t.targetClass})</option>)}
                    </select>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-lg font-bold text-gray-800">Student Leaderboard</h2>
                        <span className="text-xs font-bold text-white bg-green-500 px-2 py-1 rounded-lg">{results.length} Attempts</span>
                    </div>
                    
                    <div className="space-y-3">
                        {!selectedTestId ? (
                            <div className="text-center py-8">
                                <i className="fas fa-trophy text-gray-200 text-5xl mb-3"></i>
                                <p className="text-sm text-gray-400">Select a test from above to see results.</p>
                            </div>
                        ) : results.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-4">No student has attempted this test yet.</p>
                        ) : (
                            results.map((data, idx) => {
                                const rank = idx + 1;
                                const percentage = Math.round((data.score / data.totalQuestions) * 100);
                                const dateStr = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : 'Just now';
                                
                                let rankBadge = <span className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-600 font-bold rounded-full text-xs">{rank}</span>;
                                let borderStyle = "border-gray-100";
                                
                                if (rank === 1) {
                                    rankBadge = <i className="fas fa-crown text-yellow-500 text-xl"></i>;
                                    borderStyle = "border-yellow-300 bg-yellow-50";
                                } else if (rank === 2) {
                                    rankBadge = <span className="w-6 h-6 flex items-center justify-center bg-gray-200 text-gray-600 font-bold rounded-full text-xs">2</span>;
                                } else if (rank === 3) {
                                    rankBadge = <span className="w-6 h-6 flex items-center justify-center bg-orange-100 text-orange-600 font-bold rounded-full text-xs">3</span>;
                                }

                                const scoreColor = percentage >= 40 ? "text-green-600" : "text-red-500";

                                return (
                                    <div key={idx} className={`p-3 border rounded-xl bg-white flex items-center justify-between shadow-sm ${borderStyle}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-8 text-center">{rankBadge}</div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-sm">{data.studentName}</h4>
                                                <p className="text-[10px] text-gray-400">{dateStr}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <h3 className={`text-lg font-bold ${scoreColor}`}>{data.score}/{data.totalQuestions}</h3>
                                            <p className="text-[10px] font-bold text-gray-500">{percentage}%</p>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
