const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');

const regex = /const getApplicableMonths = \(admissionDateStr\) => \{[\s\S]*?return allMonths\.slice\(startIdx, endIdx \+ 1\);\s*\};/;

const replacer = `const getApplicableMonths = (admissionDateStr) => {
        let startIdx = 0;
        if (admissionDateStr) {
            const date = new Date(admissionDateStr);
            if (!isNaN(date.getTime())) {
                let month = date.getMonth();
                startIdx = month >= 3 ? month - 3 : month + 9;
            }
        }
        return allMonths.slice(startIdx);
    };`;

content = content.replace(regex, replacer);
fs.writeFileSync('src/pages/ManageFees.jsx', content);
