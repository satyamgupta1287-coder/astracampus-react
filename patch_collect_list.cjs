const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');

const replacer = `filteredStudents.map(student => {
                                            let total = student.totalFee || 0;
                                            const sclass = student.class || student.className;
                                            const struct = feeStructures.find(s => s.className === sclass || s.className === \`Class \${sclass}\`);
                                            if (struct) {
                                                let applicableMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
                                                if (student.admissionDate) {
                                                    const date = new Date(student.admissionDate);
                                                    if (!isNaN(date.getTime())) {
                                                        let month = date.getMonth();
                                                        let startIdx = month >= 3 ? month - 3 : month + 9;
                                                        applicableMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].slice(startIdx);
                                                    }
                                                }
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
                                                className={\`p-3 flex items-center gap-3 rounded-xl cursor-pointer transition mb-1 \${selectedStudent?.id === student.id ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}\`}
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
                                                    <p className={\`text-xs font-bold \${pending > 0 ? 'text-rose-500' : 'text-emerald-500'}\`}>
                                                        ₹ {pending}
                                                    </p>
                                                </div>
                                            </div>
                                        )})`;

content = content.replace(/filteredStudents\.map\(student => \([\s\S]*?<\/[a-zA-Z0-9]+>\s*\)\)/, replacer);

fs.writeFileSync('src/pages/ManageFees.jsx', content);
