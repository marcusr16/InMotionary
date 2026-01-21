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
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  getDocs
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

// Admin emails
const adminEmails = [
    'mdross0218@gmail.com',
    'charliehirschman247@gmail.com'
];

// Check authentication and authorization
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;

    // Get user data
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
        alert('User data not found');
        await signOut(auth);
        window.location.href = 'login.html';
        return;
    }

    currentUserData = userDoc.data();

    // Check if user is admin
    if (currentUserData.role !== 'admin') {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'index.html';
        return;
    }

    // Display user info
    document.getElementById('userEmail').textContent = user.email;

    // Load all data
    loadStats();
    loadPendingOrganizations();
    loadPendingOpportunities();
    loadApprovedOpportunities();
});

// Logout function
window.handleLogout = async function() {
    if (confirm('Are you sure you want to log out?')) {
        await signOut(auth);
        window.location.href = 'index.html';
    }
};

// Tab switching
window.switchTab = function(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
};

// Load statistics
async function loadStats() {
    // Count pending organizations
    const pendingOrgsQuery = query(
        collection(db, 'users'),
        where('accountType', '==', 'organization'),
        where('status', '==', 'pending')
    );
    const pendingOrgsSnapshot = await getDocs(pendingOrgsQuery);
    document.getElementById('pendingOrgsCount').textContent = pendingOrgsSnapshot.size;

    // Count pending opportunities
    const pendingOppsQuery = query(
        collection(db, 'opportunities'),
        where('status', '==', 'pending')
    );
    const pendingOppsSnapshot = await getDocs(pendingOppsQuery);
    document.getElementById('pendingOppsCount').textContent = pendingOppsSnapshot.size;

    // Count total opportunities
    const totalOppsSnapshot = await getDocs(collection(db, 'opportunities'));
    document.getElementById('totalOppsCount').textContent = totalOppsSnapshot.size;

    // Count active organizations
    const activeOrgsQuery = query(
        collection(db, 'users'),
        where('accountType', '==', 'organization'),
        where('status', '==', 'approved')
    );
    const activeOrgsSnapshot = await getDocs(activeOrgsQuery);
    document.getElementById('activeOrgsCount').textContent = activeOrgsSnapshot.size;
}

// Load pending organizations
function loadPendingOrganizations() {
    const organizationsList = document.getElementById('organizationsList');

    const q = query(
        collection(db, 'users'),
        where('accountType', '==', 'organization'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
    );

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            organizationsList.innerHTML = `
                <div class="empty-state">
                    <h3>No Pending Organizations</h3>
                    <p>All organizations have been reviewed</p>
                </div>
            `;
            return;
        }

        let html = '';
        snapshot.forEach((doc) => {
            const org = doc.data();
            html += renderOrganizationItem(doc.id, org);
        });

        organizationsList.innerHTML = html;
    });
}

// Render organization item
function renderOrganizationItem(uid, org) {
    return `
        <div class="review-item">
            <div class="review-header">
                <div>
                    <h3 class="review-title">${org.organizationName}</h3>
                    <div class="review-meta">
                        <span>📧 ${org.email}</span>
                        <span>📞 ${org.phoneNumber}</span>
                    </div>
                </div>
            </div>
            <div class="review-details">
                <div class="detail-row">
                    <div class="detail-label">Contact Person:</div>
                    <div class="detail-value">${org.contactPerson}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Submitted:</div>
                    <div class="detail-value">${org.createdAt ? new Date(org.createdAt.toDate()).toLocaleDateString() : 'Unknown'}</div>
                </div>
            </div>
            <div class="review-actions">
                <button class="btn btn-approve" onclick="approveOrganization('${uid}')">Approve Organization</button>
                <button class="btn btn-reject" onclick="rejectOrganization('${uid}')">Reject</button>
            </div>
        </div>
    `;
}

// Approve organization
window.approveOrganization = async function(uid) {
    if (!confirm('Approve this organization? They will be able to post opportunities.')) {
        return;
    }

    try {
        await updateDoc(doc(db, 'users', uid), {
            status: 'approved',
            verified: true
        });

        showToast('Organization approved successfully');
        loadStats(); // Refresh stats
    } catch (error) {
        console.error('Error approving organization:', error);
        alert('Failed to approve organization');
    }
};

// Reject organization
window.rejectOrganization = async function(uid) {
    if (!confirm('Reject this organization? They will not be able to post opportunities.')) {
        return;
    }

    try {
        await updateDoc(doc(db, 'users', uid), {
            status: 'rejected'
        });

        showToast('Organization rejected');
        loadStats(); // Refresh stats
    } catch (error) {
        console.error('Error rejecting organization:', error);
        alert('Failed to reject organization');
    }
};

