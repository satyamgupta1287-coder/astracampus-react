const fs = require('fs');
let code = fs.readFileSync('src/utils/notifications.js', 'utf8');

code = code.replace(
    /if \(!vapidKey\) \{[\s\S]*?return null;\n\s*\}/,
    `if (!vapidKey) {
                console.warn("VITE_FIREBASE_VAPID_KEY is missing. Add your web push certificate key to .env");
                // We don't return here so at least browser permission is requested
                return 'browser_permission_granted_no_token';
            }`
);

fs.writeFileSync('src/utils/notifications.js', code);
