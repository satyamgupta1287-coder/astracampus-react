const fs = require('fs');
let code = fs.readFileSync('src/pages/ManageAttendance.jsx', 'utf8');

code = code.replace(
    /if \(!true \|\| window\.confirm\(\`Submit final attendance for Class \$\{selectedClass\} on \$\{date\}\?\`\)\) return;/,
    `if (!window.confirm(\`Submit final attendance for Class \${selectedClass} on \${date}?\`)) return;`
);

fs.writeFileSync('src/pages/ManageAttendance.jsx', code);
