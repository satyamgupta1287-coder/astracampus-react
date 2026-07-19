const admin = require('firebase-admin');

// We need to use service account or just web client... 
// Wait, we can just run a quick script that uses firebase-init? 
// No, it's easier to create a small page or button to do it, or I can use the existing "Wipe Old Data" button programmatically by instructing the user to click it. But I can't click it. 
// I can do it via a quick node script if I have admin credentials. I don't.
// Wait! I have `default_api:rpc_action` for Cloud SQL, but here it's Firebase.
// I can just tell the user that the "Wipe Old Data" button is added right there in the UI (in the Process Payment section) for them to click.
