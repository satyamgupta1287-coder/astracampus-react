const allMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const getApplicableMonths = (admissionDateStr) => {
    if (!admissionDateStr) return allMonths;
    const date = new Date(admissionDateStr);
    if (isNaN(date.getTime())) return allMonths;
    let month = date.getMonth();
    let startIdx = month >= 3 ? month - 3 : month + 9;
    return allMonths.slice(startIdx);
};

console.log(getApplicableMonths("2026-07-19"));
console.log(getApplicableMonths("2026-03-10"));
console.log(getApplicableMonths("2026-04-01"));
