// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

const Auth = {
    currentUser: null,
    
    // Initialize auth state listener
    init() {
        firebaseApp.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            
            // Redirect based on auth state
            const currentPage = window.location.pathname.split('/').pop();
            
            if (user) {
                // User is logged in
                if (currentPage === 'index.html' || currentPage === 'register.html' || currentPage === '') {
                    window.location.href = 'home.html';
                }
            } else {
                // User is logged out
                const protectedPages = ['home.html', 'admin.html'];
                if (protectedPages.includes(currentPage)) {
                    window.location.href = 'index.html';
                }
            }
        });
    },
    
    // Login
    async login(email, password) {
        try {
            const result = await firebaseApp.auth.signInWithEmailAndPassword(email, password);
            Animations.showToast('تم تسجيل الدخول بنجاح!', 'success');
            return { success: true, user: result.user };
        } catch (error) {
            let message = 'حدث خطأ في تسجيل الدخول';
            
            switch(error.code) {
                case 'auth/user-not-found':
                    message = 'البريد الإلكتروني غير مسجل';
                    break;
                case 'auth/wrong-password':
                    message = 'كلمة المرور غير صحيحة';
                    break;
                case 'auth/invalid-email':
                    message = 'البريد الإلكتروني غير صالح';
                    break;
                case 'auth/too-many-requests':
                    message = 'تم حظر المحاولات مؤقتاً، حاول لاحقاً';
                    break;
                case 'auth/user-disabled':
                    message = 'الحساب معطل';
                    break;
            }
            
            Animations.showToast(message, 'error');
            return { success: false, error: message };
        }
    },
    
    // Register
    async register(fullName, email, password) {
        try {
            // Create user
            const result = await firebaseApp.auth.createUserWithEmailAndPassword(email, password);
            const user = result.user;
            
            // Save to Firestore
            await firebaseApp.db.collection('users').doc(user.uid).set({
                fullName: fullName,
                email: email,
                createdAt: firebaseApp.timestamp(),
                isAdmin: email === 'admin@example.com'
            });
            
            // Update profile
            await user.updateProfile({ displayName: fullName });
            
            Animations.showToast('تم إنشاء الحساب بنجاح!', 'success');
            return { success: true, user };
            
        } catch (error) {
            let message = 'حدث خطأ في إنشاء الحساب';
            
            switch(error.code) {
                case 'auth/email-already-in-use':
                    message = 'البريد الإلكتروني مستخدم بالفعل';
                    break;
                case 'auth/invalid-email':
                    message = 'البريد الإلكتروني غير صالح';
                    break;
                case 'auth/weak-password':
                    message = 'كلمة المرور ضعيفة جداً (6 أحرف على الأقل)';
                    break;
            }
            
            Animations.showToast(message, 'error');
            return { success: false, error: message };
        }
    },
    
    // Logout
    async logout() {
        try {
            await firebaseApp.auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    },
    
    // Check if admin
    async isAdmin() {
        if (!this.currentUser) return false;
        return await firebaseApp.isAdmin(this.currentUser.uid);
    },
    
    // Get current user data
    getCurrentUser() {
        return this.currentUser;
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

// Export
window.Auth = Auth;
