// ============================================
// FIREBASE CONFIGURATION
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyDsCNv0gZ3zvGuyrkb5vdzuMKPqjpb_NE0",
    authDomain: "free-games-hub.firebaseapp.com",
    projectId: "free-games-hub",
    storageBucket: "free-games-hub.firebasestorage.app",
    messagingSenderId: "935587086734",
    appId: "1:935587086734:web:ba7c1d19c4a32f18c124df",
    measurementId: "G-422WG76L3B"
};

// ============================================
// FIREBASE INITIALIZATION
// ============================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    signOut,
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ============================================
// DOM ELEMENTS
// ============================================
const userSection = document.getElementById('userSection');
const loginModalBtn = document.getElementById('loginModalBtn');

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================
async function handleLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ============================================
// UI UPDATES BASED ON AUTH STATE
// ============================================
function updateUIForUser(user) {
    if (user) {
        // User is logged in
        const userEmail = user.email.split('@')[0];
        userSection.innerHTML = `
            <div class="user-profile">
                <span class="user-email">PLAYER: ${userEmail.toUpperCase()}</span>
                <button id="logoutBtn" class="pixel-btn">LOGOUT</button>
            </div>
        `;
        
        // Add logout listener
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    } else {
        // User is logged out - redirect to home for login
        userSection.innerHTML = `
            <button class="pixel-btn" onclick="window.location.href='index.html'">LOGIN</button>
        `;
    }
}

// ============================================
// AUTH STATE OBSERVER
// ============================================
onAuthStateChanged(auth, (user) => {
    updateUIForUser(user);
    
    if (user) {
        console.log('User logged in:', user.email);
    } else {
        console.log('User logged out');
    }
});

// ============================================
// MODAL EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // About, Contact, Privacy modals
    const aboutLink = document.getElementById('aboutLink');
    const contactLink = document.getElementById('contactLink');
    const privacyLink = document.getElementById('privacyLink');
    const aboutModal = document.getElementById('aboutModal');
    const contactModal = document.getElementById('contactModal');
    const privacyModal = document.getElementById('privacyModal');

    if (aboutLink) {
        aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            aboutModal.style.display = 'block';
        });
    }

    if (contactLink) {
        contactLink.addEventListener('click', (e) => {
            e.preventDefault();
            contactModal.style.display = 'block';
        });
    }

    if (privacyLink) {
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            privacyModal.style.display = 'block';
        });
    }

    // Close buttons for all modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            if (modalId) {
                document.getElementById(modalId).style.display = 'none';
            }
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
});
