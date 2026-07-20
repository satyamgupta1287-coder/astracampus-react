importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCqSMjr5__HNV-LXZi5vQvGzfBQ46lRFNA",
    authDomain: "auth-demo-f8ae4.firebaseapp.com",
    projectId: "auth-demo-f8ae4",
    storageBucket: "auth-demo-f8ae4.firebasestorage.app",
    messagingSenderId: "245702722359",
    appId: "1:245702722359:web:c669123eb90a1d282290b2",
    measurementId: "G-DJ4TS9FBX6"
};

// Initialize Firebase in the service worker
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/vite.svg'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
