const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');

const target = `<div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate('/admin')} className="text-slate-500 hover:text-indigo-600 transition p-2 rounded-full hover:bg-indigo-50">
                                <FaArrowLeft className="text-xl" />
                            </button>
                            <h1 className="text-xl font-bold text-slate-800">Fees & Billing ERP</h1>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl">`;

const replacer = `<div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate('/admin')} className="text-slate-500 hover:text-indigo-600 transition p-2 rounded-full hover:bg-indigo-50">
                                <FaArrowLeft className="text-xl" />
                            </button>
                            <h1 className="text-xl font-bold text-slate-800">Fees & Billing ERP</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={async () => {
                                if(!window.confirm("Are you sure you want to RESET all receipts and fee data? This cannot be undone.")) return;
                                const batch = [];
                                receipts.forEach(r => {
                                    batch.push(deleteDoc(doc(db, "receipts", r.id)));
                                });
                                students.forEach(s => {
                                    batch.push(updateDoc(doc(db, "users", s.id), { paidFee: 0, totalFee: 0 }));
                                });
                                try {
                                    await Promise.all(batch);
                                    alert("All fee data has been wiped clean!");
                                } catch(e) {
                                    console.error(e);
                                    alert("Error wiping data");
                                }
                            }} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition">
                                <i className="fas fa-trash-alt"></i> Reset All Fees Data
                            </button>
                            <div className="flex bg-slate-100 p-1 rounded-xl">`;

content = content.replace(target, replacer);

// Ensure deleteDoc is imported
if(!content.includes('deleteDoc')) {
    content = content.replace('addDoc, updateDoc, serverTimestamp', 'addDoc, updateDoc, deleteDoc, serverTimestamp');
}

fs.writeFileSync('src/pages/ManageFees.jsx', content);
