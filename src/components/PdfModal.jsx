import React from 'react';
import { FaTimes, FaDownload } from 'react-icons/fa';

export default function PdfModal({ pdfData, onClose }) {
    if (!pdfData) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-800">Receipt Preview</h3>
                        <p className="text-xs text-slate-500 font-medium">If the file didn't download automatically, you can view it here or click Download.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <a 
                            href={pdfData.dataUri} 
                            download={pdfData.filename}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm"
                        >
                            <FaDownload /> Download
                        </a>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition shadow-sm">
                            <FaTimes />
                        </button>
                    </div>
                </div>
                <div className="flex-1 bg-slate-200 p-2 sm:p-4">
                    <iframe 
                        src={pdfData.dataUri} 
                        className="w-full h-full rounded-xl border border-slate-200 shadow-sm bg-white" 
                        title="PDF Preview"
                    ></iframe>
                </div>
            </div>
        </div>
    );
}
