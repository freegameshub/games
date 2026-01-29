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
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ============================================
// DOM ELEMENTS
// ============================================
const modal = document.getElementById('authModal');
const loginModalBtn = document.getElementById('loginModalBtn');
const closeBtn = document.querySelector('.close');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');
const authError = document.getElementById('authError');
const userSection = document.getElementById('userSection');
const modalTitle = document.getElementById('modalTitle');

// Login elements
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');

// Signup elements
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const signupPasswordConfirm = document.getElementById('signupPasswordConfirm');
const signupBtn = document.getElementById('signupBtn');

// ============================================
// MODAL CONTROLS
// ============================================
function openModal() {
    modal.style.display = 'block';
    clearError();
}

function closeModal() {
    modal.style.display = 'none';
    clearError();
    clearInputs();
}

function showLogin() {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    modalTitle.textContent = 'PLAYER LOGIN';
    clearError();
}

function showSignup() {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    modalTitle.textContent = 'CREATE ACCOUNT';
    clearError();
}

// ============================================
// ERROR HANDLING
// ============================================
function showError(message) {
    authError.textContent = message;
    authError.style.display = 'block';
}

function clearError() {
    authError.textContent = '';
    authError.style.display = 'none';
}

function clearInputs() {
    loginEmail.value = '';
    loginPassword.value = '';
    signupEmail.value = '';
    signupPassword.value = '';
    signupPasswordConfirm.value = '';
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================
async function handleLogin(e) {
    e.preventDefault();
    clearError();
    
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    try {
        loginBtn.textContent = 'LOGGING IN...';
        loginBtn.disabled = true;
        
        await signInWithEmailAndPassword(auth, email, password);
        closeModal();
        clearInputs();
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Login failed';
        if (error.code === 'auth/invalid-credential') {
            errorMessage = 'Invalid email or password';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many attempts. Try again later';
        }
        
        showError(errorMessage);
    } finally {
        loginBtn.textContent = 'LOGIN';
        loginBtn.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    clearError();
    
    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const confirmPassword = signupPasswordConfirm.value;
    
    if (!email || !password || !confirmPassword) {
        showError('Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    try {
        signupBtn.textContent = 'CREATING...';
        signupBtn.disabled = true;
        
        await createUserWithEmailAndPassword(auth, email, password);
        closeModal();
        clearInputs();
    } catch (error) {
        console.error('Signup error:', error);
        
        let errorMessage = 'Signup failed';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Email already in use';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak';
        }
        
        showError(errorMessage);
    } finally {
        signupBtn.textContent = 'CREATE ACCOUNT';
        signupBtn.disabled = false;
    }
}

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
        const userEmail = user.email.split('@')[0]; // Get part before @
        userSection.innerHTML = `
            <div class="user-profile">
                <span class="user-email">PLAYER: ${userEmail.toUpperCase()}</span>
                <button id="logoutBtn" class="pixel-btn">LOGOUT</button>
            </div>
        `;
        
        // Add logout listener
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    } else {
        // User is logged out
        userSection.innerHTML = `
            <button id="loginModalBtn" class="pixel-btn">LOGIN</button>
        `;
        
        // Re-add login modal listener
        document.getElementById('loginModalBtn').addEventListener('click', openModal);
    }
}

// ============================================
// AUTH STATE OBSERVER
// ============================================
onAuthStateChanged(auth, (user) => {
    updateUIForUser(user);
    
    if (user) {
        console.log('User logged in:', user.email);
        // Redirect to games page if on homepage and logged in
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            window.location.href = 'games.html';
        }
    } else {
        console.log('User logged out');
    }
});

// ============================================
// EVENT LISTENERS
// ============================================
// Modal controls
loginModalBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);
showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    showSignup();
});
showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showLogin();
});

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
        } else {
            closeModal(); // For auth modal
        }
    });
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Auth forms
loginBtn.addEventListener('click', handleLogin);
signupBtn.addEventListener('click', handleSignup);

// Enter key support
loginPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin(e);
});
signupPasswordConfirm.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSignup(e);
});

// ============================================
// GAME FUNCTIONALITY (PLACEHOLDER)
// ============================================
// You can add your game loading logic here
document.addEventListener('DOMContentLoaded', () => {
    console.log('Pixel Arcade loaded!');
    
    // START PLAYING button opens signup modal
    const startPlayingBtn = document.getElementById('startPlayingBtn');
    if (startPlayingBtn) {
        startPlayingBtn.addEventListener('click', () => {
            openModal();
            showSignup(); // Show signup form by default
        });
    }
});
