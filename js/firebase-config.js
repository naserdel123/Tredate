// ============================================
// FIREBASE CONFIGURATION
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyCXsA8yie6-3dOE7CJfR84LUN5XK_B1kys",
    authDomain: "robloxtrades-9ccc9.firebaseapp.com",
    projectId: "robloxtrades-9ccc9",
    storageBucket: "robloxtrades-9ccc9.firebasestorage.app",
    messagingSenderId: "136195999013",
    appId: "1:136195999013:web:756ffaeb15fa14ba7906cc"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export instances
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Timestamp helper
const timestamp = () => firebase.firestore.FieldValue.serverTimestamp();

// Check if user is admin
async function isAdmin(userId) {
    if (!userId) return false;
    const doc = await db.collection('users').doc(userId).get();
    return doc.exists && doc.data().isAdmin === true;
}

// Make available globally
window.firebaseApp = {
    auth,
    db,
    storage,
    timestamp,
    isAdmin
};
