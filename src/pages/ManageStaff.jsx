import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-init';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, where, getDoc } from 'firebase/firestore';

export default function ManageStaff() {
    const navigate = useNavigate();
    const [adminSchoolId, setAdminSchoolId] = useState(null);
    const [activeTab, setActiveTab] = useState('formTab');
    const [staffList, setStaffList] = useState([]);
    const [loadingList, setLoadingList] = useState(false);

    const [currentEditId, setCurrentEditId] = useState(null);
    const [formData, setFormData] = useState({
        empId: "",
        role: "teacher",
        fullName: "",
        email: "",
        mobile: "",
        gender: "Male",
        qualification: "",
        department: "",
        doj: new Date().toISOString().split('T')[0],
        photoUrl: ""
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const adminDoc = await getDoc(doc(db, 'users', user.uid));
                if (adminDoc.exists() && adminDoc.data().role === 'admin') {
                    setAdminSchoolId(adminDoc.data().schoolId);
                } else {
                    console.log("Unauthorized Access!");
                    navigate('/');
                }
            } else {
                navigate('/');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (!currentEditId) {
            setFormData(prev => ({
                ...prev,
                empId: "EMP" + new Date().getFullYear() + Math.floor(100 + Math.random() * 900)
            }));
        }
    }, [currentEditId]);

    useEffect(() => {
        if (activeTab === 'listTab' && adminSchoolId) {
            loadStaff();
        }
    }, [activeTab, adminSchoolId]);

    const loadStaff = async () => {
        setLoadingList(true);
        try {
            const q = query(collection(db, "users"), where("schoolId", "==", adminSchoolId));
            const snap = await getDocs(q);
            let loaded = [];
            snap.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.role !== "student") {
                    loaded.push({ id: docSnap.id, ...data });
                }
            });
            setStaffList(loaded);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingList(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openUploadWidget = () => {
        if (window.cloudinary) {
            window.cloudinary.createUploadWidget({ 
                cloudName: 'dl1cddemu', uploadPreset: 'upload', cropping: true, multiple: false 
            }, (err, result) => {
                if (!err && result && result.event === "success") {
                    setFormData(prev => ({ ...prev, photoUrl: result.info.secure_url }));
                }
            }).open();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!adminSchoolId) return window.alert("School ID missing!");

        setIsSaving(true);
        const staffData = {
            schoolId: adminSchoolId,
            role: formData.role,
            empId: formData.empId,
            name: formData.fullName,
            email: formData.email,
            mobile: formData.mobile,
            gender: formData.gender,
            qualification: formData.qualification,
            department: formData.department,
            doj: formData.doj,
            photoUrl: formData.photoUrl,
            updatedAt: serverTimestamp()
        };

        try {
            if (currentEditId) {
                await updateDoc(doc(db, "users", currentEditId), staffData);
                console.log("Record Updated!");
            } else {
                staffData.createdAt = serverTimestamp();
                await addDoc(collection(db, "users"), staffData);
                console.log(`${staffData.role.toUpperCase()} added successfully!`);
            }
            setCurrentEditId(null);
            setFormData({
                empId: "EMP" + new Date().getFullYear() + Math.floor(100 + Math.random() * 900),
                role: "teacher", fullName: "", email: "", mobile: "", gender: "Male",
                qualification: "", department: "", doj: new Date().toISOString().split('T')[0], photoUrl: ""
            });
            setActiveTab('listTab');
        } catch (error) {
            console.log("Error: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (data) => {
        setCurrentEditId(data.id);
        setFormData({
            empId: data.empId || "",
            role: data.role || "teacher",
            fullName: data.name || "",
            email: data.email || "",
            mobile: data.mobile || "",
            gender: data.gender || "Male",
            qualification: data.qualification || "",
            department: data.department || "",
            doj: data.doj || new Date().toISOString().split('T')[0],
            photoUrl: data.photoUrl || ""
        });
        setActiveTab('formTab');
        window.scrollTo(0,0);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this staff member permanently?")) {
            await deleteDoc(doc(db, "users", id));
            window.alert("Deleted!");
            loadStaff();
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans pb-10">
            <header className="bg-fuchsia-700 p-5 text-white shadow-md flex items-center gap-4 sticky top-0 z-50">
                <button onClick={() => navigate(-1)} className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <div>
                    <h1 className="text-xl font-bold">Manage Staff</h1>
                    <p className="text-xs text-fuchsia-200">School Code: {adminSchoolId || '...'}</p>
                </div>
            </header>

            <div className="max-w-4xl mx-auto bg-white flex border-b border-gray-200 sticky top-[72px] z-40 shadow-sm">
                <button onClick={() => setActiveTab('formTab')} className={`flex-1 py-4 transition ${activeTab === 'formTab' ? 'border-b-4 border-fuchsia-600 text-fuchsia-600 font-bold' : 'text-gray-500 font-medium'}`}>
                    <i className="fas fa-user-tie mr-2"></i>Add Staff/Teacher
                </button>
                <button onClick={() => setActiveTab('listTab')} className={`flex-1 py-4 transition ${activeTab === 'listTab' ? 'border-b-4 border-fuchsia-600 text-fuchsia-600 font-bold' : 'text-gray-500 font-medium'}`}>
                    <i className="fas fa-list mr-2"></i>Staff Directory
                </button>
            </div>

            <div className="max-w-4xl mx-auto mt-6 px-4">
                {activeTab === 'formTab' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">{currentEditId ? "Edit Employee" : "Register New Employee"}</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 md:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 lg:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Employee ID (Auto)</label>
                                    <input type="text" value={formData.empId} readOnly className="w-full p-2.5 border rounded-lg bg-gray-100 font-mono text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-purple-600 mb-1">Assign Role *</label>
                                    <select name="role" value={formData.role} onChange={handleChange} required className="w-full p-2.5 border-2 border-purple-200 rounded-lg outline-none bg-purple-50 font-bold text-purple-700 focus:border-purple-500">
                                        <option value="teacher">Teacher</option>
                                        <option value="staff">Office Staff</option>
                                        <option value="admin">Co-Admin</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button type="button" onClick={openUploadWidget} className="w-full bg-gray-50 border border-gray-200 font-bold p-2.5 rounded-lg hover:bg-gray-100 flex justify-center items-center gap-2">
                                        <i className="fas fa-camera"></i> Photo
                                    </button>
                                </div>
                            </div>
                            {formData.photoUrl && (
                                <div><img src={formData.photoUrl} alt="Preview" className="w-20 h-20 object-cover rounded-xl border" /></div>
                            )}

                            <div>
                                <h3 className="text-sm font-bold text-gray-600 uppercase mb-4 border-b pb-2"><i className="fas fa-id-badge mr-2"></i>Personal Info</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-3 md:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 lg:grid-cols-5 lg:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Full Name *</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full p-2.5 border rounded-lg outline-none bg-gray-50" /></div>
                                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Email Address *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-2.5 border rounded-lg outline-none bg-gray-50" /></div>
                                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Mobile Number *</label><input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required className="w-full p-2.5 border rounded-lg outline-none bg-gray-50" /></div>
                                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Gender</label>
                                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2.5 border rounded-lg outline-none bg-gray-50">
                                            <option value="Male">Male</option><option value="Female">Female</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-600 uppercase mb-4 border-b pb-2"><i className="fas fa-briefcase mr-2"></i>Professional Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 md:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 lg:grid-cols-5 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Qualification</label><input type="text" name="qualification" value={formData.qualification} onChange={handleChange} placeholder="e.g. M.Sc, B.Ed" className="w-full p-2.5 border rounded-lg outline-none bg-gray-50" /></div>
                                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Department / Subject</label><input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="e.g. Mathematics" className="w-full p-2.5 border rounded-lg outline-none bg-gray-50" /></div>
                                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Date of Joining *</label><input type="date" name="doj" value={formData.doj} onChange={handleChange} required className="w-full p-2.5 border rounded-lg outline-none bg-gray-50" /></div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <button type="submit" disabled={isSaving} className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-4 rounded-xl shadow-lg transition text-lg disabled:opacity-50">
                                    {isSaving ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>}
                                    {currentEditId ? "Update Record" : "Save Employee Record"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === 'listTab' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Staff Directory</h2>
                        <div className="space-y-4">
                            {loadingList ? (
                                <p className="text-fuchsia-500 text-center py-10 font-bold"><i className="fas fa-spinner fa-spin mr-2"></i>Loading...</p>
                            ) : staffList.length === 0 ? (
                                <p className="text-gray-400 text-center py-10">No staff found.</p>
                            ) : (
                                staffList.map(data => {
                                    let roleColor = data.role === 'admin' ? 'red' : (data.role === 'teacher' ? 'purple' : 'blue');
                                    return (
                                        <div key={data.id} className="bg-gray-50 border p-4 rounded-xl flex justify-between items-center hover:shadow-md transition">
                                            <div className="flex items-center gap-4">
                                                <img src={data.photoUrl || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt={data.name} className="w-12 h-12 rounded-full object-cover border" />
                                                <div>
                                                    <h3 className="font-bold text-gray-800">{data.name} <span className={`text-[10px] uppercase font-bold text-${roleColor}-600 bg-${roleColor}-100 px-2 py-0.5 rounded ml-1`}>{data.role}</span></h3>
                                                    <p className="text-xs text-gray-500 mt-0.5">{data.department || 'General'} | Mob: {data.mobile}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button onClick={() => handleEdit(data)} className="bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold"><i className="fas fa-edit"></i></button>
                                                <button onClick={() => handleDelete(data.id)} className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold"><i className="fas fa-trash"></i></button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
