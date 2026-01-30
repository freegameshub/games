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
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================
// GLOBAL STATE
// ============================================
let currentGame = 'space-invaders';
let currentUser = null;

// ============================================
// DOM ELEMENTS
// ============================================
const userSection = document.getElementById('userSection');
const gameSelect = document.getElementById('gameSelect');
const tabButtons = document.querySelectorAll('.tab-btn');
const globalLeaderboard = document.getElementById('globalLeaderboard');
const weeklyLeaderboard = document.getElementById('weeklyLeaderboard');
const personalLeaderboard = document.getElementById('personalLeaderboard');
const personalStats = document.getElementById('personalStats');
const submitScoreBtn = document.getElementById('submitScoreBtn');
const testScoreInput = document.getElementById('testScore');

// ============================================
// AUTHENTICATION
// ============================================
async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function updateUIForUser(user) {
    currentUser = user;
    
    if (user) {
        const userEmail = user.email.split('@')[0];
        userSection.innerHTML = `
            <div class="user-profile">
                <a href="favorites.html" class="pixel-btn small" style="margin-right: 10px; text-decoration: none;">FAVORITES</a>
                <span class="user-email">PLAYER: ${userEmail.toUpperCase()}</span>
                <button id="logoutBtn" class="pixel-btn">LOGOUT</button>
            </div>
        `;
        
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
        
        // Load personal leaderboard
        loadPersonalLeaderboard(currentGame);
    } else {
        userSection.innerHTML = `
            <button class="pixel-btn" onclick="window.location.href='index.html'">LOGIN</button>
        `;
    }
}

// ============================================
// LEADERBOARD FUNCTIONS
// ============================================

// Submit a score
async function submitScore(gameId, score) {
    if (!currentUser) {
        alert('Please log in to submit scores!');
        return;
    }
    
    try {
        const username = currentUser.email.split('@')[0];
        
        await addDoc(collection(db, 'scores'), {
            gameId: gameId,
            userId: currentUser.uid,
            username: username,
            score: score,
            timestamp: Timestamp.now(),
            createdAt: new Date().toISOString()
        });
        
        alert(`Score ${score} submitted successfully!`);
        
        // Reload leaderboards
        loadGlobalLeaderboard(gameId);
        loadWeeklyLeaderboard(gameId);
        loadPersonalLeaderboard(gameId);
        
    } catch (error) {
        console.error('Error submitting score:', error);
        alert('Failed to submit score. Please try again.');
    }
}

// Load global (all-time) leaderboard
async function loadGlobalLeaderboard(gameId) {
    try {
        globalLeaderboard.innerHTML = '<div class="loading">LOADING...</div>';
        
        const q = query(
            collection(db, 'scores'),
            where('gameId', '==', gameId),
            orderBy('score', 'desc'),
            limit(100)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            globalLeaderboard.innerHTML = '<div class="empty-state">No scores yet. Be the first!</div>';
            return;
        }
        
        let rank = 1;
        const rows = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = new Date(data.createdAt).toLocaleDateString();
            const isCurrentUser = currentUser && data.userId === currentUser.uid;
            
            rows.push(`
                <div class="table-row ${isCurrentUser ? 'highlight' : ''} ${rank <= 3 ? 'top-three rank-' + rank : ''}">
                    <span class="rank-col">${getRankDisplay(rank)}</span>
                    <span class="player-col">${data.username}${isCurrentUser ? ' (YOU)' : ''}</span>
                    <span class="score-col">${data.score.toLocaleString()}</span>
                    <span class="date-col">${date}</span>
                </div>
            `);
            rank++;
        });
        
        globalLeaderboard.innerHTML = rows.join('');
        
    } catch (error) {
        console.error('Error loading global leaderboard:', error);
        globalLeaderboard.innerHTML = '<div class="error-state">Failed to load scores</div>';
    }
}

// Load weekly leaderboard
async function loadWeeklyLeaderboard(gameId) {
    try {
        weeklyLeaderboard.innerHTML = '<div class="loading">LOADING...</div>';
        
        // Get start of current week (Monday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        
        const weekStart = Timestamp.fromDate(monday);
        
        const q = query(
            collection(db, 'scores'),
            where('gameId', '==', gameId),
            where('timestamp', '>=', weekStart),
            orderBy('timestamp', 'desc'),
            orderBy('score', 'desc'),
            limit(100)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            weeklyLeaderboard.innerHTML = '<div class="empty-state">No scores this week yet!</div>';
            return;
        }
        
        // Sort by score in memory (since we can only orderBy one field with inequality)
        const scores = [];
        querySnapshot.forEach((doc) => {
            scores.push({ id: doc.id, ...doc.data() });
        });
        scores.sort((a, b) => b.score - a.score);
        
        let rank = 1;
        const rows = [];
        
        scores.forEach((data) => {
            const date = new Date(data.createdAt).toLocaleDateString();
            const isCurrentUser = currentUser && data.userId === currentUser.uid;
            
            rows.push(`
                <div class="table-row ${isCurrentUser ? 'highlight' : ''} ${rank <= 3 ? 'top-three rank-' + rank : ''}">
                    <span class="rank-col">${getRankDisplay(rank)}</span>
                    <span class="player-col">${data.username}${isCurrentUser ? ' (YOU)' : ''}</span>
                    <span class="score-col">${data.score.toLocaleString()}</span>
                    <span class="date-col">${date}</span>
                </div>
            `);
            rank++;
        });
        
        weeklyLeaderboard.innerHTML = rows.join('');
        
    } catch (error) {
        console.error('Error loading weekly leaderboard:', error);
        weeklyLeaderboard.innerHTML = '<div class="error-state">Failed to load scores</div>';
    }
}

