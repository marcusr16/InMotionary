//firebase modules
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy 
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

//firebase test
const db = getFirestore(app);
console.log("Firebase app initialized:", app);
console.log("Firestore instance:", db);

//all jscript that was in html.index: 

let userLocation = null;

function requestLocation() {
    const btn = document.getElementById('topLocationBtn');
    const statusText = document.getElementById('topLocationStatus');
    
    btn.disabled = true;
    btn.textContent = '📍 Requesting...';
    
    if (!navigator.geolocation) {
        statusText.textContent = 'Geolocation is not supported by your browser';
        btn.disabled = false;
        btn.textContent = '📍 Enable Location';
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            // Get city name from coordinates
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${userLocation.lat}&lon=${userLocation.lng}&format=json`);
                const data = await response.json();
                const city = data.address.city || data.address.town || data.address.village || data.address.county || 'your area';
                const state = data.address.state || '';
                statusText.textContent = `Location: ${city}${state ? ', ' + state : ''}`;
            } catch (error) {
                statusText.textContent = 'Location enabled';
            }
            
            btn.textContent = '✓ Location Enabled';
            btn.classList.add('active');
            btn.style.background = '#10b981';
        },
        (error) => {
            let errorMsg = 'Unable to retrieve location';
            if (error.code === 1) errorMsg = 'Location access denied';
            else if (error.code === 2) errorMsg = 'Location unavailable';
            else if (error.code === 3) errorMsg = 'Location request timed out';
            
            statusText.textContent = errorMsg;
            btn.disabled = false;
            btn.textContent = '📍 Try Again';
        }
    );
}

function searchActivities() {
    if (!userLocation) {
        alert('Please enable location first!');
        return;
    }

    const resultsSection = document.getElementById('resultsSection');
    const activitiesList = document.getElementById('activitiesList');
    
    // Show loading
    resultsSection.classList.add('show');
    activitiesList.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Finding activities near you...</p>
        </div>
    `;

    // Simulate API call
    setTimeout(() => {
        displayMockResults();
    }, 1500);
}

function displayMockResults() {
    const activitiesList = document.getElementById('activitiesList');
    const resultsCount = document.getElementById('resultsCount');
    
    // Mock data - in real implementation, this would come from your API
    const mockActivities = [
        {
            title: "Community Garden Volunteers Needed",
            category: "volunteer",
            distance: "0.8 miles",
            description: "Help maintain our community garden every Saturday morning. Great for students looking to give back while learning about sustainable agriculture.",
            schedule: "Saturdays 9 AM - 12 PM",
            organization: "Green Valley Community Center"
        },
        {
            title: "Youth Rocketry Club",
            category: "rocketry",
            distance: "1.2 miles",
            description: "Build and launch model rockets while learning aerospace engineering principles. Competitions available for advanced members.",
            schedule: "Thursdays 4 PM - 6 PM",
            organization: "STEM Academy"
        },
        {
            title: "Animal Shelter Support Team",
            category: "service",
            distance: "2.1 miles",
            description: "Assist with animal care, socialization, and adoption events. Perfect for animal lovers wanting to make a difference.",
            schedule: "Flexible scheduling",
            organization: "Paws & Claws Rescue"
        },
        {
            title: "Coding for Good Initiative",
            category: "stem",
            distance: "2.5 miles",
            description: "Use your coding skills to build websites and apps for local nonprofits. All skill levels welcome!",
            schedule: "Tuesdays 3:30 PM - 5:30 PM",
            organization: "Tech4Community"
        }
    ];

    resultsCount.textContent = `Found ${mockActivities.length} opportunities`;

    activitiesList.innerHTML = mockActivities.map(activity => `
        <div class="activity-card">
            <div class="activity-header">
                <div>
                    <h3 class="activity-title">${activity.title}</h3>
                    <span class="activity-category">${activity.category}</span>
                </div>
                <div class="activity-distance">${activity.distance}</div>
            </div>
            <p class="activity-description">${activity.description}</p>
            <div class="activity-details">
                <div class="detail-item">
                    <span>📅</span>
                    <span>${activity.schedule}</span>
                </div>
                <div class="detail-item">
                    <span>🏢</span>
                    <span>${activity.organization}</span>
                </div>
            </div>
        </div>
    `).join('');
}

window.requestLocation = requestLocation;
window.searchActivities = searchActivities;

// Language selector functionality
let currentLanguage = 'English';

function toggleLanguageDropdown() {
    const dropdown = document.getElementById('languageDropdown');
    dropdown.classList.toggle('show');
}

function selectLanguage(language) {
    currentLanguage = language;
    const btn = document.getElementById('languageBtn');
    btn.textContent = `🌐 ${language}`;
    
    // Remove active class from all options
    document.querySelectorAll('.language-option').forEach(option => {
        option.classList.remove('active');
    });
    
    // Add active class to selected option
    event.target.classList.add('active');
    
    // Close dropdown
    document.getElementById('languageDropdown').classList.remove('show');
    
    // Here you would typically trigger language translation
    console.log('Language changed to:', language);
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const languageSelector = document.querySelector('.language-selector');
    if (languageSelector && !languageSelector.contains(event.target)) {
        document.getElementById('languageDropdown').classList.remove('show');
    }
});

window.toggleLanguageDropdown = toggleLanguageDropdown;
window.selectLanguage = selectLanguage;
