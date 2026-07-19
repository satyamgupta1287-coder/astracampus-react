const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');
const targetStr = fs.readFileSync('target.txt', 'utf8').trim();
const replacerStr = fs.readFileSync('replacer.txt', 'utf8').trim();

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacerStr);
    fs.writeFileSync('src/pages/ManageFees.jsx', content);
    console.log("Patched successfully");
} else {
    console.log("Could not find target string");
}
