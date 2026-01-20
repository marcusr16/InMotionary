//firebase modules
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  sendEmailVerification 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc,
  serverTimestamp
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

// Admin emails - both co-founders have equal admin access
const adminEmails = [
    'mdross0218@gmail.com',
    'charliehirschman247@gmail.com'
];

// Account type selection handling
const studentOption = document.getElementById('studentOption');
const organizationOption = document.getElementById('organizationOption');
const organizationFields = document.getElementById('organizationFields');
const radioButtons = document.querySelectorAll('input[name="accountType"]');

radioButtons.forEach(radio => {
    radio.addEventListener('change', function() {
        // Update visual selection
        studentOption.classList.remove('selected');
        organizationOption.classList.remove('selected');
        
        if (this.value === 'student') {
            studentOption.classList.add('selected');
            organizationFields.classList.remove('show');
        } else {
            organizationOption.classList.add('selected');
            organizationFields.classList.add('show');
        }
    });
});

// Make account type options clickable
studentOption.addEventListener('click', () => {
    document.querySelector('input[value="student"]').checked = true;
    studentOption.classList.add('selected');
    organizationOption.classList.remove('selected');
    organizationFields.classList.remove('show');
});

organizationOption.addEventListener('click', () => {
    document.querySelector('input[value="organization"]').checked = true;
    organizationOption.classList.add('selected');
    studentOption.classList.remove('selected');
    organizationFields.classList.add('show');
});

// Form submission
const signupForm = document.getElementById('signupForm');
const errorMessage = document.getElementById('errorMessage');
const submitBtn = document.getElementById('submitBtn');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    
    // Get form values
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const accountType = document.querySelector('input[name="accountType"]:checked').value;
    
    // Validation
    if (password.length < 8) {
        showError('Password must be at least 8 characters long');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    // Additional validation for organization accounts
    if (accountType === 'organization') {
        const organizationName = document.getElementById('organizationName').value.trim();
        const contactPerson = document.getElementById('contactPerson').value.trim();
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        
        if (!organizationName || !contactPerson || !phoneNumber) {
            showError('Please fill in all organization fields');
            return;
        }
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
    
    try {
        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Determine user role
        const isAdmin = adminEmails.includes(email.toLowerCase());
        let role = accountType;
        if (isAdmin) {
            role = 'admin';
        }
        
        // Prepare user data for Firestore
        const userData = {
            email: email.toLowerCase(),
            accountType: accountType,
            role: role,
            createdAt: serverTimestamp(),
            emailVerified: false,
            status: accountType === 'organization' ? 'pending' : 'active'
        };
        
        // Add organization-specific data
        if (accountType === 'organization') {
            userData.organizationName = document.getElementById('organizationName').value.trim();
            userData.contactPerson = document.getElementById('contactPerson').value.trim();
            userData.phoneNumber = document.getElementById('phoneNumber').value.trim();
            userData.verified = false; // Organizations need admin approval
        }
        
        // Save user data to Firestore
        await setDoc(doc(db, 'users', user.uid), userData);
        
        // Send email verification
        await sendEmailVerification(user);
        
        // Redirect based on account type and role
        if (role === 'admin') {
            window.location.href = 'dashboard-admin.html';
        } else if (accountType === 'organization') {
            // Show message that they need approval
            alert('Account created! Your organization account is pending approval. You will receive an email once approved.');
            window.location.href = 'index.html';
        } else {
            // Student account - go to homepage
            window.location.href = 'index.html';
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        
        // Handle specific Firebase errors
        let errorMsg = 'An error occurred during signup. Please try again.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMsg = 'This email is already registered. Please log in instead.';
        } else if (error.code === 'auth/invalid-email') {
            errorMsg = 'Please enter a valid email address.';
        } else if (error.code === 'auth/weak-password') {
            errorMsg = 'Password is too weak. Please use a stronger password.';
        }
        
        showError(errorMsg);
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    }
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}