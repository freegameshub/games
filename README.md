# 🎮 Pixel Arcade - Free Games Hub

A retro-inspired, arcade-style gaming website with Firebase authentication. Built with vanilla HTML, CSS, and JavaScript.

## 🚀 Setup Instructions

### 1. Configure Firebase

Open `app.js` and replace the Firebase configuration with your actual values from Firebase Console:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

**To find these values:**
1. Go to Firebase Console (https://console.firebase.google.com)
2. Click your project
3. Click the gear icon ⚙️ next to "Project Overview" → "Project settings"
4. Scroll down to "Your apps" section
5. Copy each value from the config object shown there

### 2. Deploy to GitHub Pages

#### Upload your files:
```bash
# In your local repository folder
git add .
git commit -m "Initial commit - Pixel Arcade"
git push origin main
```

#### If this is your first time using Git with this repo:
```bash
# Initialize git (if not already done)
git init

# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Add all files
git add .

# Commit
git commit -m "Initial commit - Pixel Arcade"

# Push to GitHub
git branch -M main
git push -u origin main
```

Your site will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### 3. Authorize Your Domain in Firebase

Important: Firebase needs to know which domains can use authentication.

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your GitHub Pages domain: `YOUR_USERNAME.github.io`
3. Click "Add domain"

## 📁 File Structure

```
pixel-arcade/
├── index.html          # Main HTML structure
├── styles.css          # Retro arcade styling with neon effects
├── app.js             # Firebase auth + JavaScript logic
└── README.md          # This file
```

## ✨ Features

### Current Features:
- ✅ Firebase email/password authentication
- ✅ Login/Signup modal system
- ✅ User session management
- ✅ Retro arcade aesthetic with neon effects
- ✅ Responsive design
- ✅ Animated UI elements
- ✅ Game card grid layout

### Authentication Features:
- Email/password signup
- Login with validation
- Logout functionality
- Persistent sessions (users stay logged in)
- Error handling for common auth issues
- User email display when logged in

## 🎨 Design Elements

- **Fonts**: Press Start 2P (pixelated) + VT323 (monospace)
- **Color Scheme**: Neon cyan, magenta, yellow on dark backgrounds
- **Animations**: Glitch effects, pulsing, sliding, and fading
- **Style**: Retro arcade/pixel art aesthetic

## 🎮 Adding Games

To add games to your site:

1. Create your game in a separate HTML file (e.g., `games/snake.html`)
2. Update the game card in `index.html`:

```html
<div class="game-card">
    <div class="game-thumbnail">
        <!-- Add a screenshot or preview -->
        <img src="path/to/screenshot.png" alt="Game preview">
    </div>
    <div class="game-info">
        <h3>Your Game Name</h3>
        <p class="game-category">CATEGORY</p>
    </div>
    <button class="pixel-btn small" onclick="location.href='games/yourgame.html'">PLAY</button>
</div>
```

3. In your game files, you can access the logged-in user:

```javascript
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const auth = getAuth();
const user = auth.currentUser;

if (user) {
    console.log('Player email:', user.email);
    // Save high scores, game progress, etc.
}
```

## 🔧 Customization

### Change Colors:
Edit the CSS variables in `styles.css`:
```css
:root {
    --neon-cyan: #00ffff;
    --neon-magenta: #ff00ff;
    --neon-yellow: #ffff00;
    --dark-bg: #0a0a0a;
}
```

### Add More Games:
Copy the `.game-card` div in `index.html` and update the content.

### Modify Layout:
The site uses CSS Grid - adjust in `styles.css`:
```css
.games-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}
```

## 🔐 Security Notes

- Never commit your Firebase config to public repositories if it contains sensitive keys
- For production, set up Firebase Security Rules
- Consider adding Firebase Firestore to store game data/scores
- Add email verification for additional security

## 📱 Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

## 🆘 Troubleshooting

**Authentication not working?**
- Check Firebase config is correct
- Verify domain is authorized in Firebase Console
- Check browser console for errors

**Site not loading on GitHub Pages?**
- Make sure files are in the root directory or you've configured the source folder
- Check that GitHub Pages is enabled in repository settings
- Wait a few minutes for deployment

**Styling looks broken?**
- Ensure `styles.css` is in the same directory as `index.html`
- Check browser console for 404 errors
- Clear browser cache

## 📝 Next Steps

1. ✅ Set up Firebase config
2. ✅ Deploy to GitHub Pages
3. ✅ Test authentication
4. 🎮 Build your first game!
5. 📊 Add Firestore for high scores
6. 🎨 Customize the design
7. 🌟 Add more features (leaderboards, achievements, etc.)

## 🎉 Have Fun!

Start building awesome browser games and share them with the world!

---

Need help? Check out:
- [Firebase Docs](https://firebase.google.com/docs)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [MDN Web Docs](https://developer.mozilla.org/)
