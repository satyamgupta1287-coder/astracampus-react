const fs = require('fs');

const logicStr = `
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
                    applicableMonths = allMonths.slice(startIdx);
`;

const logicStr2 = `
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
                                                applicableMonths = applicableMonths.slice(startIdx);
`;

const logicStrFees = `
                                let startIdx = 0;
                                if (data.admissionDate) {
                                    const date = new Date(data.admissionDate);
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
                                applicableMonths = allMonths.slice(startIdx);
`;

// ManageFees.jsx
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');

const regex1 = /let startIdx = 0;\s*if \(student\.admissionDate\) \{\s*const date = new Date\(student\.admissionDate\);\s*if \(\!isNaN\(date\.getTime\(\)\)\) \{\s*let month = date\.getMonth\(\);\s*startIdx = month >= 3 \? month - 3 : month \+ 9;\s*\}\s*\}\s*const currDate = new Date\(\);\s*let currMonth = currDate\.getMonth\(\);\s*let endIdx = currMonth >= 3 \? currMonth - 3 : currMonth \+ 9;\s*if \(startIdx > endIdx\) \{\s*applicableMonths = \[\];\s*\} else \{\s*applicableMonths = allMonths\.slice\(startIdx, endIdx \+ 1\);\s*\}/g;
content = content.replace(regex1, logicStr);

const regex2 = /let startIdx = 0;\s*if \(student\.admissionDate\) \{\s*const date = new Date\(student\.admissionDate\);\s*if \(\!isNaN\(date\.getTime\(\)\)\) \{\s*let month = date\.getMonth\(\);\s*startIdx = month >= 3 \? month - 3 : month \+ 9;\s*\}\s*\}\s*const currDate = new Date\(\);\s*let currMonth = currDate\.getMonth\(\);\s*let endIdx = currMonth >= 3 \? currMonth - 3 : currMonth \+ 9;\s*if \(startIdx > endIdx\) \{\s*applicableMonths = \[\];\s*\} else \{\s*applicableMonths = applicableMonths\.slice\(startIdx, endIdx \+ 1\);\s*\}/g;
content = content.replace(regex2, logicStr2);

const regex3 = /const getApplicableMonths = \(admissionDateStr\) => \{\s*let startIdx = 0;\s*if \(admissionDateStr\) \{\s*const date = new Date\(admissionDateStr\);\s*if \(\!isNaN\(date\.getTime\(\)\)\) \{\s*let month = date\.getMonth\(\);\s*startIdx = month >= 3 \? month - 3 : month \+ 9;\s*\}\s*\}\s*return allMonths\.slice\(startIdx\);\s*\};/g;

const replacer3 = `const getApplicableMonths = (admissionDateStr) => {
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
    };`;
content = content.replace(regex3, replacer3);

fs.writeFileSync('src/pages/ManageFees.jsx', content);

// fees.jsx
let feesContent = fs.readFileSync('src/pages/fees.jsx', 'utf8');

const regex4 = /let startIdx = 0;\s*if \(data\.admissionDate\) \{\s*const date = new Date\(data\.admissionDate\);\s*if \(\!isNaN\(date\.getTime\(\)\)\) \{\s*let month = date\.getMonth\(\);\s*startIdx = month >= 3 \? month - 3 : month \+ 9;\s*\}\s*\}\s*const currDate = new Date\(\);\s*let currMonth = currDate\.getMonth\(\);\s*let endIdx = currMonth >= 3 \? currMonth - 3 : currMonth \+ 9;\s*if \(startIdx > endIdx\) \{\s*applicableMonths = \[\];\s*\} else \{\s*applicableMonths = allMonths\.slice\(startIdx, endIdx \+ 1\);\s*\}/g;
feesContent = feesContent.replace(regex4, logicStrFees);

fs.writeFileSync('src/pages/fees.jsx', feesContent);
