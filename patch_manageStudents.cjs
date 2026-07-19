const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageStudents.jsx', 'utf8');

content = content.replace(
    `<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Student ID (Auto)</label><input type="text" name="stuId" value={formData.stuId} readOnly className="w-full p-2.5 border rounded-lg text-gray-500 bg-gray-200 font-mono text-sm cursor-not-allowed" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Admission No (Auto)</label><input type="text" name="admNo" value={formData.admNo} readOnly className="w-full p-2.5 border rounded-lg text-gray-500 bg-gray-200 font-mono text-sm cursor-not-allowed" /></div>
                                <div className="flex items-end"><button type="button" onClick={openUploadWidget} className="w-full bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold p-2.5 rounded-lg hover:bg-indigo-100 flex justify-center items-center gap-2"><i className="fas fa-camera"></i> Upload Photo</button></div>
                            </div>`,
    `<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Student ID (Auto)</label><input type="text" name="stuId" value={formData.stuId} readOnly className="w-full p-2.5 border rounded-lg text-gray-500 bg-gray-200 font-mono text-sm cursor-not-allowed" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Admission No (Auto)</label><input type="text" name="admNo" value={formData.admNo} readOnly className="w-full p-2.5 border rounded-lg text-gray-500 bg-gray-200 font-mono text-sm cursor-not-allowed" /></div>
                                <div><label className="block text-xs font-bold text-gray-600 mb-1">Admission Date *</label><input type="date" name="admDate" value={formData.admDate} onChange={handleChange} required className="w-full p-2.5 border rounded-lg focus:ring-2 ring-blue-200 outline-none" /></div>
                                <div className="flex items-end"><button type="button" onClick={openUploadWidget} className="w-full bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold p-2.5 rounded-lg hover:bg-indigo-100 flex justify-center items-center gap-2"><i className="fas fa-camera"></i> Upload Photo</button></div>
                            </div>`
);

fs.writeFileSync('src/pages/ManageStudents.jsx', content);
