const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');

const target1 = `    const computedTotalFee = React.useMemo(() => {
        if (!currentStructure) return selectedStudent?.totalFee || 0;
        return currentStructure.heads.reduce((sum, h) => {
            if (h.frequency === 'Monthly') return sum + (h.amount * 12);
            return sum + h.amount;
        }, 0);
    }, [currentStructure, selectedStudent]);`;

const replacer1 = `    const allMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    const getApplicableMonths = (admissionDateStr) => {
        if (!admissionDateStr) return allMonths;
        const date = new Date(admissionDateStr);
        if (isNaN(date.getTime())) return allMonths;
        let month = date.getMonth();
        let startIdx = month >= 3 ? month - 3 : month + 9;
        return allMonths.slice(startIdx);
    };

    const applicableMonths = React.useMemo(() => {
        if (!selectedStudent) return allMonths;
        return getApplicableMonths(selectedStudent.admissionDate);
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
                            const match = h.name.match(/\\((.*?)\\)/);
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
            if (h.frequency === 'Monthly') return sum + (h.amount * applicableMonths.length);
            return sum + h.amount;
        }, 0);
    }, [currentStructure, applicableMonths, selectedStudent]);`;

content = content.replace(target1, replacer1);
fs.writeFileSync('src/pages/ManageFees.jsx', content);
