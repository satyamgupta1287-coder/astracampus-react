const allMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const getApplicableMonths = (admissionDateStr) => {
    let startIdx = 0;
    if (admissionDateStr) {
        const date = new Date(admissionDateStr);
        if (!isNaN(date.getTime())) {
            const currDate = new Date();
            // Determine current academic year start
            let currentAcadYearStart = new Date(currDate.getFullYear(), 3, 1); // April 1st
            if (currDate.getMonth() < 3) { // Jan, Feb, Mar
                currentAcadYearStart = new Date(currDate.getFullYear() - 1, 3, 1);
            }
            
            if (date < currentAcadYearStart) {
                // Admitted before this academic year -> applicable for all months
                startIdx = 0;
            } else {
                // Admitted this academic year -> applicable from admission month
                let month = date.getMonth();
                startIdx = month >= 3 ? month - 3 : month + 9;
            }
        }
    }
    return allMonths.slice(startIdx);
};

console.log(getApplicableMonths("2026-01-15")); // Should be all months
console.log(getApplicableMonths("2026-07-15")); // Should be Jul-Mar
console.log(getApplicableMonths("2025-05-15")); // Should be all months
console.log(getApplicableMonths()); // Should be all months
