import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db } from '../firebase-init';
import { doc, updateDoc } from 'firebase/firestore';

export const requestNotificationPermission = async (userId) => {
    try {
        console.log('Requesting notification permission...');
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            // Get VAPID key from environment variable or use a fallback for dev
            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
            
            if (!vapidKey) {
                console.warn("VITE_FIREBASE_VAPID_KEY is missing. Add your web push certificate key to .env");
                // We don't return here so at least browser permission is requested
                return 'browser_permission_granted_no_token';
            }

            if (messaging) {
                const currentToken = await getToken(messaging, { vapidKey });
                
                if (currentToken) {
                    console.log('FCM Token:', currentToken);
                    // Save the token to the user's document in Firestore
                    if (userId) {
                        const userRef = doc(db, "users", userId);
                        await updateDoc(userRef, {
                            fcmToken: currentToken
                        });
                        console.log('FCM Token saved to user profile.');
                    }
                    return currentToken;
                } else {
                    console.log('No registration token available. Request permission to generate one.');
                }
            }
        } else {
            console.log('Unable to get permission to notify.');
        }
    } catch (error) {
        console.error('An error occurred while requesting permission:', error);
    }
    return null;
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        if (messaging) {
            onMessage(messaging, (payload) => {
                resolve(payload);
            });
        }
    });
