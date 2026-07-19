cat << 'INNER_EOF' > src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase-init";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  FaPowerOff,
  FaVideo,
  FaBookOpen,
  FaClipboardList,
  FaLaptopCode,
  FaTrophy,
  FaWallet,
  FaCalendarCheck,
  FaEllipsisH,
  FaCalendarAlt,
  FaImages,
  FaCommentDots,
  FaCommentAlt,
  FaBullhorn,
  FaPlay,
  FaHome,
  FaUser,
  FaChalkboardTeacher,
  FaChevronRight,
  FaRegClock
} from "react-icons/fa";

export default function Dashboard() {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("");
  const [showAllIcons, setShowAllIcons] = useState(false);

  const [userData, setUserData] = useState({
    name: "Loading...",
    studentId: "---",
    batchName: "...",
    photoUrl: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    targetClass: "",
    schoolId: "",
  });

  const [stats, setStats] = useState({ attendance: "--%", fees: "₹0" });
  const [badges, setBadges] = useState({ assignments: 0, tests: 0 });
  const [liveClasses, setLiveClasses] = useState([]);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(
      hour < 12
        ? "Good Morning,"
        : hour < 18
        ? "Good Afternoon,"
        : "Good Evening,"
    );

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const schoolId = data.schoolId;
            const targetClassStr = String(data.class || "");

            setUserData({
              name: data.name || data.firstName || "Student",
              studentId: data.studentId || data.admissionNo || "N/A",
              batchName: `${data.class || "N/A"}${
                data.section ? ` ${data.section}` : ""
              }`,
              photoUrl:
                data.photoUrl ||
                data.photoBase64 ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
              targetClass: targetClassStr,
              schoolId: schoolId,
            });

            // Fees
            const totalFee = data.totalFee || 0;
            const paidFee = data.paidFee || 0;
            const pendingFee = totalFee - paidFee;
            setStats((prev) => ({ ...prev, fees: `₹${pendingFee}` }));

            if (schoolId && targetClassStr) {
              // Assignments Logic
              const assignQ = query(
                collection(db, "assignments"),
                where("schoolId", "==", schoolId)
              );
              onSnapshot(assignQ, (snap) => {
                let filtered = snap.docs.filter(d => String(d.data().targetClass || d.data().className || "") === targetClassStr);
                setBadges((prev) => ({ ...prev, assignments: filtered.length }));
              });

              // Live Classes Logic
              const liveQ = query(
                collection(db, "live_classes"),
                where("schoolId", "==", schoolId)
              );
              onSnapshot(liveQ, (snap) => {
                let filtered = snap.docs.filter(d => String(d.data().targetClass || d.data().className || "") === targetClassStr);
                
                let classes = [];
                filtered.forEach((d) => classes.push({ id: d.id, ...d.data() }));
                
                classes.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
                
                setLiveClasses(classes);
              });
            }

            if (schoolId) {
              // Notices Logic
              const noticeQ = query(
                collection(db, "announcements"),
                where("schoolId", "==", schoolId)
              );
              onSnapshot(noticeQ, (snap) => {
                let allNotices = [];
                snap.forEach((d) => allNotices.push({ id: d.id, ...d.data() }));
                allNotices.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
                
                if (allNotices.length > 0) setNotice(allNotices[0]);
              });

              // Attendance Logic
              const attQ = query(
                collection(db, "attendance"),
                where("schoolId", "==", schoolId)
              );
              onSnapshot(attQ, (snap) => {
                let presentCount = 0;
                let totalCount = 0;
                
                snap.forEach(docSnap => {
                    const attData = docSnap.data();
                    if(attData.studentId === user.uid || attData.studentEmail === user.email) {
                        totalCount++;
                        if(attData.status === 'present') presentCount++;
                    }
                });
                
                let percentage = totalCount === 0 ? "N/A" : Math.round((presentCount / totalCount) * 100) + "%";
                setStats((prev) => ({ ...prev, attendance: percentage }));
              });
            }
          } else {
             navigate("/");
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      } else {
        navigate("/");
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const handleLogout = async () => {
    if(window.confirm("Are you sure you want to log out?")) {
      try {
        await signOut(auth);
        navigate("/");
      } catch (error) {
        console.error("Logout Error:", error);
      }
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-24 font-sans text-slate-800 selection:bg-indigo-100 no-scrollbar">
      <div className="max-w-md mx-auto min-h-screen relative">

        {/* Top Header */}
        <div className="flex justify-between items-center px-6 pt-8 pb-2">
            <div>
                <p className="text-sm text-slate-500 font-medium">{greeting}</p>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight truncate w-48">{userData.name}</h1>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 shadow-sm shrink-0 border border-slate-200">
                    <img src={userData.photoUrl} className="w-full h-full object-cover" alt="Profile" />
                </div>
                <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition shadow-sm border border-red-100">
                    <FaPowerOff className="text-sm" />
                </button>
            </div>
        </div>

        {/* Premium Gradient Card */}
        <div className="px-5 mt-4">
            <div className="bg-gradient-to-br from-[#1e3a8a] to-[#3730a3] rounded-[24px] p-6 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-5 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white opacity-10 blur-xl"></div>
                
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-indigo-200 text-[11px] font-bold tracking-wider uppercase mb-1">Student ID</p>
                        <p className="text-xl font-bold tracking-wide mb-6">{userData.studentId}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-lg text-right">
                        <p className="text-xs font-bold text-white">Class <span>{userData.batchName}</span></p>
                    </div>
                </div>

                <div className="relative z-10 flex justify-between items-end border-t border-white/10 pt-4 mt-2">
                    <div onClick={() => navigate('/attendance')} className="cursor-pointer active:scale-95 transition bg-white/5 px-2 py-1 -ml-2 rounded-lg">
                        <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                            Attendance <FaChevronRight className="text-[8px]" />
                        </p>
                        <p className="text-2xl font-black">{stats.attendance}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-1">Fee Due</p>
                        <p className="text-2xl font-black text-emerald-300">{stats.fees}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Quick Access Grid */}
        <div className="px-5 mt-8">
            <h2 className="text-base font-bold text-slate-800 mb-4 px-1">Quick Access</h2>
            <div className="grid grid-cols-4 gap-y-5 gap-x-4">
                
                <div onClick={() => navigate('/live-classes')} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                    <div className="w-14 h-14 rounded-[18px] bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-slate-200 flex items-center justify-center text-red-500 text-xl">
                        <FaVideo />
                    </div>
                    <span className="text-[9.5px] font-bold text-slate-600 text-center">Live Class</span>
                </div>

                <div onClick={() => navigate('/materials')} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                    <div className="w-14 h-14 rounded-[18px] bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-slate-200 flex items-center justify-center text-blue-500 text-xl">
                        <FaBookOpen />
                    </div>
                    <span className="text-[9.5px] font-bold text-slate-600 text-center">Materials</span>
                </div>

                <div onClick={() => navigate('/assignments')} className="flex flex-col items-center gap-2 cursor-pointer relative active:scale-95 transition-transform">
                    {badges.assignments > 0 && <span className="absolute -top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-slate-50 shadow-sm z-10">{badges.assignments}</span>}
                    <div className="w-14 h-14 rounded-[18px] bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-slate-200 flex items-center justify-center text-emerald-500 text-xl">
                        <FaClipboardList />
                    </div>
                    <span className="text-[9.5px] font-bold text-slate-600 text-center">Homework</span>
                </div>

                <div onClick={() => navigate('/tests')} className="flex flex-col items-center gap-2 cursor-pointer relative active:scale-95 transition-transform">
                    {badges.tests > 0 && <span className="absolute -top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-slate-50 shadow-sm z-10">{badges.tests}</span>}
                    <div className="w-14 h-14 rounded-[18px] bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-slate-200 flex items-center justify-center text-purple-500 text-xl">
                        <FaLaptopCode />
                    </div>
                    <span className="text-[9.5px] font-bold text-slate-600 text-center">Tests</span>
                </div>

                <div onClick={() => navigate('/results')} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                    <div className="w-14 h-14 rounded-[18px] bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-slate-200 flex items-center justify-center text-amber-500 text-xl">
                        <FaTrophy />
                    </div>
                    <span className="text-[9.5px] font-bold text-slate-600 text-center">Results</span>
                </div>
                
                <div onClick={() => navigate('/fees')} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                    <div className="w-14 h-14 rounded-[18px] bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-slate-200 flex items-center justify-center text-teal-600 text-xl">
                        <FaWallet />
                    </div>
                    <span className="text-[9.5px] font-bold text-slate-600 text-center">Fees</span>
                </div>

                <div onClick={() => navigate('/leave')} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                    <div className="w-14 h-14 rounded-[18px] bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-slate-200 flex items-center justify-center text-green-600 text-xl">
                        <FaCalendarCheck />
                    </div>
                    <span className="text-[9.5px] font-bold text-slate-600 text-center">Leave</span>
                </div>

                {!showAllIcons && (
                    <div onClick={() => setShowAllIcons(true)} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                        <div className="w-14 h-14 rounded-[18px] bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 text-xl transition hover:bg-slate-100">
                            <FaEllipsisH />
                        </div>
                        <span className="text-[9.5px] font-bold text-slate-600 text-center">More</span>
                    </div>
                )}

                {showAllIcons && (
                    <>
                        <div onClick={() => navigate('/timetable')} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                            <div className="w-14 h-14 rounded-[18px] bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-slate-200 flex items-center justify-center text-indigo-500 text-xl">
                                <FaCalendarAlt />
                            </div>
                            <span className="text-[9.5px] font-bold text-slate-600 text-center">Timetable</span>
                        </div>

                        <div onClick={() => navigate('/gallery')} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                            <div className="w-14 h-14 rounded-[18px] bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-slate-200 flex items-center justify-center text-pink-500 text-xl">
                                <FaImages />
                            </div>
                            <span className="text-[9.5px] font-bold text-slate-600 text-center">Gallery</span>
                        </div>

                        <div onClick={() => navigate('/complaints')} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                            <div className="w-14 h-14 rounded-[18px] bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-slate-200 flex items-center justify-center text-orange-500 text-xl">
                                <FaCommentDots />
                            </div>
                            <span className="text-[9.5px] font-bold text-slate-600 text-center">Complaint</span>
                        </div>

                        <div onClick={() => navigate('/feedback')} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                            <div className="w-14 h-14 rounded-[18px] bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-slate-200 flex items-center justify-center text-sky-500 text-xl">
                                <FaCommentAlt />
                            </div>
                            <span className="text-[9.5px] font-bold text-slate-600 text-center">Feedback</span>
                        </div>

                        {/* And maybe a less button */}
                        <div onClick={() => setShowAllIcons(false)} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                            <div className="w-14 h-14 rounded-[18px] bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 text-2xl transition hover:bg-slate-100">
                                &times;
                            </div>
                            <span className="text-[9.5px] font-bold text-slate-600 text-center">Less</span>
                        </div>
                    </>
                )}

            </div>
        </div>

        {/* Notice Board Section */}
        <div className="px-5 mt-10">
            <div className="flex justify-between items-end mb-4 px-1">
                <h2 className="text-base font-bold text-slate-800">Notice Board</h2>
                <span onClick={() => navigate('/notices')} className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide cursor-pointer hover:underline">View All</span>
            </div>
            <div>
                {!notice ? (
                    <div className="bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-slate-200 rounded-[20px] p-5 text-center">
                        <p className="text-sm text-slate-400 font-medium">No new announcements.</p>
                    </div>
                ) : (
                    <div onClick={() => navigate('/notices')} className="bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-slate-200 p-4 rounded-[20px] flex items-start gap-4 border-l-4 border-l-amber-400 cursor-pointer">
                        <div className="w-10 h-10 rounded-[14px] bg-amber-50 flex items-center justify-center shrink-0 text-amber-500">
                            <FaBullhorn className="text-lg" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm mb-1">{notice.title}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{notice.description}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Today's Schedule Section */}
        <div className="px-5 mt-8 mb-6">
            <h2 className="text-base font-bold text-slate-800 mb-4 px-1">Today's Schedule</h2>
            <div className="space-y-3">
                {liveClasses.length === 0 ? (
                    <div className="bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-slate-200 rounded-[20px] p-6 text-center">
                        <p className="text-sm text-slate-400 font-medium">Relax, no classes scheduled for today.</p>
                    </div>
                ) : (
                    liveClasses.map((cls) => (
                        <div key={cls.id} className="bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-slate-200 p-4 rounded-[20px] flex items-center gap-4 text-left">
                            <div className="w-12 h-12 rounded-[14px] bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                                <FaVideo className="text-red-500 text-lg" />
                            </div>
                            <div className="flex-grow min-w-0">
                                <h4 className="font-bold text-slate-800 text-sm truncate">{cls.subject || cls.title || 'Live Class'}</h4>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center"><FaRegClock className="mr-1"/>Tap to join</p>
                            </div>
                            <a href={cls.meetingLink || '#'} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition">
                                <FaPlay className="text-white text-xs ml-0.5" />
                            </a>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 flex justify-around items-center pt-3 pb-5 z-50 px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
            <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center gap-1.5 w-16 text-indigo-600 active:scale-95 transition-transform">
                <FaHome className="text-lg" />
                <span className="text-[9px] font-bold tracking-wide">Home</span>
            </button>
            <button onClick={() => navigate('/live-classes')} className="flex flex-col items-center gap-1.5 w-16 text-slate-400 hover:text-indigo-600 transition active:scale-95">
                <FaVideo className="text-lg" />
                <span className="text-[9px] font-bold tracking-wide">Classes</span>
            </button>
            <button onClick={() => navigate('/assignments')} className="flex flex-col items-center gap-1.5 w-16 text-slate-400 hover:text-indigo-600 transition active:scale-95">
                <FaClipboardList className="text-lg" />
                <span className="text-[9px] font-bold tracking-wide">Tasks</span>
            </button>
            <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1.5 w-16 text-slate-400 hover:text-indigo-600 transition active:scale-95">
                <FaUser className="text-lg" />
                <span className="text-[9px] font-bold tracking-wide">Profile</span>
            </button>
            
            <button onClick={() => navigate('/courses')} className="bg-indigo-50 p-4 rounded-2xl flex flex-col items-center border border-indigo-100 hover:bg-indigo-100 transition shadow-sm active:scale-95">
                <FaChalkboardTeacher className="text-indigo-600 text-2xl mb-2" />
                <span className="text-xs font-bold text-gray-700">Lectures</span>
            </button>
        </div>

      </div>
    </div>
  );
}
INNER_EOF
