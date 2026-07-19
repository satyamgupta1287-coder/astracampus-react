const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');

content = content.replace(
    /const computedAmount = React\.useMemo\(\(\) => \{/,
    `const computedTotalFee = React.useMemo(() => {
        if (!currentStructure) return selectedStudent?.totalFee || 0;
        return currentStructure.heads.reduce((sum, h) => {
            if (h.frequency === 'Monthly') return sum + (h.amount * 12);
            return sum + h.amount;
        }, 0);
    }, [currentStructure, selectedStudent]);

    const computedAmount = React.useMemo(() => {`
);

content = content.replace(
    /₹ \{selectedStudent\.totalFee \|\| 0\}/,
    `₹ {computedTotalFee}`
);

content = content.replace(
    /₹ \{Math\.max\(0, \(selectedStudent\.totalFee\|\|0\) - \(selectedStudent\.paidFee\|\|0\)\)\}/,
    `₹ {Math.max(0, computedTotalFee - (selectedStudent.paidFee||0))}`
);

content = content.replace(
    /const pending = Math\.max\(0, \(selectedStudent\.totalFee\|\|0\) - \(selectedStudent\.paidFee\|\|0\)\);/,
    `const pending = Math.max(0, computedTotalFee - (selectedStudent.paidFee||0));`
);

fs.writeFileSync('src/pages/ManageFees.jsx', content);
