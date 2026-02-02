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

// Load and display coin balance
async function loadCoinBalance(userId) {
    if (!window.CoinSystem) {
        console.log('CoinSystem not loaded yet');
        return;
    }
    
    try {
        const balance = await window.CoinSystem.getUserBalance(userId);
        const coinBalanceEl = document.getElementById('coinBalance');
        if (coinBalanceEl) {
            coinBalanceEl.textContent = balance.toLocaleString();
        }
    } catch (error) {
        console.error('Error loading coin balance:', error);
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
                <a href="leaderboard.html" class="pixel-btn small" style="margin-right: 10px; text-decoration: none;">SCORES</a>
                <span class="user-email">PLAYER: ${userEmail.toUpperCase()}</span>
                <button id="logoutBtn" class="pixel-btn">LOGOUT</button>
            </div>
        `;
        
        // Add logout listener
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
        
        // Show coin display and load balance
        const coinDisplay = document.getElementById('coinDisplay');
        if (coinDisplay) {
            coinDisplay.style.display = 'flex';
            
            // Wait for CoinSystem to load
            const checkCoinSystem = setInterval(() => {
                if (window.CoinSystem) {
                    clearInterval(checkCoinSystem);
                    window.CoinSystem.initializeUser(user.uid, user.email);
                    loadCoinBalance(user.uid);
                }
            }, 100);
            
            // Timeout after 3 seconds
            setTimeout(() => clearInterval(checkCoinSystem), 3000);
        }
        
        // Load user's favorites to highlight them
        loadUserFavorites(user.uid);
    } else {
        // User is logged out
        userSection.innerHTML = `
            <button class="pixel-btn" onclick="window.location.href='index.html'">LOGIN</button>
        `;
        
        // Hide coin display
        const coinDisplay = document.getElementById('coinDisplay');
        if (coinDisplay) coinDisplay.style.display = 'none';
    }
}

// ============================================
// FAVORITES SYSTEM
// ============================================
async function loadUserFavorites(userId) {
    try {
        const favoritesRef = doc(db, 'favorites', userId);
        const favoritesSnap = await getDoc(favoritesRef);
        
        if (favoritesSnap.exists()) {
            const favorites = favoritesSnap.data().games || [];
            const favoriteIds = favorites.map(game => game.id);
            
            // Highlight favorited games
            document.querySelectorAll('.favorite-btn').forEach(btn => {
                const gameCard = btn.closest('.game-card');
                if (gameCard) {
                    const gameId = gameCard.getAttribute('data-game-id');
                    if (favoriteIds.includes(gameId)) {
                        btn.classList.add('active');
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

async function toggleFavorite(gameId, gameTitle, gameCategory, gameDesc) {
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
        
        const existingIndex = favorites.findIndex(game => game.id === gameId);
        
        if (existingIndex > -1) {
            // Remove from favorites
            favorites.splice(existingIndex, 1);
        } else {
            // Add to favorites
            favorites.push({
                id: gameId,
                title: gameTitle,
                category: gameCategory,
                description: gameDesc,
                addedAt: new Date().toISOString()
            });
        }
        
        await setDoc(favoritesRef, { games: favorites });
        
        // Update UI
        const btn = document.querySelector(`.game-card[data-game-id="${gameId}"] .favorite-btn`);
        if (btn) {
            btn.classList.toggle('active');
        }
        
    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert('Failed to update favorites. Please try again.');
    }
}

// Make toggleFavorite available globally
window.toggleFavorite = toggleFavorite;

// ============================================
// AUTH STATE OBSERVER
// ============================================
onAuthStateChanged(auth, (user) => {
    updateUIForUser(user);
});

// ============================================
// FAVORITE BUTTON EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to all favorite buttons
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const gameCard = this.closest('.game-card');
            if (!gameCard) return;
            
            const gameId = gameCard.getAttribute('data-game-id');
            const gameTitle = this.getAttribute('data-game-title');
            const gameCategory = this.getAttribute('data-game-category');
            const gameDesc = this.getAttribute('data-game-desc');
            
            toggleFavorite(gameId, gameTitle, gameCategory, gameDesc);
        });
    });
});
