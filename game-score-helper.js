// ============================================
// GAME SCORE HELPER
// Include this in your game pages to submit scores
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

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================
// SUBMIT SCORE FUNCTION
// Use this in your game when the player finishes
// ============================================

/**
 * Submit a score to the leaderboard
 * @param {string} gameId - The game identifier (e.g., 'space-invaders', 'tetris', 'snake')
 * @param {number} score - The player's score
 * @returns {Promise<boolean>} - True if successful, false otherwise
 * 
 * Example usage in your game:
 * 
 * import './game-score-helper.js';
 * 
 * // When game ends
 * const success = await window.PixelArcade.submitScore('space-invaders', playerScore);
 * if (success) {
 *     alert('Score submitted to leaderboard!');
 * }
 */
async function submitScore(gameId, score) {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                console.warn('User not logged in - score not submitted');
                resolve(false);
                return;
            }
            
            try {
                const username = user.email.split('@')[0];
                
                await addDoc(collection(db, 'scores'), {
                    gameId: gameId,
                    userId: user.uid,
                    username: username,
                    score: score,
                    timestamp: Timestamp.now(),
                    createdAt: new Date().toISOString()
                });
                
                console.log(`Score ${score} submitted successfully for ${gameId}`);
                resolve(true);
                
            } catch (error) {
                console.error('Error submitting score:', error);
                resolve(false);
            }
        }, { once: true });
    });
}

/**
 * Check if user is logged in
 * @returns {Promise<boolean>}
 */
async function isUserLoggedIn() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
            resolve(!!user);
        }, { once: true });
    });
}

/**
 * Get current user info
 * @returns {Promise<Object|null>}
 */
async function getCurrentUser() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                resolve({
                    uid: user.uid,
                    email: user.email,
                    username: user.email.split('@')[0]
                });
            } else {
                resolve(null);
            }
        }, { once: true });
    });
}

// Export functions to global scope
window.PixelArcade = {
    submitScore,
    isUserLoggedIn,
    getCurrentUser
};

console.log('Pixel Arcade Score Helper loaded!');
