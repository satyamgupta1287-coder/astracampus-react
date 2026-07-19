const allMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const getApplicableMonths = (admissionDateStr) => {
    let startIdx = 0; // Default to April
    if (admissionDateStr) {
        const date = new Date(admissionDateStr);
        if (!isNaN(date.getTime())) {
            let month = date.getMonth();
            startIdx = month >= 3 ? month - 3 : month + 9;
        }
    }
    
    const currDate = new Date();
    let currMonth = currDate.getMonth();
    let endIdx = currMonth >= 3 ? currMonth - 3 : currMonth + 9;
    
    if (startIdx > endIdx) return [];
    return allMonths.slice(startIdx, endIdx + 1);
};

console.log(getApplicableMonths("2026-07-19")); // Should be ['Jul']
console.log(getApplicableMonths("2026-04-01")); // Should be ['Apr', 'May', 'Jun', 'Jul']
console.log(getApplicableMonths()); // Should be ['Apr', 'May', 'Jun', 'Jul']
