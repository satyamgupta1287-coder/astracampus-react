const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');

const regex = /\[h\.name\]: \{ selected: isChecked, months: isChecked \? \(\(h\.frequency === 'Monthly' && unpaidMonths\.length > 0\) \? \[unpaidMonths\[0\]\] : \[\]\) : \[\] \}/;

const replacer = `[h.name]: { 
    selected: isChecked, 
    months: isChecked ? ((h.frequency === 'Monthly' && unpaidMonths.length > 0) ? (
        (() => {
            const currDate = new Date();
            let currMonth = currDate.getMonth();
            let endIdx = currMonth >= 3 ? currMonth - 3 : currMonth + 9;
            const monthsTillNow = allMonths.slice(0, endIdx + 1);
            const defaultMonths = unpaidMonths.filter(m => monthsTillNow.includes(m));
            return defaultMonths.length > 0 ? defaultMonths : [unpaidMonths[0]];
        })()
    ) : []) : [] 
}`;

content = content.replace(regex, replacer);
fs.writeFileSync('src/pages/ManageFees.jsx', content);
