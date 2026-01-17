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

//all jscript that was in html.index: 


        let userLocation = null;
        let selectedFilters = [];

        function requestLocation() {
            const btn = document.getElementById('locationBtn');
            const statusText = document.getElementById('locationText');
            
            btn.disabled = true;
            btn.textContent = 'Requesting...';
            
            if (!navigator.geolocation) {
                statusText.textContent = 'Geolocation is not supported by your browser';
                btn.disabled = false;
                btn.textContent = 'Enable Location';
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
                        statusText.textContent = `Location enabled: ${city}${state ? ', ' + state : ''}`;
                    } catch (error) {
                        statusText.textContent = 'Location enabled: your area';
                    }
                    
                    btn.textContent = '✓ Location Enabled';
                    btn.style.background = '#10b981';
                    document.getElementById('searchBtn').disabled = false;
                },
                (error) => {
                    let errorMsg = 'Unable to retrieve location';
                    if (error.code === 1) errorMsg = 'Location access denied';
                    else if (error.code === 2) errorMsg = 'Location unavailable';
                    else if (error.code === 3) errorMsg = 'Location request timed out';
                    
                    statusText.textContent = errorMsg;
                    btn.disabled = false;
                    btn.textContent = 'Try Again';
                }
            );
        }

        function toggleFilter(element) {
            const category = element.dataset.category;
            element.classList.toggle('active');
            
            if (selectedFilters.includes(category)) {
                selectedFilters = selectedFilters.filter(f => f !== category);
            } else {
                selectedFilters.push(category);
            }
        }

        async function searchActivities() {
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

            // Filter results based on selected categories
            let filteredActivities = mockActivities;
            if (selectedFilters.length > 0) {
                filteredActivities = mockActivities.filter(activity => 
                    selectedFilters.includes(activity.category)
                );
            }

            resultsCount.textContent = `Found ${filteredActivities.length} opportunities`;

            if (filteredActivities.length === 0) {
                activitiesList.innerHTML = `
                    <div class="activity-card">
                        <p style="text-align: center; color: #666;">No activities found matching your filters. Try selecting different categories!</p>
                    </div>
                `;
                return;
            }

            activitiesList.innerHTML = filteredActivities.map(activity => `
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
    window.toggleFilter = toggleFilter;
    window.searchActivities = searchActivities;