// Load personal best scores
async function loadPersonalLeaderboard(gameId) {
    if (!currentUser) {
        personalLeaderboard.innerHTML = '<div class="empty-state">Please log in to view your scores</div>';
        personalStats.innerHTML = '';
        return;
    }
    
    try {
        personalLeaderboard.innerHTML = '<div class="loading">LOADING...</div>';
        
        const q = query(
            collection(db, 'scores'),
            where('gameId', '==', gameId),
            where('userId', '==', currentUser.uid),
            orderBy('score', 'desc'),
            limit(50)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            personalLeaderboard.innerHTML = '<div class="empty-state">No scores yet. Play to set your record!</div>';
            personalStats.innerHTML = '<div class="stat-card"><p>NO SCORES YET</p></div>';
            return;
        }
        
        const scores = [];
        querySnapshot.forEach((doc) => {
            scores.push(doc.data());
        });
        
        // Calculate stats
        const bestScore = scores[0].score;
        const totalGames = scores.length;
        const avgScore = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / totalGames);
        
        // Display stats
        personalStats.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">BEST SCORE</div>
                <div class="stat-value">${bestScore.toLocaleString()}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">GAMES PLAYED</div>
                <div class="stat-value">${totalGames}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">AVERAGE SCORE</div>
                <div class="stat-value">${avgScore.toLocaleString()}</div>
            </div>
        `;
        
        // Display score history
        const rows = scores.map((data, index) => {
            const date = new Date(data.createdAt).toLocaleDateString();
            return `
                <div class="table-row ${index === 0 ? 'top-three rank-1' : ''}">
                    <span class="rank-col">${index + 1}</span>
                    <span class="score-col-wide">${data.score.toLocaleString()}</span>
                    <span class="date-col">${date}</span>
                </div>
            `;
        }).join('');
        
        personalLeaderboard.innerHTML = rows;
        
    } catch (error) {
        console.error('Error loading personal leaderboard:', error);
        personalLeaderboard.innerHTML = '<div class="error-state">Failed to load scores</div>';
    }
}

// Helper function for rank display
function getRankDisplay(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
}

// Load all leaderboards for current game
function loadAllLeaderboards() {
    loadGlobalLeaderboard(currentGame);
    loadWeeklyLeaderboard(currentGame);
    if (currentUser) {
        loadPersonalLeaderboard(currentGame);
    }
}

// ============================================
// TAB SWITCHING
// ============================================
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        
        // Update active tab button
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// ============================================
// GAME SELECTION
// ============================================
gameSelect.addEventListener('change', (e) => {
    currentGame = e.target.value;
    loadAllLeaderboards();
});

// ============================================
// TEST SCORE SUBMISSION
// ============================================
submitScoreBtn.addEventListener('click', () => {
    const score = parseInt(testScoreInput.value);
    
    if (!score || score <= 0) {
        alert('Please enter a valid score');
        return;
    }
    
    submitScore(currentGame, score);
    testScoreInput.value = '';
});

// ============================================
// AUTH STATE OBSERVER
// ============================================
onAuthStateChanged(auth, (user) => {
    updateUIForUser(user);
    loadAllLeaderboards();
});

// ============================================
// UPDATE WEEK INFO
// ============================================
function updateWeekInfo() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const options = { month: 'short', day: 'numeric' };
    const weekInfo = document.getElementById('weekInfo');
    if (weekInfo) {
        weekInfo.textContent = `Week of ${monday.toLocaleDateString('en-US', options)} - ${sunday.toLocaleDateString('en-US', options)}, ${now.getFullYear()}`;
    }
}

updateWeekInfo();

// ============================================
// MODAL EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
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

    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            if (modalId) {
                document.getElementById(modalId).style.display = 'none';
            }
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
});

// ============================================
// EXPORT FOR USE IN GAME PAGES
// ============================================
window.submitGameScore = submitScore;
