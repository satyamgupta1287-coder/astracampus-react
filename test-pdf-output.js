import { jsPDF } from "jspdf";
const doc = new jsPDF();
doc.text("Hello", 10, 10);
const out = doc.output('datauristring');
console.log(out.substring(0, 50));
