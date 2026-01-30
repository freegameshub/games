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
import { 
    getFirestore, 
    doc, 
    getDoc,
    setDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
        window.location.href = 'index.html';
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
                <a href="favorites.html" class="pixel-btn small" style="margin-right: 10px; text-decoration: none;">FAVORITES</a>
                <span class="user-email">PLAYER: ${userEmail.toUpperCase()}</span>
                <button id="logoutBtn" class="pixel-btn">LOGOUT</button>
            </div>
        `;
        
        // Add logout listener
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
        
        // Load user's favorites to highlight them
        loadUserFavorites(user.uid);
    } else {
        // User is logged out - redirect to home for login
        userSection.innerHTML = `
            <button class="pixel-btn" onclick="window.location.href='index.html'">LOGIN</button>
        `;
    }
}

// ============================================
// FAVORITES FUNCTIONS
// ============================================
async function loadUserFavorites(userId) {
    try {
        const favoritesRef = doc(db, 'favorites', userId);
        const favoritesSnap = await getDoc(favoritesRef);
        
        if (favoritesSnap.exists()) {
            const favorites = favoritesSnap.data().games || [];
            const favoriteIds = favorites.map(game => game.id);
            
            // Highlight favorite buttons
            document.querySelectorAll('.favorite-btn').forEach(btn => {
                const gameCard = btn.closest('.game-card');
                const gameId = gameCard.getAttribute('data-game-id');
                
                if (favoriteIds.includes(gameId)) {
                    btn.classList.add('active');
                }
            });
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

async function toggleFavorite(gameId, title, category, description) {
    const user = auth.currentUser;
    if (!user) {
        alert('Please log in to add favorites!');
        return;
    }
    
    try {
        const favoritesRef = doc(db, 'favorites', user.uid);
        const favoritesSnap = await getDoc(favoritesRef);
        
        let favorites = [];
        if (favoritesSnap.exists()) {
            favorites = favoritesSnap.data().games || [];
        }
        
        // Check if already favorited
        const existingIndex = favorites.findIndex(game => game.id === gameId);
        
        if (existingIndex > -1) {
            // Remove from favorites
            favorites.splice(existingIndex, 1);
        } else {
            // Add to favorites
            favorites.push({
                id: gameId,
                title: title,
                category: category,
                description: description,
                addedAt: new Date().toISOString()
            });
        }
        
        // Save to Firestore
        await setDoc(favoritesRef, { games: favorites });
        
        // Update button state
        const btn = document.querySelector(`[data-game-id="${gameId}"] .favorite-btn`);
        if (btn) {
            btn.classList.toggle('active');
        }
        
    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert('Failed to update favorites. Please try again.');
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
    
    // Favorite buttons
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const gameCard = this.closest('.game-card');
            const gameId = gameCard.getAttribute('data-game-id');
            const title = this.getAttribute('data-game-title');
            const category = this.getAttribute('data-game-category');
            const description = this.getAttribute('data-game-desc');
            
            toggleFavorite(gameId, title, category, description);
        });
    });
});
