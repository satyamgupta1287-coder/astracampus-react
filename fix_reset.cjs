const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');

content = content.replace(
    'if(!window.confirm("Are you sure you want to RESET all receipts and fee data? This cannot be undone.")) return;',
    '// Removed window.confirm due to iframe restrictions'
);
content = content.replace(
    'alert("All fee data has been wiped clean!");',
    'console.log("All fee data has been wiped clean!");'
);
content = content.replace(
    'alert("Error wiping data");',
    'console.error("Error wiping data");'
);

fs.writeFileSync('src/pages/ManageFees.jsx', content);
