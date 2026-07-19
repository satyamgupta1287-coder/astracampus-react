const fs = require('fs');

// ManageFees.jsx
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');

// For stats pending calculation
const regex1 = /let applicableMonths = allMonths;\s*let startIdx = 0;\s*if \(student\.admissionDate\) \{[\s\S]*?\}\s*applicableMonths = allMonths\.slice\(startIdx\);/;

const replacer1 = `let applicableMonths = allMonths;
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
                    const cDate = new Date();
                    let cMonth = cDate.getMonth();
                    let endIdx = cMonth >= 3 ? cMonth - 3 : cMonth + 9;
                    applicableMonths = startIdx > endIdx ? [] : allMonths.slice(startIdx, endIdx + 1);`;
content = content.replace(regex1, replacer1);

// For student list pending calculation
const regex2 = /let applicableMonths = \["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"\];\s*let startIdx = 0;\s*if \(student\.admissionDate\) \{[\s\S]*?\}\s*applicableMonths = applicableMonths\.slice\(startIdx\);/;
const replacer2 = `let applicableMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
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
                                                const cDate = new Date();
                                                let cMonth = cDate.getMonth();
                                                let endIdx = cMonth >= 3 ? cMonth - 3 : cMonth + 9;
                                                applicableMonths = startIdx > endIdx ? [] : applicableMonths.slice(startIdx, endIdx + 1);`;
content = content.replace(regex2, replacer2);

fs.writeFileSync('src/pages/ManageFees.jsx', content);

// For fees.jsx
let feesContent = fs.readFileSync('src/pages/fees.jsx', 'utf8');
const regex3 = /let applicableMonths = allMonths;\s*let startIdx = 0;\s*if \(data\.admissionDate\) \{[\s\S]*?\}\s*applicableMonths = allMonths\.slice\(startIdx\);/;
const replacer3 = `let applicableMonths = allMonths;
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
                                const cDate = new Date();
                                let cMonth = cDate.getMonth();
                                let endIdx = cMonth >= 3 ? cMonth - 3 : cMonth + 9;
                                applicableMonths = startIdx > endIdx ? [] : allMonths.slice(startIdx, endIdx + 1);`;
feesContent = feesContent.replace(regex3, replacer3);

fs.writeFileSync('src/pages/fees.jsx', feesContent);
