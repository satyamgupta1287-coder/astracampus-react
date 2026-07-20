import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaCheck, FaTimes } from 'react-icons/fa';
import { requestNotificationPermission, onMessageListener } from '../utils/notifications';
import { auth, db } from '../firebase-init';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

export default function NotificationBell() {
    const [permissionStatus, setPermissionStatus] = useState(Notification.permission);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        // FCM Listener
        const listener = onMessageListener().then((payload) => {
            if (payload) {
                console.log('Received foreground message: ', payload);
                if (Notification.permission === 'granted') {
                    new Notification(payload.notification?.title || "New Notification", {
                        body: payload.notification?.body
                    });
                } else {
                    alert(`Notification: ${payload.notification?.title}\n${payload.notification?.body}`);
                }
            }
        }).catch(err => console.log('failed: ', err));

        // Firestore Listener
        let unsub = null;
        const setupFirestoreListener = async () => {
            const user = auth.currentUser;
            if (!user) return;
            
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (!userDoc.exists()) return;
                
                const userData = userDoc.data();
                const schoolId = userData.schoolId;
                const role = (userData.role || "student").toLowerCase().trim();
                const targetClass = String(userData.class || "");
                
                if (!schoolId) return;

                const notifRef = collection(db, "notifications");
                const q = query(
                    notifRef,
                    where("schoolId", "==", schoolId),
                    orderBy("createdAt", "desc"),
                    limit(20)
                );

                unsub = onSnapshot(q, (snapshot) => {
                    let notifs = [];
                    snapshot.forEach(docSnap => {
                        const data = docSnap.data();
                        // Filter logic based on user role/target
                        let isRelevant = false;
                        if (data.userId === user.uid) isRelevant = true;
                        else if ((data.targetClass === targetClass || data.targetClass === "All") && role === 'student') isRelevant = true;
                        else if (data.targetRole === 'admin' && (role === 'admin' || role === 'teacher')) isRelevant = true;
                        else if (!data.userId && !data.targetClass && !data.targetRole) isRelevant = true; // global broadcast
                        
                        if (isRelevant) {
                            notifs.push({ id: docSnap.id, ...data });
                        }
                    });
                    
                    setNotifications(notifs);
                    
                    // Count local unread (we can use localStorage to track read status)
                    const readIds = JSON.parse(localStorage.getItem('readNotifs') || '[]');
                    const unread = notifs.filter(n => !readIds.includes(n.id)).length;
                    
                    // If new unread, and it's fresh, maybe show an alert (only if created recently to avoid spam on reload)
                    const prevCount = parseInt(localStorage.getItem('prevNotifCount') || '0');
                    if (unread > prevCount && notifs.length > 0) {
                        const latest = notifs[0];
                        if (latest && !readIds.includes(latest.id)) {
                             // Check if it's very recent (last 1 minute)
                             if (latest.createdAt && Date.now() - latest.createdAt.toMillis() < 60000) {
                                 if (Notification.permission === 'granted') {
                                     new Notification(latest.title, { body: latest.message });
                                 }
                             }
                        }
                    }
                    localStorage.setItem('prevNotifCount', unread.toString());
                    setUnreadCount(unread);
                });
            } catch (err) {
                console.error("Error setting up notifications:", err);
            }
        };

        const authUnsub = auth.onAuthStateChanged((user) => {
            if (user) setupFirestoreListener();
            else if (unsub) unsub();
        });

        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            if (unsub) unsub();
            authUnsub();
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleEnableNotifications = async () => {
        if (permissionStatus === 'granted') {
            setIsOpen(!isOpen);
            markAllAsRead();
            return;
        }

        const user = auth.currentUser;
        if (user) {
            const token = await requestNotificationPermission(user.uid);
            if (token) {
                setPermissionStatus('granted');
            }
        }
        setIsOpen(!isOpen);
        markAllAsRead();
    };
    
    const markAllAsRead = () => {
        if (notifications.length === 0) return;
        const readIds = notifications.map(n => n.id);
        localStorage.setItem('readNotifs', JSON.stringify(readIds));
        setUnreadCount(0);
        localStorage.setItem('prevNotifCount', '0');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={handleEnableNotifications} className="relative w-11 h-11 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 transition shadow-sm border border-slate-200">
                <FaBell className="text-lg" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[9px] font-bold text-white flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
            
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden flex flex-col max-h-96">
                    <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-800">Notifications</h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <FaTimes />
                        </button>
                    </div>
                    
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">
                                No new notifications
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const readIds = JSON.parse(localStorage.getItem('readNotifs') || '[]');
                                const isRead = readIds.includes(notif.id);
                                return (
                                    <div key={notif.id} className={`p-3 rounded-lg text-left ${isRead ? 'bg-white opacity-70' : 'bg-indigo-50/50 border border-indigo-100/50'}`}>
                                        <h4 className="text-sm font-bold text-slate-800 mb-1">{notif.title}</h4>
                                        <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                                        <span className="text-[10px] text-slate-400 mt-2 block">
                                            {notif.createdAt?.toDate().toLocaleString()}
                                        </span>
                                    </div>
                                )
                            })
                        )}
                    </div>
                    
                    {permissionStatus !== 'granted' && (
                        <div className="p-3 bg-indigo-50 border-t border-indigo-100 text-center">
                            <p className="text-xs text-indigo-600 mb-2 font-medium">Enable push notifications for updates</p>
                            <button onClick={async () => {
                                const user = auth.currentUser;
                                if (user) await requestNotificationPermission(user.uid);
                                setPermissionStatus(Notification.permission);
                            }} className="text-xs bg-indigo-600 text-white px-4 py-1.5 rounded-full font-bold shadow-sm active:scale-95 transition-transform">
                                Enable
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
