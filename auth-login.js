//firebase modules
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

//firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAGkITZRM2EVIWeCxOMNI6VtHqM63rGUKE",
  authDomain: "inmotionary-bbbfe.firebaseapp.com",
  projectId: "inmotionary-bbbfe",
  storageBucket: "inmotionary-bbbfe.firebasestorage.app",
  messagingSenderId: "752319569333",
  appId: "1:752319569333:web:3ccafe30cd69bebc100dfc",
  measurementId: "G-3XZFB448BN"
};

//initialize firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Form submission
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const submitBtn = document.getElementById('submitBtn');
const rememberMeCheckbox = document.getElementById('rememberMe');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    
    // Get form values
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = rememberMeCheckbox.checked;
    
    // Validation
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging In...';
    
    try {
        // Set persistence based on remember me checkbox
        const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistence);
        
        // Sign in user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
            throw new Error('User data not found');
        }
        
        const userData = userDoc.data();
        
        // Check if organization account is approved
        if (userData.accountType === 'organization' && userData.status === 'pending') {
            showError('Your organization account is still pending approval. Please wait for admin approval.');
            await auth.signOut();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Log In';
            return;
        }
        
        if (userData.accountType === 'organization' && userData.status === 'rejected') {
            showError('Your organization account has been rejected. Please contact support for more information.');
            await auth.signOut();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Log In';
            return;
        }
        
        // Redirect based on user role
        if (userData.role === 'admin') {
            window.location.href = 'dashboard-admin.html';
        } else if (userData.accountType === 'organization') {
            window.location.href = 'dashboard-organization.html';
        } else {
            // Student - go to homepage
            window.location.href = 'index.html';
        }
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Handle specific Firebase errors
        let errorMsg = 'An error occurred during login. Please try again.';
        
        if (error.code === 'auth/invalid-credential' || 
            error.code === 'auth/user-not-found' || 
            error.code === 'auth/wrong-password') {
            errorMsg = 'Invalid email or password. Please try again.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMsg = 'Too many failed login attempts. Please try again later.';
        } else if (error.code === 'auth/user-disabled') {
            errorMsg = 'This account has been disabled. Please contact support.';
        }
        
        showError(errorMsg);
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log In';
    }
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
