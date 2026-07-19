const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');

const regex1 = /    const applicableMonths = React\.useMemo\(\(\) => \{\s*if \(\!selectedStudent\) return allMonths;\s*return getApplicableMonths\(selectedStudent\.admissionDate\);\s*\}, \[selectedStudent\]\);/;

const replacer1 = `    const applicableMonths = React.useMemo(() => {
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
    }, [selectedStudent]);`;

content = content.replace(regex1, replacer1);

const regex2 = /const computedTotalFee = React\.useMemo\(\(\) => \{\s*if \(\!currentStructure\) return selectedStudent\?\.totalFee \|\| 0;\s*return currentStructure\.heads\.reduce\(\(sum, h\) => \{\s*if \(h\.frequency === 'Monthly'\) return sum \+ \(h\.amount \* applicableMonths\.length\);\s*return sum \+ h\.amount;\s*\}, 0\);\s*\}, \[currentStructure, applicableMonths, selectedStudent\]\);/;

const replacer2 = `const computedTotalFee = React.useMemo(() => {
        if (!currentStructure) return selectedStudent?.totalFee || 0;
        return currentStructure.heads.reduce((sum, h) => {
            if (h.frequency === 'Monthly') return sum + (h.amount * applicableMonthsTillNow.length);
            return sum + h.amount;
        }, 0);
    }, [currentStructure, applicableMonthsTillNow, selectedStudent]);`;

content = content.replace(regex2, replacer2);

fs.writeFileSync('src/pages/ManageFees.jsx', content);