// Load pending opportunities
function loadPendingOpportunities() {
    const opportunitiesList = document.getElementById('opportunitiesList');

    const q = query(
        collection(db, 'opportunities'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
    );

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            opportunitiesList.innerHTML = `
                <div class="empty-state">
                    <h3>No Pending Opportunities</h3>
                    <p>All opportunities have been reviewed</p>
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

// Load approved opportunities
function loadApprovedOpportunities() {
    const approvedList = document.getElementById('approvedList');

    const q = query(
        collection(db, 'opportunities'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
    );

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            approvedList.innerHTML = `
                <div class="empty-state">
                    <h3>No Approved Opportunities Yet</h3>
                    <p>Approved opportunities will appear here</p>
                </div>
            `;
            return;
        }

        let html = '';
        snapshot.forEach((doc) => {
            const opp = doc.data();
            html += renderApprovedOpportunityItem(doc.id, opp);
        });

        approvedList.innerHTML = html;
    });
}

// Render opportunity item
function renderOpportunityItem(id, opp) {
    return `
        <div class="review-item">
            <div class="review-header">
                <div>
                    <h3 class="review-title">${opp.title}</h3>
                    <div class="review-meta">
                        <span>🏢 ${opp.organizationName}</span>
                        <span>📂 ${opp.category}</span>
                    </div>
                </div>
            </div>
            <div class="review-details">
                <div class="detail-row">
                    <div class="detail-label">Description:</div>
                    <div class="detail-value">${opp.description}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Schedule:</div>
                    <div class="detail-value">${opp.schedule}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Location:</div>
                    <div class="detail-value">${opp.location}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Contact:</div>
                    <div class="detail-value">${opp.contactEmail}</div>
                </div>
                ${opp.website ? `
                <div class="detail-row">
                    <div class="detail-label">Website:</div>
                    <div class="detail-value"><a href="${opp.website}" target="_blank">${opp.website}</a></div>
                </div>
                ` : ''}
                <div class="detail-row">
                    <div class="detail-label">Submitted:</div>
                    <div class="detail-value">${opp.createdAt ? new Date(opp.createdAt.toDate()).toLocaleDateString() : 'Unknown'}</div>
                </div>
            </div>
            <div class="review-actions">
                <button class="btn btn-approve" onclick="approveOpportunity('${id}')">Approve & Publish</button>
                <button class="btn btn-reject" onclick="rejectOpportunity('${id}')">Reject</button>
            </div>
        </div>
    `;
}

// Render approved opportunity item
function renderApprovedOpportunityItem(id, opp) {
    return `
        <div class="review-item">
            <div class="review-header">
                <div>
                    <h3 class="review-title">${opp.title}</h3>
                    <div class="review-meta">
                        <span>🏢 ${opp.organizationName}</span>
                        <span>📂 ${opp.category}</span>
                    </div>
                </div>
            </div>
            <div class="review-details">
                <div class="detail-row">
                    <div class="detail-label">Description:</div>
                    <div class="detail-value">${opp.description}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Schedule:</div>
                    <div class="detail-value">${opp.schedule}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Location:</div>
                    <div class="detail-value">${opp.location}</div>
                </div>
            </div>
            <div class="review-actions">
                <button class="btn btn-reject" onclick="unpublishOpportunity('${id}')">Unpublish</button>
            </div>
        </div>
    `;
}

// Approve opportunity
window.approveOpportunity = async function(id) {
    if (!confirm('Approve this opportunity? It will be published on the website.')) {
        return;
    }

    try {
        await updateDoc(doc(db, 'opportunities', id), {
            status: 'approved'
        });

        showToast('Opportunity approved and published!');
        loadStats(); // Refresh stats
    } catch (error) {
        console.error('Error approving opportunity:', error);
        alert('Failed to approve opportunity');
    }
};

// Reject opportunity
window.rejectOpportunity = async function(id) {
    if (!confirm('Reject this opportunity?')) {
        return;
    }

    try {
        await updateDoc(doc(db, 'opportunities', id), {
            status: 'rejected'
        });

        showToast('Opportunity rejected');
        loadStats(); // Refresh stats
    } catch (error) {
        console.error('Error rejecting opportunity:', error);
        alert('Failed to reject opportunity');
    }
};

// Unpublish opportunity
window.unpublishOpportunity = async function(id) {
    if (!confirm('Unpublish this opportunity? It will be removed from the website.')) {
        return;
    }

    try {
        await updateDoc(doc(db, 'opportunities', id), {
            status: 'rejected'
        });

        showToast('Opportunity unpublished');
        loadStats(); // Refresh stats
    } catch (error) {
        console.error('Error unpublishing opportunity:', error);
        alert('Failed to unpublish opportunity');
    }
};

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('successToast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}