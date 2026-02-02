# BUG FIXES REQUIRED

## 1. Favorites Page - Empty Message Overlap
**Fix**: Update favorites.js line 91-109 to properly hide empty message

## 2. Game Card Buttons Not Clickable
**Issue**: 3D transform creating z-index issues
**Fix**: Add `position: relative; z-index: 1;` to .game-actions buttons

## 3. Login Modal Bug
**Issue**: app.js shows signup instead of login
**Fix**: In app.js, separate loginModal and signupModal functions

## FIXES APPLIED:

### styles.css - Button Z-Index
```css
.game-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    position: relative;
    z-index: 10;
}

.game-actions .pixel-btn,
.game-actions .favorite-btn {
    position: relative;
    z-index: 11;
    pointer-events: auto;
}
```

### app.js - Fix Login/Signup Modal Logic
Change showAuthModal() to have two separate functions:
- showLoginModal()
- showSignupModal()

### favorites.js - Fix Empty State
Line 87-89: Add check to hide empty message when favorites exist
