const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');

// Replace alerts with console.log
content = content.replace(/alert\((.*?)\)/g, 'console.log($1)');

// Replace window.confirm with true
content = content.replace(/window\.confirm\((.*?)\)/g, 'true');

fs.writeFileSync('src/pages/ManageFees.jsx', content);
