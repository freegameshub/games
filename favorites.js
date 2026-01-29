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
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================
// DOM ELEMENTS
// ============================================
const userSection = document.getElementById('userSection');
const favoritesGrid = document.getElementById('favoritesGrid');
const emptyMessage = document.getElementById('emptyMessage');
const favoritesSubtitle = document.getElementById('favoritesSubtitle');

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
// FAVORITES FUNCTIONS
// ============================================
async function loadFavorites(userId) {
    try {
        const favoritesRef = doc(db, 'favorites', userId);
        const favoritesSnap = await getDoc(favoritesRef);
        
        if (favoritesSnap.exists()) {
            const favorites = favoritesSnap.data().games || [];
            
            if (favorites.length === 0) {
                showEmptyState();
            } else {
                displayFavorites(favorites);
            }
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
        showEmptyState();
    }
}

function showEmptyState() {
    favoritesGrid.innerHTML = `
        <div class="empty-favorites">
            <div class="empty-icon">★</div>
            <h3>No favorites yet!</h3>
            <p>Browse games and click the star icon to add them to your favorites.</p>
            <button class="pixel-btn primary" onclick="window.location.href='games.html'">BROWSE GAMES</button>
        </div>
    `;
    favoritesSubtitle.textContent = 'Your favorite games will appear here';
}

function displayFavorites(favorites) {
    favoritesSubtitle.textContent = `You have ${favorites.length} favorite game${favorites.length !== 1 ? 's' : ''}`;
    
    favoritesGrid.innerHTML = favorites.map(game => `
        <div class="game-card" data-game-id="${game.id}">
            <div class="game-thumbnail">
                <div class="coming-soon">COMING SOON</div>
            </div>
            <div class="game-info">
                <h3>${game.title}</h3>
                <p class="game-category">${game.category}</p>
                <p class="game-description">${game.description || ''}</p>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <button class="pixel-btn small" onclick="alert('Game coming soon!')">PLAY</button>
                <button class="favorite-btn active" onclick="removeFavorite('${game.id}')">★</button>
            </div>
        </div>
    `).join('');
}

window.removeFavorite = async function(gameId) {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        // Get current favorites
        const favoritesRef = doc(db, 'favorites', user.uid);
        const favoritesSnap = await getDoc(favoritesRef);
        
        if (favoritesSnap.exists()) {
            const currentFavorites = favoritesSnap.data().games || [];
            const updatedFavorites = currentFavorites.filter(game => game.id !== gameId);
            
            // Update Firestore
            const { setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            await setDoc(favoritesRef, { games: updatedFavorites });
            
            // Reload favorites
            loadFavorites(user.uid);
        }
    } catch (error) {
        console.error('Error removing favorite:', error);
        alert('Failed to remove favorite. Please try again.');
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
        
        // Load favorites
        loadFavorites(user.uid);
    } else {
        // User is logged out - redirect to home for login
        window.location.href = 'index.html';
    }
}

// ============================================
// AUTH STATE OBSERVER
// ============================================
onAuthStateChanged(auth, (user) => {
    updateUIForUser(user);
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
