// ============================================
// PIXEL ARCADE COIN SYSTEM
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    doc,
    getDoc,
    setDoc,
    updateDoc,
    writeBatch,
    increment,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase config (same as other files)
const firebaseConfig = {
    apiKey: "AIzaSyDsCNv0gZ3zvGuyrkb5vdzuMKPqjpb_NE0",
    authDomain: "free-games-hub.firebaseapp.com",
    projectId: "free-games-hub",
    storageBucket: "free-games-hub.firebasestorage.app",
    messagingSenderId: "935587086734",
    appId: "1:935587086734:web:ba7c1d19c4a32f18c124df",
    measurementId: "G-422WG76L3B"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================
// GAME REWARD CONFIGURATIONS
// ============================================
const GAME_REWARDS = {
    'snake': { baseReward: 10, scoreMultiplier: 0.1, maxReward: 500 },
    'space-invaders': { baseReward: 15, scoreMultiplier: 0.15, maxReward: 500 },
    'tetris': { baseReward: 20, scoreMultiplier: 0.2, maxReward: 500 },
    'pong': { baseReward: 5, scoreMultiplier: 0.5, maxReward: 500 },
    'breakout': { baseReward: 15, scoreMultiplier: 0.15, maxReward: 500 },
    'pacman': { baseReward: 20, scoreMultiplier: 0.2, maxReward: 500 }
};

const MAX_SCORES = {
    'snake': 10000,
    'space-invaders': 50000,
    'tetris': 100000,
    'pong': 5,
    'breakout': 20000,
    'pacman': 50000
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getToday() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================
function validateScore(gameId, score) {
    if (score < 0) return false;
    if (!Number.isInteger(score)) return false;
    if (score > MAX_SCORES[gameId]) return false;
    return true;
}

async function checkDailyLimits(userId, gameId) {
    try {
        const today = getToday();
        const limitsRef = doc(db, 'dailyLimits', `${userId}_${today}`);
        const limitsDoc = await getDoc(limitsRef);
        
        if (!limitsDoc.exists()) return { ok: true };
        
        const data = limitsDoc.data();
        const gamesPlayed = data.gamesPlayed?.[gameId] || 0;
        const coinsToday = data.coinsEarnedToday || 0;
        
        if (gamesPlayed >= 10) return { ok: false, reason: 'Max 10 games per type per day' };
        if (coinsToday >= 3000) return { ok: false, reason: 'Max 3000 coins per day reached' };
        
        return { ok: true };
    } catch (error) {
        console.error('Error checking limits:', error);
        return { ok: true }; // Fail open
    }
}

async function checkCooldown(userId, gameId) {
    try {
        const limitsRef = doc(db, 'dailyLimits', `${userId}_${getToday()}`);
        const limitsDoc = await getDoc(limitsRef);
        
        if (!limitsDoc.exists()) return { ok: true };
        
        const lastGameTime = limitsDoc.data().lastGameTime;
        if (!lastGameTime) return { ok: true };
        
        const now = Date.now();
        const lastGame = lastGameTime.toMillis();
        const cooldownMs = 30 * 1000; // 30 seconds
        
        if ((now - lastGame) < cooldownMs) {
            return { ok: false, reason: 'Wait 30 seconds between games' };
        }
        
        return { ok: true };
    } catch (error) {
        console.error('Error checking cooldown:', error);
        return { ok: true };
    }
}

// ============================================
// INITIALIZE USER (WHEN FIRST CREATED)
// ============================================
async function initializeUser(userId, email) {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            await setDoc(userRef, {
                uid: userId,
                email: email,
                username: email.split('@')[0],
                coins: 1000, // Starting coins
                totalCoinsEarned: 0,
                gamesPlayed: 0,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            });
            return 1000;
        }
        
        // Update last login
        await updateDoc(userRef, {
            lastLogin: new Date().toISOString()
        });
        
        return userDoc.data().coins || 0;
    } catch (error) {
        console.error('Error initializing user:', error);
        return 0;
    }
}

// ============================================
// MAIN COIN AWARD FUNCTION
// ============================================
async function awardCoins(userId, gameId, score) {
    const transactionId = generateUUID();
    const timestamp = new Date();
    
    try {
        // 1. Validate score
        if (!validateScore(gameId, score)) {
            return { success: false, reason: 'Invalid score' };
        }
        
        // 2. Check daily limits
        const limitsCheck = await checkDailyLimits(userId, gameId);
        if (!limitsCheck.ok) {
            return { success: false, reason: limitsCheck.reason };
        }
        
        // 3. Check cooldown
        const cooldownCheck = await checkCooldown(userId, gameId);
        if (!cooldownCheck.ok) {
            return { success: false, reason: cooldownCheck.reason };
        }
        
        // 4. Calculate coins
        const gameConfig = GAME_REWARDS[gameId];
        if (!gameConfig) {
            return { success: false, reason: 'Unknown game' };
        }
        
        let coins = gameConfig.baseReward + Math.floor(score * gameConfig.scoreMultiplier);
        coins = Math.min(coins, gameConfig.maxReward);
        coins = Math.max(coins, 0);
        
        // 5. Get current balance
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            return { success: false, reason: 'User not found' };
        }
        
        const currentBalance = userDoc.data().coins || 0;
        const newBalance = currentBalance + coins;
        
        // 6. Batch write (atomic transaction)
        const batch = writeBatch(db);
        
        // Update user
        batch.update(userRef, {
            coins: newBalance,
            totalCoinsEarned: increment(coins),
            gamesPlayed: increment(1)
        });
        
        // Log transaction
        const transactionRef = doc(db, 'coinTransactions', transactionId);
        batch.set(transactionRef, {
            transactionId,
            userId,
            gameId,
            type: 'game_reward',
            amount: coins,
            newBalance,
            metadata: { score },
            timestamp: Timestamp.now(),
            createdAt: timestamp.toISOString()
        });
        
        // Update daily limits
        const limitsRef = doc(db, 'dailyLimits', `${userId}_${getToday()}`);
        batch.set(limitsRef, {
            userId,
            date: getToday(),
            [`gamesPlayed.${gameId}`]: increment(1),
            coinsEarnedToday: increment(coins),
            lastGameTime: Timestamp.now()
        }, { merge: true });
        
        // Commit all changes
        await batch.commit();
        
        return {
            success: true,
            coinsEarned: coins,
            newBalance,
            transactionId
        };
        
    } catch (error) {
        console.error('Error awarding coins:', error);
        return { success: false, reason: 'Server error' };
    }
}

// ============================================
// GET USER BALANCE
// ============================================
async function getUserBalance(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            return 0;
        }
        
        return userDoc.data().coins || 0;
    } catch (error) {
        console.error('Error getting balance:', error);
        return 0;
    }
}

// ============================================
// EXPORT FUNCTIONS
// ============================================
window.CoinSystem = {
    awardCoins,
    getUserBalance,
    initializeUser,
    validateScore
};

export { awardCoins, getUserBalance, initializeUser, validateScore };
