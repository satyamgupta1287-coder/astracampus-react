const fs = require('fs');
let content = fs.readFileSync('src/pages/fees.jsx', 'utf8');

if(!content.includes('getDocs')) {
    content = content.replace(/import \{ doc, getDoc, collection, query, where, onSnapshot, orderBy \} from "firebase\/firestore";/,
        `import { doc, getDoc, collection, query, where, onSnapshot, orderBy, getDocs } from "firebase/firestore";`);
}

content = content.replace(
    /const total = data\.totalFee \|\| 0;\n\s+const paid = data\.paidFee \|\| 0;\n\s+const pending = total - paid;\n\s+setFeeData\(\{ total, paid, pending \}\);/,
    `let total = data.totalFee || 0;
                    const paid = data.paidFee || 0;
                    
                    if (data.schoolId && data.class) {
                        try {
                            const structQ = query(collection(db, "feeStructures"), where("schoolId", "==", data.schoolId), where("className", "in", [data.class, \`Class \${data.class}\`]));
                            const structSnap = await getDocs(structQ);
                            if (!structSnap.empty) {
                                const struct = structSnap.docs[0].data();
                                const allMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
                                let applicableMonths = allMonths;
                                if (data.admissionDate) {
                                    const date = new Date(data.admissionDate);
                                    if (!isNaN(date.getTime())) {
                                        let month = date.getMonth();
                                        let startIdx = month >= 3 ? month - 3 : month + 9;
                                        applicableMonths = allMonths.slice(startIdx);
                                    }
                                }
                                total = struct.heads.reduce((sum, h) => {
                                    if (h.frequency === 'Monthly') return sum + (h.amount * applicableMonths.length);
                                    return sum + h.amount;
                                }, 0);
                            }
                        } catch(e) {}
                    }
                    
                    const pending = Math.max(0, total - paid);
                    setFeeData({ total, paid, pending });`
);

fs.writeFileSync('src/pages/fees.jsx', content);
