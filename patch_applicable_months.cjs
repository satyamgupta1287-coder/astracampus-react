const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');

const getApplicableReplacer = `    const getApplicableMonths = (admissionDateStr) => {
        let startIdx = 0;
        if (admissionDateStr) {
            const date = new Date(admissionDateStr);
            if (!isNaN(date.getTime())) {
                let month = date.getMonth();
                startIdx = month >= 3 ? month - 3 : month + 9;
            }
        }
        
        const currDate = new Date();
        let currMonth = currDate.getMonth();
        let endIdx = currMonth >= 3 ? currMonth - 3 : currMonth + 9;
        
        if (startIdx > endIdx) return [];
        return allMonths.slice(startIdx, endIdx + 1);
    };`;

content = content.replace(/    const getApplicableMonths = \(admissionDateStr\) => \{[\s\S]*?    \};/, getApplicableReplacer);

// Fix in students.forEach for totalPending
const totalPendingRegex = /let applicableMonths = allMonths;\s*if \(student\.admissionDate\) \{\s*const date = new Date\(student\.admissionDate\);\s*if \(\!isNaN\(date\.getTime\(\)\)\) \{\s*let month = date\.getMonth\(\);\s*let startIdx = month >= 3 \? month - 3 : month \+ 9;\s*applicableMonths = allMonths\.slice\(startIdx\);\s*\}\s*\}/;

const totalPendingReplacer = `let applicableMonths = allMonths;
                    let startIdx = 0;
                    if (student.admissionDate) {
                        const date = new Date(student.admissionDate);
                        if (!isNaN(date.getTime())) {
                            let month = date.getMonth();
                            startIdx = month >= 3 ? month - 3 : month + 9;
                        }
                    }
                    const currDate = new Date();
                    let currMonth = currDate.getMonth();
                    let endIdx = currMonth >= 3 ? currMonth - 3 : currMonth + 9;
                    if (startIdx > endIdx) {
                        applicableMonths = [];
                    } else {
                        applicableMonths = allMonths.slice(startIdx, endIdx + 1);
                    }`;

content = content.replace(totalPendingRegex, totalPendingReplacer);

// Fix in filteredStudents.map for student pending
const studentPendingRegex = /let applicableMonths = \["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"\];\s*if \(student\.admissionDate\) \{\s*const date = new Date\(student\.admissionDate\);\s*if \(\!isNaN\(date\.getTime\(\)\)\) \{\s*let month = date\.getMonth\(\);\s*let startIdx = month >= 3 \? month - 3 : month \+ 9;\s*applicableMonths = \["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"\].slice\(startIdx\);\s*\}\s*\}/;

const studentPendingReplacer = `let applicableMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
                                                let startIdx = 0;
                                                if (student.admissionDate) {
                                                    const date = new Date(student.admissionDate);
                                                    if (!isNaN(date.getTime())) {
                                                        let month = date.getMonth();
                                                        startIdx = month >= 3 ? month - 3 : month + 9;
                                                    }
                                                }
                                                const currDate = new Date();
                                                let currMonth = currDate.getMonth();
                                                let endIdx = currMonth >= 3 ? currMonth - 3 : currMonth + 9;
                                                if (startIdx > endIdx) {
                                                    applicableMonths = [];
                                                } else {
                                                    applicableMonths = applicableMonths.slice(startIdx, endIdx + 1);
                                                }`;
content = content.replace(studentPendingRegex, studentPendingReplacer);

fs.writeFileSync('src/pages/ManageFees.jsx', content);

// Now patch fees.jsx
let feesContent = fs.readFileSync('src/pages/fees.jsx', 'utf8');

const feesRegex = /let applicableMonths = allMonths;\s*if \(data\.admissionDate\) \{\s*const date = new Date\(data\.admissionDate\);\s*if \(\!isNaN\(date\.getTime\(\)\)\) \{\s*let month = date\.getMonth\(\);\s*let startIdx = month >= 3 \? month - 3 : month \+ 9;\s*applicableMonths = allMonths\.slice\(startIdx\);\s*\}\s*\}/;

const feesReplacer = `let applicableMonths = allMonths;
                                let startIdx = 0;
                                if (data.admissionDate) {
                                    const date = new Date(data.admissionDate);
                                    if (!isNaN(date.getTime())) {
                                        let month = date.getMonth();
                                        startIdx = month >= 3 ? month - 3 : month + 9;
                                    }
                                }
                                const currDate = new Date();
                                let currMonth = currDate.getMonth();
                                let endIdx = currMonth >= 3 ? currMonth - 3 : currMonth + 9;
                                if (startIdx > endIdx) {
                                    applicableMonths = [];
                                } else {
                                    applicableMonths = allMonths.slice(startIdx, endIdx + 1);
                                }`;

feesContent = feesContent.replace(feesRegex, feesReplacer);
fs.writeFileSync('src/pages/fees.jsx', feesContent);

