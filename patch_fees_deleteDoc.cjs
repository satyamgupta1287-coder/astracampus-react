const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');

content = content.replace(
    'addDoc, updateDoc, serverTimestamp, getDocs, setDoc, orderBy',
    'addDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, setDoc, orderBy'
);

fs.writeFileSync('src/pages/ManageFees.jsx', content);
