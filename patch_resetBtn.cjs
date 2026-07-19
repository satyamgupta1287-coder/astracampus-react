const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');

const target = `<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2"><i className="fas fa-rupee-sign text-indigo-500 mr-2"></i>Process Payment</h3>`;

const replacer = `<div className="flex items-center justify-between mb-4 border-b pb-2">
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider"><i className="fas fa-rupee-sign text-indigo-500 mr-2"></i>Process Payment</h3>
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
                                            }} className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded font-bold hover:bg-red-200">
                                                Wipe Old Data
                                            </button>
                                        </div>`;

content = content.replace(target, replacer);

// Ensure deleteDoc is imported
if(!content.includes('deleteDoc')) {
    content = content.replace('addDoc, updateDoc, serverTimestamp', 'addDoc, updateDoc, deleteDoc, serverTimestamp');
}

fs.writeFileSync('src/pages/ManageFees.jsx', content);
