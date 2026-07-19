const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');

const targetStr = `const studentClass = selectedStudent?.class;
        const normalizedClass = studentClass && /^\\d+$/.test(studentClass) ? \`Class \${studentClass}\` : studentClass;
        return feeStructures.find(f => f.className === normalizedClass || f.className === studentClass) || null;`;

const replacer = `const studentClass = selectedStudent?.class?.trim();
        const normalizedClass = studentClass && /^\\d+$/.test(studentClass) ? \`Class \${studentClass}\` : studentClass;
        return feeStructures.find(f => f.className?.trim().toLowerCase() === normalizedClass?.toLowerCase() || f.className?.trim().toLowerCase() === studentClass?.toLowerCase()) || null;`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacer);
    fs.writeFileSync('src/pages/ManageFees.jsx', content);
    console.log("Patched successfully");
} else {
    console.log("Could not find target string");
}
