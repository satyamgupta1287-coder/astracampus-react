import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase-init";
import { signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [adminSchoolId, setAdminSchoolId] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/");
      } else {
        try {
          const adminDocRef = doc(db, "users", user.uid);
          const adminSnap = await getDoc(adminDocRef);

          if (adminSnap.exists()) {
            const adminData = adminSnap.data();
            setAdminSchoolId(adminData.schoolId);
          }
        } catch (error) {
          console.error("Error fetching admin details:", error);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!adminSchoolId) return;
    const qStudents = query(
      collection(db, "users"),
      where("role", "==", "student"),
      where("schoolId", "==", adminSchoolId),
    );
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      setTotalStudents(snapshot.size);
    });

    const qStaff = query(
      collection(db, "users"),
      where("schoolId", "==", adminSchoolId),
    );
    const unsubStaff = onSnapshot(qStaff, (snapshot) => {
      let staffCount = 0;
      snapshot.forEach((docSnap) => {
        const role = docSnap.data().role;
        if (role === "teacher" || role === "staff" || role === "admin") {
          staffCount++;
        }
      });
      setTotalTeachers(staffCount);
    });

    return () => {
      unsubStudents();
      unsubStaff();
    };
  }, [adminSchoolId]);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await signOut(auth);
      navigate("/");
    }
  };

  const actionButtons = [
    {
      path: "/manage-staff",
      icon: "fa-user-tie text-fuchsia-600",
      bgClass: "bg-fuchsia-50 border-fuchsia-100 hover:bg-fuchsia-100",
      label: "Staff & Teachers",
    },
    {
      path: "/manage-students",
      icon: "fa-users-cog text-blue-600",
      bgClass: "bg-blue-50 border-blue-100 hover:bg-blue-100",
      label: "Students",
    },
    {
      path: "/manage-attendance",
      icon: "fa-check-circle text-emerald-600",
      bgClass: "bg-emerald-50 border-emerald-100 hover:bg-emerald-100",
      label: "Attendance",
    },
    {
      path: "/manage-fees",
      icon: "fa-wallet text-teal-600",
      bgClass: "bg-teal-50 border-teal-100 hover:bg-teal-100",
      label: "Fees Mgmt",
    },
    {
      path: "/manage-notices",
      icon: "fa-bullhorn text-amber-500",
      bgClass: "bg-amber-50 border-amber-100 hover:bg-amber-100",
      label: "Notices",
    },
    {
      path: "/manage-classes",
      icon: "fa-video text-red-500",
      bgClass: "bg-red-50 border-red-100 hover:bg-red-100",
      label: "Live Classes",
    },
    {
      path: "/manage-materials",
      icon: "fa-book-open text-indigo-600",
      bgClass: "bg-indigo-50 border-indigo-100 hover:bg-indigo-100",
      label: "Materials",
    },
    {
      path: "/manage-tests",
      icon: "fa-laptop-code text-purple-600",
      bgClass: "bg-purple-50 border-purple-100 hover:bg-purple-100",
      label: "Create Test",
    },
    {
      path: "/view-results",
      icon: "fa-trophy text-orange-600",
      bgClass: "bg-orange-50 border-orange-100 hover:bg-orange-100",
      label: "Test Results",
    },
    {
      path: "/manage-doubts",
      icon: "fa-question-circle text-cyan-600",
      bgClass: "bg-cyan-50 border-cyan-100 hover:bg-cyan-100",
      label: "Solve Doubts",
    },
    {
      path: "/manage-gallery",
      icon: "fa-images text-pink-500",
      bgClass: "bg-pink-50 border-pink-100 hover:bg-pink-100",
      label: "Gallery",
    },
    {
      path: "/create-assignment",
      icon: "fa-clipboard-list text-purple-600",
      bgClass: "bg-purple-50 border-purple-100 hover:bg-purple-100",
      label: "Assignments",
    },
    {
      path: "/manage-leaves",
      icon: "fa-calendar-check text-green-600",
      bgClass: "bg-green-50 border-green-100 hover:bg-green-100",
      label: "Manage Leaves",
    },
    {
      path: "/manage-timetable",
      icon: "fa-calendar-days text-sky-600",
      bgClass: "bg-sky-50 border-sky-100 hover:bg-sky-100",
      label: "Manage Timetable",
    },
    {
      path: "/view-feedback",
      icon: "fa-comments text-violet-600",
      bgClass: "bg-violet-50 border-violet-100 hover:bg-violet-100",
      label: "Manage Feedback",
    },
    {
      path: "/manage-complaints",
      icon: "fa-triangle-exclamation text-rose-600",
      bgClass: "bg-rose-50 border-rose-100 hover:bg-rose-100",
      label: "Manage Complaints",
    },
    {
      path: "/upload-video",
      icon: "fa-cloud-upload-alt text-red-600",
      bgClass: "bg-red-50 border-red-100 hover:bg-red-100",
      label: "Upload Video",
    },
    {
      path: "/manage-institutes",
      icon: "fa-building text-blue-600",
      bgClass: "bg-blue-50 border-blue-100 hover:bg-blue-100",
      label: "Manage Institutes",
    },
    {
      path: "/add-results",
      icon: "fa-poll text-green-600",
      bgClass: "bg-green-50 border-green-100 hover:bg-green-100",
      label: "Add Results",
    },
  ];

  return (
    <div className="bg-gray-50 font-sans pb-20 min-h-screen">
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-b-[2rem] p-6 text-white shadow-lg relative pb-12">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-white/80">
                Welcome back, Admin{" "}
                {adminSchoolId ? `| School Code: ${adminSchoolId}` : ""}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 p-2.5 rounded-xl backdrop-blur-sm transition"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>

        <div className="px-4 -mt-8 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                Total Students
              </p>
              <h2 className="text-3xl font-bold text-violet-600">
                {totalStudents}
              </h2>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                Total Staff
              </p>
              <h2 className="text-3xl font-bold text-fuchsia-600">
                {totalTeachers}
              </h2>
            </div>
          </div>
        </div>

        <div className="px-4 mt-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {actionButtons.map((btn, i) => (
              <button
                key={i}
                onClick={() => navigate(btn.path)}
                className={`${btn.bgClass} p-4 rounded-2xl flex flex-col items-center border transition shadow-sm`}
              >
                <i className={`fas ${btn.icon} text-2xl mb-2`}></i>
                <span className="text-xs font-bold text-gray-700 text-center">
                  {btn.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
