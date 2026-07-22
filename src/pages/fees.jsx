import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, getDocs } from "firebase/firestore";
import { generateFeeReceiptPDF } from '../utils/pdfGenerator';
import PdfModal from '../components/PdfModal';
import { FaArrowLeft, FaWallet, FaFileInvoiceDollar, FaDownload, FaHistory, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function Fees() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [feeData, setFeeData] = useState({ total: 0, paid: 0, pending: 0 });
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pdfData, setPdfData] = useState(null);
    const [schoolInfo, setSchoolInfo] = useState({ name: "AstraCampus School" });

    useEffect(() => {
        let unsubs = [];
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Fetch User Fee Data
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData(data);
                    
                    let total = data.totalFee || 0;
                    const paid = data.paidFee || 0;
                    
                    if (data.schoolId && data.class) {
                        try {
                            const structQ = query(collection(db, "feeStructures"), where("schoolId", "==", data.schoolId), where("className", "in", [data.class, `Class ${data.class}`]));
                            const structSnap = await getDocs(structQ);
                            if (!structSnap.empty) {
                                const struct = structSnap.docs[0].data();
                                const allMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
                                let applicableMonths = allMonths;
                                let startIdx = 0;
                                if (data.admissionDate) {
                                    const date = new Date(data.admissionDate);
                                    if (!isNaN(date.getTime())) {
                                        const currDate = new Date();
                                        let currentAcadYearStart = new Date(currDate.getFullYear(), 3, 1);
                                        if (currDate.getMonth() < 3) currentAcadYearStart = new Date(currDate.getFullYear() - 1, 3, 1);
                                        if (date < currentAcadYearStart) {
                                            startIdx = 0;
                                        } else {
                                            let month = date.getMonth();
                                            startIdx = month >= 3 ? month - 3 : month + 9;
                                        }
                                    }
                                }
                                const cDate = new Date();
                                let cMonth = cDate.getMonth();
                                let endIdx = cMonth >= 3 ? cMonth - 3 : cMonth + 9;
                                applicableMonths = startIdx > endIdx ? [] : allMonths.slice(startIdx, endIdx + 1);

                                total = struct.heads.reduce((sum, h) => {
                                    if (h.frequency === 'Monthly') return sum + (h.amount * applicableMonths.length);
                                    return sum + h.amount;
                                }, 0);
                            }
                        } catch(e) {}
                    }
                    
                    const pending = Math.max(0, total - paid);
                    setFeeData({ total, paid, pending });
                    if (data.schoolId) {
                        const instDoc = await getDoc(doc(db, "institutes", data.schoolId));
                        if (instDoc.exists()) setSchoolInfo(instDoc.data());
                    }
                }

                // Fetch Receipt History
                const recQ = query(
                    collection(db, "receipts"), 
                    where("studentId", "==", user.uid)
                );
                
                unsubs.push(onSnapshot(recQ, (snap) => {
                    let recs = [];
                    snap.forEach(d => recs.push({ id: d.id, ...d.data() }));
                    recs.sort((a, b) => (b.createdAt && typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : Date.now()) - (a.createdAt && typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : Date.now()));
                    setReceipts(recs);
                    setLoading(false);
                }));

            } else {
                navigate("/");
            }
        });
        return () => { unsubscribe(); unsubs.forEach(u => u()); };
    }, [navigate]);

    return (
        <div className="bg-slate-50 min-h-screen font-sans pb-24 selection:bg-indigo-100">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto relative h-full">
                
                {/* Header */}
                <div className="flex justify-between items-center px-5 pt-6 pb-4 sticky top-0 bg-slate-50/80 backdrop-blur-md z-40 border-b border-slate-200/50">
                    <button onClick={() => navigate('/dashboard')} className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition active:scale-95">
                        <FaArrowLeft />
                    </button>
                    <h1 className="text-lg font-bold text-slate-800">Fee Profile</h1>
                    <div className="w-10"></div>
                </div>

                <div className="px-5 mt-4 space-y-6">
                    
                    {/* Fee Summary Widget */}
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"></div>
                        
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Due</h2>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight">₹ {Math.max(0, feeData.pending).toLocaleString()}</h1>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl shadow-inner border border-indigo-100/50">
                                <FaWallet />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 md:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 lg:grid-cols-5 lg:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Fee</p>
                                <p className="text-lg font-bold text-slate-700">₹ {feeData.total.toLocaleString()}</p>
                            </div>
                            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100/50">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Paid</p>
                                <p className="text-lg font-bold text-emerald-700">₹ {feeData.paid.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Student Profile Info */}
                    {userData && (
                        <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                <img src={userData.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Student" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800 leading-tight">{userData.name || userData.firstName}</h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">Class: {userData.class} {userData.section} • ID: {userData.studentId || userData.admissionNo}</p>
                            </div>
                        </div>
                    )}

                    {/* Payment History & Receipts */}
                    <div>
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <FaHistory className="text-indigo-500" /> Payment Timeline
                            </h2>
                        </div>

                        {loading ? (
                            <p className="text-center text-sm text-slate-400 py-8">Loading receipts...</p>
                        ) : receipts.length === 0 ? (
                            <div className="bg-white rounded-[24px] p-8 text-center border border-slate-100 shadow-sm">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                                    <FaFileInvoiceDollar className="text-2xl" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-700 mb-1">No Payments Yet</h3>
                                <p className="text-xs text-slate-400 font-medium max-w-[200px] mx-auto">Your payment history and receipts will appear here.</p>
                            </div>
                        ) : (
                            <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
                                {receipts.map((rec) => (
                                    <div key={rec.id} className="relative">
                                        {/* Timeline dot */}
                                        <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white ${rec.status === 'Valid' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                        
                                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 mb-0.5">{(rec.createdAt && typeof rec.createdAt.toDate === 'function' ? rec.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }))}</p>
                                                    <h4 className="text-sm font-bold text-slate-800">{rec.receiptNo}</h4>
                                                </div>
                                                <div className="text-right">
                                                    <h3 className={`text-lg font-black ${rec.status === 'Valid' ? 'text-emerald-600' : 'text-rose-500 line-through'}`}>₹ {rec.amount}</h3>
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${rec.status === 'Valid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {rec.status}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center border border-slate-100">
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                                                        {rec.paymentMode === 'Cash' ? <FaWallet className="text-[10px]" /> : <FaFileInvoiceDollar className="text-[10px]" />}
                                                    </div>
                                                    {rec.paymentMode} {rec.transactionId && <span className="text-slate-400">• Ref: {rec.transactionId}</span>}
                                                </div>
                                                
                                                {rec.status === 'Valid' && (
                                                    <button 
                                                        onClick={() => setPdfData(generateFeeReceiptPDF(rec, schoolInfo))}
                                                        className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                                                    >
                                                        <FaDownload /> PDF
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
            <PdfModal pdfData={pdfData} onClose={() => setPdfData(null)} />
        </div>
    );
}
