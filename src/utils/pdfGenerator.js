import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateFeeReceiptPDF = (receipt, schoolInfo = {}) => {
  try {
    const doc = new jsPDF();
    
    // School Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(schoolInfo.name || "AstraCampus Public School", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(schoolInfo.address || "123 Education Lane, Knowledge City, IN", 105, 28, { align: "center" });
    doc.text(`Phone: ${schoolInfo.phone || "1800-1234-5678"} | Email: ${schoolInfo.email || "info@astracampus.edu"}`, 105, 34, { align: "center" });
    
    // Divider
    doc.setLineWidth(0.5);
    doc.line(14, 40, 196, 40);
    
    // Receipt Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("FEE RECEIPT", 105, 48, { align: "center" });
    
    // Receipt Details & Student Details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Left Column
    doc.text(`Receipt No: ${receipt.receiptNo || 'N/A'}`, 14, 60);
    
    // Handle date safely
    let dateStr = "N/A";
    if (receipt.date) {
      try { dateStr = new Date(receipt.date).toLocaleDateString("en-IN"); } catch(e) {}
    } else if (receipt.createdAt) {
      try {
        const dateObj = receipt.createdAt.toDate ? receipt.createdAt.toDate() : new Date(receipt.createdAt);
        dateStr = dateObj.toLocaleDateString("en-IN");
      } catch(e) {}
    }
    
    doc.text(`Date: ${dateStr}`, 14, 66);
    doc.text(`Payment Mode: ${receipt.paymentMode || 'Cash'}`, 14, 72);
    if (receipt.transactionId) {
      doc.text(`Transaction ID: ${receipt.transactionId}`, 14, 78);
    }
    
    // Right Column
    const studentNameStr = receipt.studentName || "Student";
    doc.text(`Student Name: ${studentNameStr}`, 120, 60);
    doc.text(`Admission No: ${receipt.admissionNo || "N/A"}`, 120, 66);
    doc.text(`Class: ${receipt.className || "N/A"}`, 120, 72);
    doc.text(`Session: ${receipt.session || "2024-25"}`, 120, 78);
    
    // Fee Heads Table
    const tableColumn = ["S.No.", "Fee Head", "Amount (Rs)"];
    const tableRows = [];
    
    let currentY = receipt.transactionId ? 88 : 82;
    
    const amountVal = Number(receipt.amount) || 0;
    
    if (receipt.feeHeads && Array.isArray(receipt.feeHeads) && receipt.feeHeads.length > 0) {
      receipt.feeHeads.forEach((head, index) => {
        tableRows.push([index + 1, head.name || 'Fee', (Number(head.amount) || 0).toFixed(2)]);
      });
    } else {
      tableRows.push([1, "Fee Payment", amountVal.toFixed(2)]);
    }
    
    autoTable(doc, {
      startY: currentY,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 100 },
        2: { cellWidth: 'auto', halign: 'right' }
      }
    });
    
    const finalY = doc.lastAutoTable?.finalY || currentY + 30;
    
    // Summary
    doc.setFont("helvetica", "bold");
    doc.text(`Total Amount: Rs ${amountVal.toFixed(2)}`, 140, finalY + 10);
    
    const discountVal = Number(receipt.discount) || 0;
    const fineVal = Number(receipt.fine) || 0;
    
    if (discountVal > 0) {
      doc.text(`Discount: Rs ${discountVal.toFixed(2)}`, 140, finalY + 16);
    }
    if (fineVal > 0) {
      doc.text(`Fine/Late Fee: Rs ${fineVal.toFixed(2)}`, 140, finalY + 22);
    }
    
    const netAmount = amountVal - discountVal + fineVal;
    doc.text(`Net Paid: Rs ${netAmount.toFixed(2)}`, 140, finalY + 30);
    
    // Footer & Signatures
    doc.setFont("helvetica", "normal");
    doc.text("Terms & Conditions applied.", 14, finalY + 50);
    
    doc.setLineWidth(0.5);
    doc.line(14, finalY + 70, 60, finalY + 70);
    doc.text("Accountant Signature", 16, finalY + 75);
    
    doc.line(140, finalY + 70, 196, finalY + 70);
    doc.text("Authorized Signatory", 145, finalY + 75);
    
    // School Stamp Placeholder
    doc.setDrawColor(200);
    doc.rect(85, finalY + 55, 40, 20);
    doc.setTextColor(200);
    doc.text("School Stamp", 93, finalY + 66);
    
    const safeName = typeof studentNameStr === 'string' ? studentNameStr.replace(/\s+/g, '_') : 'Student';
    const filename = `${receipt.receiptNo || 'Receipt'}_${safeName}.pdf`;
    
    try {
        doc.save(filename);
    } catch(e) {}
    
    return {
        dataUri: URL.createObjectURL(doc.output('blob')),
        filename: filename
    };
  } catch (error) {
    console.error("Error generating PDF: ", error);
    return null;
  }
};
