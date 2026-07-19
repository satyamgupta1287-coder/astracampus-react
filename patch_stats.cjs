const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');

// We will compute stats via useEffect
const statsEffect = `
    React.useEffect(() => {
        let pending = 0;
        const allMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
        
        students.forEach(student => {
            let total = student.totalFee || 0;
            if (feeStructures.length > 0) {
                const sclass = student.class || student.className;
                const struct = feeStructures.find(s => s.className === sclass || s.className === \`Class \${sclass}\`);
                if (struct) {
                    let applicableMonths = allMonths;
                    if (student.admissionDate) {
                        const date = new Date(student.admissionDate);
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
            }
            pending += Math.max(0, total - (student.paidFee || 0));
        });
        setStats(prev => ({ ...prev, totalPending: pending }));
    }, [students, feeStructures]);
`;

// Remove old pending calculation in students snapshot
content = content.replace(
    /let pending = 0;\s*snap\.forEach\(d => \{\s*const data = d\.data\(\);\s*stu\.push\(\{ id: d\.id, \.\.\.data \}\);\s*pending \+= \(data\.totalFee \|\| 0\) - \(data\.paidFee \|\| 0\);\s*\}\);\s*setStudents\(stu\);\s*setStats\(prev => \(\{ \.\.\.prev, totalPending: pending \}\)\);/,
    `snap.forEach(d => {
                const data = d.data();
                stu.push({ id: d.id, ...data });
            });
            setStudents(stu);`
);

// Insert statsEffect just before useEffect
content = content.replace('React.useEffect(() => {', statsEffect + '\n    React.useEffect(() => {');

fs.writeFileSync('src/pages/ManageFees.jsx', content);
