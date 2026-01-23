//firebase modules
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, 
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
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

let currentUser = null;
let currentUserData = null;

// Check authentication and authorization
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Not logged in - redirect to login
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
        alert('User data not found');
        await signOut(auth);
        window.location.href = 'login.html';
        return;
    }

    currentUserData = userDoc.data();

    // Check if user is organization
    if (currentUserData.accountType !== 'organization') {
        alert('Access denied. This dashboard is for organizations only.');
        window.location.href = 'index.html';
        return;
    }

    // Check if organization is approved
    if (currentUserData.status === 'pending') {
        alert('Your organization account is still pending approval. Please wait for admin approval.');
        window.location.href = 'index.html';
        return;
    }

    if (currentUserData.status === 'rejected') {
        alert('Your organization account has been rejected. Please contact support.');
        window.location.href = 'index.html';
        return;
    }

    // Display user info
    document.getElementById('userEmail').textContent = currentUserData.organizationName || user.email;

    // Load user's opportunities
    loadOpportunities();
});

// Logout function
window.handleLogout = async function() {
    if (confirm('Are you sure you want to log out?')) {
        await signOut(auth);
        window.location.href = 'index.html';
    }
};

// Form submission
const opportunityForm = document.getElementById('opportunityForm');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const submitBtn = document.getElementById('submitBtn');

opportunityForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous messages
    successMessage.classList.remove('show');
    errorMessage.classList.remove('show');

    // Get form values
    const formData = {
        title: document.getElementById('title').value.trim(),
        category: document.getElementById('category').value,
        description: document.getElementById('description').value.trim(),
        schedule: document.getElementById('schedule').value.trim(),
        location: document.getElementById('location').value.trim(),
        contactEmail: document.getElementById('contactEmail').value.trim(),
        website: document.getElementById('website').value.trim(),
    };

    // Validation
    if (!formData.title || !formData.category || !formData.description || 
        !formData.schedule || !formData.location || !formData.contactEmail) {
        showError('Please fill in all required fields');
        return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        // Add opportunity to Firestore
        await addDoc(collection(db, 'opportunities'), {
            ...formData,
            organizationId: currentUser.uid,
            organizationName: currentUserData.organizationName,
            organizationEmail: currentUser.email,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Show success message
        showSuccess('Opportunity submitted successfully! It will appear on the site once approved by an admin.');

        // Reset form
        opportunityForm.reset();

        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit for Approval';

    } catch (error) {
        console.error('Error submitting opportunity:', error);
        showError('Failed to submit opportunity. Please try again.');
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit for Approval';
    }
});

// Load opportunities
function loadOpportunities() {
    const opportunitiesList = document.getElementById('opportunitiesList');

    // Query opportunities for this organization
    const q = query(
        collection(db, 'opportunities'),
        where('organizationId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
    );

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            opportunitiesList.innerHTML = `
                <div class="empty-state">
                    <p>You haven't posted any opportunities yet.</p>
                    <p style="margin-top: 8px; font-size: 0.9rem;">Fill out the form to post your first opportunity!</p>
                </div>
            `;
            return;
        }

        let html = '';
        snapshot.forEach((doc) => {
            const opp = doc.data();
            html += renderOpportunityItem(doc.id, opp);
        });

        opportunitiesList.innerHTML = html;
    });
}

// Render opportunity item
function renderOpportunityItem(id, opp) {
    const statusClass = `status-${opp.status}`;
    const statusText = opp.status.charAt(0).toUpperCase() + opp.status.slice(1);

    return `
        <div class="opportunity-item">
            <div class="opportunity-header">
                <div>
                    <h3 class="opportunity-title">${opp.title}</h3>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
            </div>
            <div class="opportunity-details">
                <p><strong>Category:</strong> ${opp.category}</p>
                <p><strong>Schedule:</strong> ${opp.schedule}</p>
                <p><strong>Location:</strong> ${opp.location}</p>
                <p><strong>Description:</strong> ${opp.description}</p>
                ${opp.website ? `<p><strong>Website:</strong> <a href="${opp.website}" target="_blank">${opp.website}</a></p>` : ''}
            </div>
            <div class="opportunity-actions">
                <button class="btn-secondary btn-delete" onclick="deleteOpportunity('${id}')">Delete</button>
            </div>
        </div>
    `;
}

// Delete opportunity
window.deleteOpportunity = async function(id) {
    if (!confirm('Are you sure you want to delete this opportunity?')) {
        return;
    }

    try {
        await deleteDoc(doc(db, 'opportunities', id));
        showSuccess('Opportunity deleted successfully');
    } catch (error) {
        console.error('Error deleting opportunity:', error);
        showError('Failed to delete opportunity');
    }
};

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.add('show');
    errorMessage.classList.remove('show');
    
    setTimeout(() => {
        successMessage.classList.remove('show');
    }, 5000);
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    successMessage.classList.remove('show');
}