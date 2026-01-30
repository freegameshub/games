# 🏆 Leaderboard System Documentation

## Overview

Your Pixel Arcade now has a complete leaderboard system with:
- **Global Leaderboards** - All-time top 100 scores per game
- **Weekly Leaderboards** - Top 100 scores for the current week
- **Personal Best** - Individual player statistics and score history

## 🔥 Firebase Setup Required

Before the leaderboards work, you need to enable Firestore:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: "free-games-hub"
3. Click **"Firestore Database"** in the left sidebar
4. Click **"Create database"**
5. Choose **"Start in production mode"**
6. Select a location (choose closest to your users)
7. Click **"Enable"**

### Security Rules

After enabling Firestore, set up these security rules:

1. In Firestore, click the **"Rules"** tab
2. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Scores collection - anyone can read, authenticated users can write
    match /scores/{scoreId} {
      allow read: if true;
      allow create: if request.auth != null 
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.score is number
        && request.resource.data.gameId is string;
      allow update, delete: if false; // Scores can't be modified
    }
    
    // Favorites collection - users can only read/write their own
    match /favorites/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"**

## 📊 Features

### Leaderboard Page (leaderboard.html)

**Three Tabs:**
1. **Global** - All-time best scores (top 100)
2. **Weekly** - Best scores from Monday to Sunday (top 100)
3. **Personal Best** - Your score history and stats

**Game Selector:**
- Dropdown to switch between different games
- Each game has its own separate leaderboards

**Personal Stats (when logged in):**
- Best Score
- Games Played
- Average Score

**Visual Highlights:**
- 🥇 Gold medal for 1st place
- 🥈 Silver medal for 2nd place
- 🥉 Bronze medal for 3rd place
- Top 3 get special golden highlighting
- Current user's scores are highlighted in magenta

### Testing the System

There's a test section on the leaderboard page:
- Enter any score
- Click "Submit Score"
- Watch it appear in the leaderboards

**Remove this section in production** by deleting this from `leaderboard.html`:
```html
<!-- Submit Score Section (for testing) -->
<div class="submit-score-section" id="submitScoreSection">
...
</div>
```

## 🎮 Integrating Scores Into Your Games

### Method 1: Simple Integration (Recommended)

Add this to your game HTML file:

```html
<script type="module" src="game-score-helper.js"></script>

<script type="module">
  // At the end of your game
  async function gameOver(finalScore) {
    const success = await window.PixelArcade.submitScore('space-invaders', finalScore);
    
    if (success) {
      alert(`Score ${finalScore} submitted to leaderboard!`);
    } else {
      alert('Please log in to save your score!');
    }
    
    // Redirect to leaderboard
    window.location.href = `leaderboard.html?game=space-invaders`;
  }
</script>
```

### Method 2: Check Login First

```javascript
import './game-score-helper.js';

async function gameOver(finalScore) {
  // Check if user is logged in
  const isLoggedIn = await window.PixelArcade.isUserLoggedIn();
  
  if (!isLoggedIn) {
    alert('Log in to save your score!');
    window.location.href = 'index.html';
    return;
  }
  
  // Get user info
  const user = await window.PixelArcade.getCurrentUser();
  console.log(`Player: ${user.username}`);
  
  // Submit score
  const success = await window.PixelArcade.submitScore('space-invaders', finalScore);
  
  if (success) {
    // Show score and redirect
    alert(`Great job ${user.username}! Score: ${finalScore}`);
    window.location.href = 'leaderboard.html?game=space-invaders';
  }
}
```

### Game IDs

Use these exact IDs for consistency:
- `'space-invaders'` - Space Invaders
- `'tetris'` - Tetris Remix
- `'snake'` - Snake Runner
- `'pong'` - Pong Battle
- `'breakout'` - Breakout
- `'pacman'` - Pac-Man Clone

## 📈 Data Structure

### Scores Collection

Each score document contains:
```javascript
{
  gameId: 'space-invaders',      // string
  userId: 'abc123...',            // Firebase Auth UID
  username: 'player123',          // Display name
  score: 12500,                   // number
  timestamp: Timestamp,           // Firestore timestamp
  createdAt: '2026-01-30T...'    // ISO date string
}
```

### Firestore Indexes

Firestore will automatically suggest indexes when needed. If you see an error like "requires an index", just click the link in the error message and Firebase will create it for you.

## 🎯 Free Tier Limits

With Firebase's free tier:
- **1 GB storage** = ~10 million score entries
- **50,000 reads/day** = 50,000 leaderboard views
- **20,000 writes/day** = 20,000 score submissions

This is MORE than enough for a growing game site!

## 🔒 Security Features

- Users can only submit scores when logged in
- Score submissions include the user's ID from authentication
- Users cannot modify or delete submitted scores
- Firestore rules prevent tampering
- All scores are timestamped

## 🎨 Customization

### Change Leaderboard Size

In `leaderboard.js`, modify the `limit()` value:

```javascript
// Show top 50 instead of 100
limit(50)
```

### Add Monthly Leaderboards

Add a new tab and query:

```javascript
// Get start of current month
const monthStart = new Date();
monthStart.setDate(1);
monthStart.setHours(0, 0, 0, 0);

const q = query(
  collection(db, 'scores'),
  where('gameId', '==', gameId),
  where('timestamp', '>=', Timestamp.fromDate(monthStart)),
  orderBy('timestamp', 'desc'),
  orderBy('score', 'desc'),
  limit(100)
);
```

### Style Changes

Edit `styles.css`:
- `.table-row.top-three` - Change top 3 styling
- `.rank-col` - Modify rank display colors
- `.leaderboard-content` - Adjust container appearance

## 🚀 Next Steps

1. Enable Firestore in Firebase Console
2. Set up security rules
3. Upload all new files to GitHub
4. Test score submission
5. Create your first game and integrate scores
6. Remove the test section from leaderboard.html

## 📝 Files Added

- `leaderboard.html` - Leaderboard page
- `leaderboard.js` - Leaderboard logic
- `game-score-helper.js` - Helper for game integration
- `LEADERBOARD.md` - This documentation

Enjoy your new leaderboard system! 🎮🏆
