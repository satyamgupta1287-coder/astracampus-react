import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { 
    collection, query, where, onSnapshot, doc, getDoc, 
    addDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, setDoc, orderBy
} from 'firebase/firestore';
import { generateFeeReceiptPDF } from '../utils/pdfGenerator';
import PdfModal from '../components/PdfModal';
import {
  FaArrowLeft, FaWallet, FaFileInvoiceDollar, FaSearch, FaUserGraduate, 
  FaPrint, FaDownload, FaPlus, FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaHistory, FaBuilding
} from 'react-icons/fa';

export default function ManageFees() {
    const navigate = useNavigate();
    const [adminSchoolId, setAdminSchoolId] = useState(null);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [schoolInfo, setSchoolInfo] = useState({ name: "AstraCampus School" });
    
    // Data States
    const [students, setStudents] = useState([]);
    const [feeStructures, setFeeStructures] = useState([]);
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalCollected: 0, totalPending: 0, todayCollection: 0 });

    // Collect Fee States
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        amount: "",
        discount: 0,
        fine: 0,
        paymentMode: "Cash",
        transactionId: "",
        remarks: ""
    });
    const [selectedFees, setSelectedFees] = useState({});
    
    
    React.useEffect(() => {
        let pending = 0;
        const allMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
        
        students.forEach(student => {
            let total = student.totalFee || 0;
            if (feeStructures.length > 0) {
                const sclass = student.class || student.className;
                const struct = feeStructures.find(s => s.className === sclass || s.className === `Class ${sclass}`);
                if (struct) {
                    let applicableMonths = allMonths;
                    let startIdx = 0;
                    if (student.admissionDate) {
                        const date = new Date(student.admissionDate);
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
            }
            pending += Math.max(0, total - (student.paidFee || 0));
        });
        setStats(prev => ({ ...prev, totalPending: pending }));
    }, [students, feeStructures]);

    React.useEffect(() => {
        setSelectedFees({});
        setPaymentForm(prev => ({...prev, amount: ""}));
    }, [selectedStudent]);
    
    const currentStructure = React.useMemo(() => {
        const studentClass = selectedStudent?.class?.trim();
        const normalizedClass = studentClass && /^\d+$/.test(studentClass) ? `Class ${studentClass}` : studentClass;
        return feeStructures.find(f => f.className?.trim().toLowerCase() === normalizedClass?.toLowerCase() || f.className?.trim().toLowerCase() === studentClass?.toLowerCase()) || null;
    }, [feeStructures, selectedStudent]);

    const allMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    const getApplicableMonths = (admissionDateStr) => {
        let startIdx = 0;
        if (admissionDateStr) {
            const date = new Date(admissionDateStr);
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
        return allMonths.slice(startIdx);
    };

    const applicableMonths = React.useMemo(() => {
        if (!selectedStudent) return allMonths;
        return getApplicableMonths(selectedStudent.admissionDate);
    }, [selectedStudent]);

    const applicableMonthsTillNow = React.useMemo(() => {
        if (!selectedStudent) return allMonths;
        let startIdx = 0;
        if (selectedStudent.admissionDate) {
            const date = new Date(selectedStudent.admissionDate);
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
        return startIdx > endIdx ? [] : allMonths.slice(startIdx, endIdx + 1);
    }, [selectedStudent]);

    const paidData = React.useMemo(() => {
        const data = { months: {}, heads: {} };
        if (!selectedStudent) return data;
        const studentReceipts = receipts.filter(r => (r.studentId === selectedStudent.id || r.admissionNo === selectedStudent.admissionNo) && r.status !== 'Cancelled');
        
        studentReceipts.forEach(r => {
            if (r.feeHeads && Array.isArray(r.feeHeads)) {
                r.feeHeads.forEach(h => {
                    const headName = h.headName || h.name.split(' (')[0];
                    if (h.months || h.name.includes('(')) {
                        if (!data.months[headName]) data.months[headName] = [];
                        let monthsArr = h.months;
                        if (!monthsArr) {
                            const match = h.name.match(/\((.*?)\)/);
                            if (match) monthsArr = match[1].split(',').map(s => s.trim());
                        }
                        if (monthsArr) data.months[headName].push(...monthsArr);
                    } else {
                        data.heads[headName] = true;
                    }
                });
            }
        });
        return data;
    }, [receipts, selectedStudent]);

    const computedTotalFee = React.useMemo(() => {
        if (!currentStructure) return selectedStudent?.totalFee || 0;
        return currentStructure.heads.reduce((sum, h) => {
            if (h.frequency === 'Monthly') return sum + (h.amount * applicableMonthsTillNow.length);
            return sum + h.amount;
        }, 0);
    }, [currentStructure, applicableMonthsTillNow, selectedStudent]);

    const computedAmount = React.useMemo(() => {
        if (!currentStructure) return Number(paymentForm.amount) || 0;
        let sum = 0;
        currentStructure.heads.forEach(h => {
            const sel = selectedFees[h.name];
            if (!sel || !sel.selected) return;
            if (h.frequency === 'Monthly') {
                sum += (h.amount * (sel.months?.length || 0));
            } else {
                sum += h.amount;
            }
        });
        return sum;
    }, [selectedFees, currentStructure, paymentForm.amount]);
    

    const [isProcessing, setIsProcessing] = useState(false);
    const [pdfData, setPdfData] = useState(null);

    // Structure States
    const [newStructure, setNewStructure] = useState({
        className: "",
        session: "2024-2025",
        heads: [{ name: "Tuition Fee", amount: 0, frequency: "Monthly" }]
    });

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const adminDoc = await getDoc(doc(db, 'users', user.uid));
                if (adminDoc.exists()) {
                    const schoolId = adminDoc.data().schoolId;
                    setAdminSchoolId(schoolId);
                    fetchInitialData(schoolId);
                }
            } else {
                navigate('/');
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]);

    const fetchInitialData = async (schoolId) => {
        const instDoc = await getDoc(doc(db, "institutes", schoolId));
        if (instDoc.exists()) setSchoolInfo(instDoc.data());
        // Fetch Students
        const stuQ = query(collection(db, "users"), where("schoolId", "==", schoolId), where("role", "==", "student"));
        onSnapshot(stuQ, (snap) => {
            let stu = [];
            snap.forEach(d => {
                const data = d.data();
                stu.push({ id: d.id, ...data });
            });
            setStudents(stu);
        });

        // Fetch Fee Structures
        const structQ = query(collection(db, "feeStructures"), where("schoolId", "==", schoolId));
        onSnapshot(structQ, (snap) => {
            let structs = [];
            snap.forEach(d => structs.push({ id: d.id, ...d.data() }));
            setFeeStructures(structs);
        });

        // Fetch Receipts
        const recQ = query(collection(db, "receipts"), where("schoolId", "==", schoolId));
        onSnapshot(recQ, (snap) => {
            let recs = [];
            let collected = 0;
            let todayColl = 0;
            const today = new Date().toDateString();
            
            snap.forEach(d => {
                const data = d.data();
                recs.push({ id: d.id, ...data });
                if (data.status !== "Cancelled") {
                    collected += data.amount;
                    if (data.createdAt && typeof data.createdAt.toDate === 'function' && data.createdAt.toDate().toDateString() === today) {
                        todayColl += data.amount;
                    }
                }
            });
            recs.sort((a, b) => (b.createdAt && typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : Date.now()) - (a.createdAt && typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : Date.now()));
            setReceipts(recs);
            setStats(prev => ({ ...prev, totalCollected: collected, todayCollection: todayColl }));
            setLoading(false);
        });
    };

    const handleAddHead = () => {
        setNewStructure(prev => ({
            ...prev,
            heads: [...prev.heads, { name: "", amount: 0, frequency: "Monthly" }]
        }));
    };

    const handleHeadChange = (index, field, value) => {
        const updatedHeads = [...newStructure.heads];
        updatedHeads[index][field] = field === 'amount' ? Number(value) : value;
        setNewStructure(prev => ({ ...prev, heads: updatedHeads }));
    };

    const saveFeeStructure = async () => {
        if (!newStructure.className) return console.log("Please select a class");
        try {
            const totalAmount = newStructure.heads.reduce((sum, h) => sum + h.amount, 0);
            await addDoc(collection(db, "feeStructures"), {
                schoolId: adminSchoolId,
                className: newStructure.className,
                session: newStructure.session,
                heads: newStructure.heads,
                totalAmount,
                createdAt: serverTimestamp()
            });
            console.log("Fee Structure saved!");
            setNewStructure({ className: "", session: "2024-2025", heads: [{ name: "Tuition Fee", amount: 0 }] });
        } catch (error) {
            console.error(error);
            console.log("Failed to save fee structure");
        }
    };

    const handleCollectFee = async (e) => {
        e.preventDefault();
        if (!selectedStudent) return console.log("Select a student");
        if ((currentStructure ? computedAmount : Number(paymentForm.amount)) <= 0) return console.log("Enter valid amount");

        setIsProcessing(true);
        try {
            const receiptNo = `REC-${Math.floor(Math.random() * 1000000)}`;
            const receiptData = {
                receiptNo,
                schoolId: adminSchoolId,
                studentId: selectedStudent.id,
                studentName: selectedStudent.name || selectedStudent.firstName || "Student",
                admissionNo: selectedStudent.admissionNo || selectedStudent.studentId || "N/A",
                className: selectedStudent.class || "N/A",
                session: selectedStudent.session || "2024-2025",
                amount: currentStructure ? computedAmount : Number(paymentForm.amount),
                feeHeads: currentStructure ? currentStructure.heads.filter(h => selectedFees[h.name]?.selected && (h.frequency !== 'Monthly' || (selectedFees[h.name].months?.length > 0))).map(h => ({
                    name: h.frequency === 'Monthly' ? `${h.name} (${selectedFees[h.name].months.join(', ')})` : h.name,
                    amount: h.frequency === 'Monthly' ? (h.amount * (selectedFees[h.name].months?.length || 0)) : h.amount
                })) : [{ name: "Fee Payment", amount: Number(paymentForm.amount) }],
                discount: Number(paymentForm.discount),
                fine: Number(paymentForm.fine),
                paymentMode: paymentForm.paymentMode,
                transactionId: paymentForm.transactionId,
                remarks: paymentForm.remarks,
                date: new Date().toISOString(),
                status: "Valid",
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "receipts"), receiptData);

            const userRef = doc(db, "users", selectedStudent.id);
            const currentPaid = selectedStudent.paidFee || 0;
            const currentTotal = selectedStudent.totalFee || 0;
            
            await updateDoc(userRef, {
                paidFee: currentPaid + (currentStructure ? computedAmount : Number(paymentForm.amount))
            });

            console.log(`Fee Collected! Receipt No: ${receiptNo}`);
            setPaymentForm({ amount: "", discount: 0, fine: 0, paymentMode: "Cash", transactionId: "", remarks: "" });
            setSelectedStudent(null);
            
            // Optionally generate PDF immediately
            setPdfData(generateFeeReceiptPDF(receiptData, schoolInfo));
            
        } catch (error) {
            console.error(error);
            console.log("Payment failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const cancelReceipt = async (id, amount, studentId) => {
        if (!true) return;
        try {
            await updateDoc(doc(db, "receipts", id), { status: "Cancelled" });
            
            const studentRef = doc(db, "users", studentId);
            const studentSnap = await getDoc(studentRef);
            if (studentSnap.exists()) {
                const currentPaid = studentSnap.data().paidFee || 0;
                await updateDoc(studentRef, { paidFee: Math.max(0, currentPaid - amount) });
            }
            console.log("Receipt cancelled successfully");
        } catch (error) {
            console.error(error);
            console.log("Failed to cancel receipt");
        }
    };

    
    const exportReceiptsCSV = () => {
        if (receipts.length === 0) return console.log("No receipts to export");
        const headers = ["Receipt No", "Date", "Student Name", "Admission No", "Class", "Amount", "Discount", "Fine", "Net Paid", "Mode", "Status"];
        const rows = receipts.map(r => [
            r.receiptNo,
            new Date(r.createdAt?.toDate()).toLocaleDateString(),
            r.studentName,
            r.admissionNo,
            r.className,
            r.amount,
            r.discount || 0,
            r.fine || 0,
            r.amount - (r.discount || 0) + (r.fine || 0),
            r.paymentMode,
            r.status
        ]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "Fee_Receipts.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredStudents = students.filter(s => 
        (s.name?.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (s.studentId?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.class?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="bg-slate-50 min-h-screen font-sans pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate('/admin')} className="text-slate-500 hover:text-indigo-600 transition p-2 rounded-full hover:bg-indigo-50">
                                <FaArrowLeft className="text-xl" />
                            </button>
                            <h1 className="text-xl font-bold text-slate-800">Fees & Billing ERP</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={async () => {
                                // Removed window.confirm due to iframe restrictions
                                const batch = [];
                                receipts.forEach(r => {
                                    batch.push(deleteDoc(doc(db, "receipts", r.id)));
                                });
                                students.forEach(s => {
                                    batch.push(updateDoc(doc(db, "users", s.id), { paidFee: 0, totalFee: 0 }));
                                });
                                try {
                                    await Promise.all(batch);
                                    console.log("All fee data has been wiped clean!");
                                } catch(e) {
                                    console.error(e);
                                    console.error("Error wiping data");
                                }
                            }} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition">
                                <i className="fas fa-trash-alt"></i> Reset All Fees Data
                            </button>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                            {['dashboard', 'collect', 'structures', 'receipts'].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                
                {/* Dashboard Tab */}
                {activeTab === "dashboard" && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
                                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shrink-0">
                                    <FaMoneyBillWave />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Collected</p>
                                    <h2 className="text-2xl font-black text-slate-800">₹ {stats.totalCollected.toLocaleString()}</h2>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
                                <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-2xl shrink-0">
                                    <FaFileInvoiceDollar />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Pending</p>
                                    <h2 className="text-2xl font-black text-slate-800">₹ {stats.totalPending.toLocaleString()}</h2>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
                                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl shrink-0">
                                    <FaHistory />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Today's Collection</p>
                                    <h2 className="text-2xl font-black text-slate-800">₹ {stats.todayCollection.toLocaleString()}</h2>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Transactions</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-xl">Receipt No</th>
                                            <th className="px-4 py-3">Student</th>
                                            <th className="px-4 py-3">Amount</th>
                                            <th className="px-4 py-3">Mode</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3 rounded-r-xl">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {receipts.slice(0,5).map(rec => (
                                            <tr key={rec.id} className="hover:bg-slate-50 transition">
                                                <td className="px-4 py-4 text-sm font-bold text-indigo-600">{rec.receiptNo}</td>
                                                <td className="px-4 py-4 text-sm font-bold text-slate-700">{rec.studentName} <span className="text-xs font-normal text-slate-400 block">{rec.className}</span></td>
                                                <td className="px-4 py-4 text-sm font-bold text-emerald-600">₹ {rec.amount}</td>
                                                <td className="px-4 py-4 text-sm font-medium text-slate-600">{rec.paymentMode}</td>
                                                <td className="px-4 py-4 text-sm text-slate-500">{rec.createdAt && typeof rec.createdAt.toDate === 'function' ? rec.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()}</td>
                                                <td className="px-4 py-4">
                                                    {rec.status === 'Valid' ? 
                                                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-xs font-bold">Valid</span> : 
                                                        <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-md text-xs font-bold">Cancelled</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                        {receipts.length === 0 && (
                                            <tr><td colSpan="6" className="text-center py-8 text-slate-400">No recent transactions</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Collect Fee Tab */}
                {activeTab === "collect" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                        {/* Student Search & List */}
                        <div className="lg:col-span-5 space-y-4">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                                <div className="relative">
                                    <FaSearch className="absolute left-4 top-3.5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search by name, class, or admission no..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm font-medium"
                                    />
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[600px] flex flex-col">
                                <div className="p-4 border-b border-slate-100 bg-slate-50">
                                    <h3 className="font-bold text-slate-700 text-sm">Select Student</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2">
                                    {filteredStudents.length === 0 ? (
                                        <p className="text-center text-slate-400 py-10 text-sm">No students found</p>
                                    ) : (
                                        filteredStudents.map(student => {
                                            let total = student.totalFee || 0;
                                            const sclass = student.class || student.className;
                                            const struct = feeStructures.find(s => s.className === sclass || s.className === `Class ${sclass}`);
                                            if (struct) {
                                                let applicableMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
                                                let startIdx = 0;
                                                if (student.admissionDate) {
                                                    const date = new Date(student.admissionDate);
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
                                                applicableMonths = startIdx > endIdx ? [] : applicableMonths.slice(startIdx, endIdx + 1);

                                                total = struct.heads.reduce((sum, h) => {
                                                    if (h.frequency === 'Monthly') return sum + (h.amount * applicableMonths.length);
                                                    return sum + h.amount;
                                                }, 0);
                                            }
                                            const pending = Math.max(0, total - (student.paidFee || 0));

                                            return (
                                            <div 
                                                key={student.id} 
                                                onClick={() => setSelectedStudent(student)}
                                                className={`p-3 flex items-center gap-3 rounded-xl cursor-pointer transition mb-1 ${selectedStudent?.id === student.id ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}`}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 overflow-hidden">
                                                    <img src={student.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Student" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-800 text-sm truncate">{student.name || student.firstName}</h4>
                                                    <p className="text-[11px] text-slate-500 font-medium">Class: {student.class || 'N/A'} | ID: {student.studentId || 'N/A'}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Pending</p>
                                                    <p className={`text-xs font-bold ${pending > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                        ₹ {pending}
                                                    </p>
                                                </div>
                                            </div>
                                        )})
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Panel */}
                        <div className="lg:col-span-7">
                            {selectedStudent ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                    {/* Student Fee Profile Header */}
                                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-full bg-slate-700 overflow-hidden border-2 border-white/20 shrink-0">
                                            <img src={selectedStudent.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Student" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold">{selectedStudent.name || selectedStudent.firstName}</h2>
                                            <div className="flex gap-4 mt-1 text-sm text-slate-300 font-medium">
                                                <span><i className="fas fa-id-card mr-1"></i> {selectedStudent.studentId || selectedStudent.admissionNo || 'N/A'}</span>
                                                <span><i className="fas fa-chalkboard mr-1"></i> Class: {selectedStudent.class || 'N/A'} {selectedStudent.section || ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Fee Summary Cards */}
                                    <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                                        <div className="p-4 text-center bg-slate-50">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Fee</p>
                                            <p className="text-lg font-black text-slate-700">₹ {computedTotalFee}</p>
                                        </div>
                                        <div className="p-4 text-center bg-emerald-50">
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Paid Fee</p>
                                            <p className="text-lg font-black text-emerald-700">₹ {selectedStudent.paidFee || 0}</p>
                                        </div>
                                        <div className="p-4 text-center bg-rose-50 relative group">
        <button 
            onClick={() => {
                const pending = Math.max(0, computedTotalFee - (selectedStudent.paidFee||0));
                if(pending <= 0) return console.log("No pending fees!");
                const msg = encodeURIComponent(`Dear Parent, this is a gentle reminder that fee of Rs ${pending} is pending for ${selectedStudent.name}. Please pay at the earliest.`);
                window.open(`https://wa.me/?text=${msg}`, '_blank');
            }}
            className="absolute -top-3 -right-3 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md hover:bg-green-600"
            title="Send WhatsApp Reminder"
        >
            <i className="fab fa-whatsapp"></i>
        </button>
                                            <p className="text-[10px] font-bold text-rose-600 uppercase">Pending Fee</p>
                                            <p className="text-lg font-black text-rose-700">₹ {Math.max(0, computedTotalFee - (selectedStudent.paidFee||0))}</p>
                                        </div>
                                    </div>

                                    {/* Payment Form */}
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4 border-b pb-2">
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider"><i className="fas fa-rupee-sign text-indigo-500 mr-2"></i>Process Payment</h3>
                                            <button type="button" onClick={async () => {
                                                if(!true) return;
                                                const batch = [];
                                                receipts.forEach(r => {
                                                    batch.push(deleteDoc(doc(db, "receipts", r.id)));
                                                });
                                                students.forEach(s => {
                                                    batch.push(updateDoc(doc(db, "users", s.id), { paidFee: 0, totalFee: 0 }));
                                                });
                                                try {
                                                    await Promise.all(batch);
                                                    console.log("All fee data has been wiped clean!");
                                                } catch(e) {
                                                    console.error(e);
                                                    console.log("Error wiping data");
                                                }
                                            }} className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded font-bold hover:bg-red-200">
                                                Wipe Old Data
                                            </button>
                                        </div>
                                        
                                        {currentStructure && (
                                            <div className="mb-6 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Select Fee Heads to Collect</h4>
                                                {currentStructure.heads.map((h, i) => {
                                                    const isPaidOnce = h.frequency !== 'Monthly' && paidData.heads[h.name];
                                                    if (isPaidOnce) return null;

                                                    let unpaidMonths = [];
                                                    if (h.frequency === 'Monthly') {
                                                        unpaidMonths = applicableMonths.filter(m => !(paidData.months[h.name] && paidData.months[h.name].includes(m)));
                                                        if (unpaidMonths.length === 0) return null;
                                                    }

                                                    const sel = selectedFees[h.name] || { selected: false, months: [] };
                                                    return (
                                                        <div key={i} className="border border-slate-200 rounded-lg bg-white p-3 shadow-sm">
                                                            <div className="flex items-center justify-between">
                                                                <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-700">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={sel.selected}
                                                                        onChange={e => {
                                                                            const isChecked = e.target.checked;
                                                                            setSelectedFees(prev => ({
                                                                                ...prev, 
                                                                                [h.name]: { 
    selected: isChecked, 
    months: isChecked ? ((h.frequency === 'Monthly' && unpaidMonths.length > 0) ? (
        (() => {
            const currDate = new Date();
            let currMonth = currDate.getMonth();
            let endIdx = currMonth >= 3 ? currMonth - 3 : currMonth + 9;
            const monthsTillNow = allMonths.slice(0, endIdx + 1);
            const defaultMonths = unpaidMonths.filter(m => monthsTillNow.includes(m));
            return defaultMonths.length > 0 ? defaultMonths : [unpaidMonths[0]];
        })()
    ) : []) : [] 
}
                                                                            }));
                                                                        }}
                                                                        className="w-4 h-4 text-indigo-600 rounded"
                                                                    />
                                                                    {h.name} <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{h.frequency || "Monthly"}</span>
                                                                </label>
                                                                <span className="font-bold text-slate-800">₹{h.amount} {h.frequency === 'Monthly' ? '/ mo' : ''}</span>
                                                            </div>
                                                            {sel.selected && h.frequency === 'Monthly' && (
                                                                <div className="mt-3 grid grid-cols-4 md:grid-cols-6 gap-2">
                                                                    {unpaidMonths.map(m => (
                                                                        <label key={m} className={`text-xs font-bold px-2 py-1.5 rounded cursor-pointer text-center border transition ${sel.months?.includes(m) ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                                                                            <input 
                                                                                type="checkbox" 
                                                                                className="hidden"
                                                                                checked={sel.months?.includes(m)}
                                                                                onChange={e => {
                                                                                    const newMonths = e.target.checked 
                                                                                        ? [...(sel.months || []), m] 
                                                                                        : (sel.months || []).filter(x => x !== m);
                                                                                    setSelectedFees(prev => ({
                                                                                        ...prev,
                                                                                        [h.name]: { ...sel, months: newMonths }
                                                                                    }));
                                                                                }}
                                                                            />
                                                                            {m}
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <form onSubmit={handleCollectFee} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Amount Paying Now (₹) *</label>
                                                    <input 
                                                        type="number" required={!currentStructure}
                                                        readOnly={!!currentStructure}
                                                        value={currentStructure ? computedAmount : paymentForm.amount}
                                                        onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                                                        className={`w-full p-3 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 text-lg ${currentStructure ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-500'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Payment Mode *</label>
                                                    <select 
                                                        value={paymentForm.paymentMode}
                                                        onChange={e => setPaymentForm({...paymentForm, paymentMode: e.target.value})}
                                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                    >
                                                        <option>Cash</option>
                                                        <option>UPI</option>
                                                        <option>Bank Transfer</option>
                                                        <option>Cheque</option>
                                                        <option>Card</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Discount (₹)</label>
                                                    <input 
                                                        type="number" 
                                                        value={paymentForm.discount}
                                                        onChange={e => setPaymentForm({...paymentForm, discount: e.target.value})}
                                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Fine / Late Fee (₹)</label>
                                                    <input 
                                                        type="number" 
                                                        value={paymentForm.fine}
                                                        onChange={e => setPaymentForm({...paymentForm, fine: e.target.value})}
                                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                    />
                                                </div>
                                            </div>

                                            {paymentForm.paymentMode !== 'Cash' && (
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Transaction ID / Cheque No.</label>
                                                    <input 
                                                        type="text" 
                                                        value={paymentForm.transactionId}
                                                        onChange={e => setPaymentForm({...paymentForm, transactionId: e.target.value})}
                                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                                                    />
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Remarks (Optional)</label>
                                                <textarea 
                                                    value={paymentForm.remarks}
                                                    onChange={e => setPaymentForm({...paymentForm, remarks: e.target.value})}
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 h-20 resize-none"
                                                ></textarea>
                                            </div>

                                            <button 
                                                type="submit" 
                                                disabled={isProcessing}
                                                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] disabled:opacity-50 flex justify-center items-center gap-2"
                                            >
                                                {isProcessing ? "Processing..." : <><i className="fas fa-check-circle"></i> Collect Fee & Generate Receipt</>}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-[600px] flex flex-col items-center justify-center text-center p-6">
                                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 text-4xl mb-4">
                                        <FaUserGraduate />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-700 mb-2">No Student Selected</h2>
                                    <p className="text-slate-500 text-sm max-w-sm">Please search and select a student from the list on the left to view their fee profile and process payments.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Structures Tab */}
                {activeTab === "structures" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                        {/* Create Structure Form */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2"><FaBuilding className="inline mr-2 text-indigo-500" />Create Master Fee Structure</h3>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Class / Batch</label>
                                    <select 
                                        value={newStructure.className}
                                        onChange={e => setNewStructure({...newStructure, className: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                    >
                                        <option value="">Select Class</option>
                                        {[...Array(12).keys()].map(i => <option key={i+1} value={`Class ${i+1}`}>Class {i+1}</option>)}
                                        <option value="Nursery">Nursery</option>
                                        <option value="LKG">LKG</option>
                                        <option value="UKG">UKG</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Academic Session</label>
                                    <input 
                                        type="text" 
                                        value={newStructure.session}
                                        onChange={e => setNewStructure({...newStructure, session: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-600 mb-2">Fee Heads (Breakdown)</label>
                                {newStructure.heads.map((head, index) => (
                                    <div key={index} className="flex gap-2 mb-3 items-center">
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Tuition Fee"
                                            value={head.name}
                                            onChange={e => handleHeadChange(index, 'name', e.target.value)}
                                            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 text-sm"
                                        />
                                        <select
                                            value={head.frequency || "Monthly"}
                                            onChange={e => handleHeadChange(index, 'frequency', e.target.value)}
                                            className="w-28 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 text-sm"
                                        >
                                            <option value="Monthly">Monthly</option>
                                            <option value="Annually">Annually</option>
                                            <option value="Once">Once/Exam</option>
                                        </select>
                                        <input 
                                            type="number" 
                                            placeholder="Amount (₹)"
                                            value={head.amount}
                                            onChange={e => handleHeadChange(index, 'amount', e.target.value)}
                                            className="w-24 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 text-sm text-right"
                                        />
                                    </div>
                                ))}
                                <button onClick={handleAddHead} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-2">
                                    <FaPlus className="text-xs" /> Add Another Head
                                </button>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
                                <span className="font-bold text-slate-600 uppercase text-sm">Total Structure Amount</span>
                                <span className="text-xl font-black text-slate-800">₹ {newStructure.heads.reduce((sum, h) => sum + h.amount, 0)}</span>
                            </div>

                            <button 
                                onClick={saveFeeStructure}
                                className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-900 transition shadow-md flex justify-center items-center gap-2"
                            >
                                Save Fee Structure
                            </button>
                        </div>

                        {/* Existing Structures */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-y-auto max-h-[800px]">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">Existing Structures</h3>
                            <div className="space-y-4">
                                {feeStructures.length === 0 ? (
                                    <p className="text-center text-slate-400 py-4 text-sm">No structures created yet.</p>
                                ) : (
                                    feeStructures.map(struct => (
                                        <div key={struct.id} className="border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
                                            <div className="flex justify-between items-center mb-3">
                                                <div>
                                                    <h4 className="font-bold text-slate-800">{struct.className}</h4>
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{struct.session}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                                                    <p className="font-black text-indigo-600">₹ {struct.totalAmount}</p>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                                                {struct.heads.map((h, i) => (
                                                    <div key={i} className="flex justify-between text-xs font-medium text-slate-600">
                                                        <span>{h.name}</span>
                                                        <span className="font-bold text-slate-500 text-[10px] mr-2">{h.frequency || "Monthly"}</span><span className="font-bold">₹ {h.amount}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Receipts Tab */}
                {activeTab === "receipts" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">All Fee Receipts</h3>
                            <button onClick={exportReceiptsCSV} className="mr-3 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-emerald-100 transition border border-emerald-100 flex items-center gap-2">
        <i className="fas fa-file-csv"></i> Export CSV
    </button>
    <div className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                Total: {receipts.length}
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-xl">Receipt No</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Student Details</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Mode</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 rounded-r-xl text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {receipts.map(rec => (
                                        <tr key={rec.id} className="hover:bg-slate-50 transition group">
                                            <td className="px-4 py-4 text-sm font-bold text-indigo-600 whitespace-nowrap">{rec.receiptNo}</td>
                                            <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">{(rec.createdAt && typeof rec.createdAt.toDate === 'function' ? rec.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString())}</td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-bold text-slate-800 whitespace-nowrap">{rec.studentName}</p>
                                                <p className="text-[11px] text-slate-500 font-medium">ID: {rec.admissionNo} | {rec.className}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-black text-emerald-600">₹ {rec.amount}</p>
                                                {(rec.discount > 0 || rec.fine > 0) && (
                                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                        {rec.discount > 0 && <span>Dis: ₹{rec.discount} </span>}
                                                        {rec.fine > 0 && <span>Fine: ₹{rec.fine}</span>}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                                                {rec.paymentMode}
                                                {rec.transactionId && <span className="block text-[10px] text-slate-400">Ref: {rec.transactionId}</span>}
                                            </td>
                                            <td className="px-4 py-4">
                                                {rec.status === 'Valid' ? 
                                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-xs font-bold border border-emerald-100 flex items-center gap-1 w-max"><FaCheckCircle/> Valid</span> : 
                                                    <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-md text-xs font-bold border border-rose-100 flex items-center gap-1 w-max"><FaTimesCircle/> Cancelled</span>
                                                }
                                            </td>
                                            <td className="px-4 py-4 text-center space-x-2 whitespace-nowrap">
                                                <button 
                                                    onClick={() => setPdfData(generateFeeReceiptPDF(rec, schoolInfo))}
                                                    className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition inline-flex items-center justify-center border border-indigo-100"
                                                    title="Download PDF"
                                                >
                                                    <FaDownload className="text-xs" />
                                                </button>
                                                {rec.status === 'Valid' && (
                                                    <button 
                                                        onClick={() => cancelReceipt(rec.id, rec.amount, rec.studentId)}
                                                        className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition inline-flex items-center justify-center border border-rose-100"
                                                        title="Cancel Receipt"
                                                    >
                                                        <FaTimesCircle className="text-xs" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {receipts.length === 0 && (
                                        <tr><td colSpan="7" className="text-center py-12 text-slate-400 text-sm">No receipts generated yet</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
            <PdfModal pdfData={pdfData} onClose={() => setPdfData(null)} />
        </div>
    );
}
