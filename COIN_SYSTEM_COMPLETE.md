# PIXEL ARCADE COIN SYSTEM - COMPLETE SPECIFICATION

## 1. SYSTEM OVERVIEW

### Architecture
```
Frontend (JavaScript)
├── Coin Display (Header)
├── Game Logic (awards coins)
├── Coin Transaction UI
└── Leaderboard with coins

Firebase Backend
├── users collection (coin balances)
├── coinTransactions collection (history)
├── scores collection (with coin rewards)
└── dailyLimits collection (anti-abuse)
```

### Data Flow
1. User plays game → scores points
2. Game ends → calculate coin reward
3. Submit to Firebase with transaction ID
4. Server validates score (basic checks)
5. Award coins + log transaction
6. Update user balance
7. Show UI feedback

---

## 2. COIN SYSTEM DESIGN (V1)

### Starting Balance
- **New users**: 1000 coins
- **Purpose**: Enough to feel rich, explore features

### Earning Coins

**Base Rewards (per game):**
```javascript
{
  'snake': { baseReward: 10, scoreMultiplier: 0.1 },
  'space-invaders': { baseReward: 15, scoreMultiplier: 0.15 },
  'tetris': { baseReward: 20, scoreMultiplier: 0.2 },
  'pong': { baseReward: 5, scoreMultiplier: 0.5 },
  'breakout': { baseReward: 15, scoreMultiplier: 0.15 },
  'pacman': { baseReward: 20, scoreMultiplier: 0.2 }
}
```

**Formula:**
```
coins = baseReward + (score * scoreMultiplier)
Max per game: 500 coins
```

**Bonuses:**
- **Daily login**: +50 coins (once per day)
- **First game of day**: +100 coins bonus
- **Personal best**: +50 coins extra
- **Top 10 leaderboard**: +200 coins (weekly)

### Limits (Anti-Farming)

**Daily Caps:**
- Max 10 scored games per game type per day
- Max 3000 coins earned per day from gameplay
- Bonuses don't count toward cap

**Cooldowns:**
- 30 seconds between game submissions (same game)
- Prevents rapid-fire farming

### Inflation Control
- Daily caps prevent unlimited earning
- Score validation rejects impossibly high scores
- Transaction logging catches duplicates
- Future: diminishing returns after X games/day

---

## 3. DATABASE STRUCTURE

### Users Collection
```javascript
{
  uid: "firebase-user-id",
  email: "player@example.com",
  username: "player123",
  coins: 1250,
  totalCoinsEarned: 5000,
  gamesPlayed: 47,
  createdAt: "2026-02-02T...",
  lastLogin: "2026-02-02T...",
  dailyLoginStreak: 5
}
```

### Coin Transactions Collection
```javascript
{
  transactionId: "uuid-v4-here",
  userId: "firebase-user-id",
  gameId: "snake",
  type: "game_reward" | "daily_bonus" | "achievement",
  amount: 125,
  newBalance: 1375,
  metadata: {
    score: 1500,
    reason: "Game completion"
  },
  timestamp: Firestore.Timestamp,
  createdAt: "2026-02-02T..."
}
```

### Scores Collection (Enhanced)
```javascript
{
  gameId: "snake",
  userId: "firebase-user-id",
  username: "player123",
  score: 1500,
  coinsEarned: 125,
  transactionId: "uuid-linked-to-transaction",
  timestamp: Firestore.Timestamp,
  createdAt: "2026-02-02T...",
  validated: true
}
```

### Daily Limits Collection
```javascript
{
  userId: "firebase-user-id",
  date: "2026-02-02",
  gamesPlayed: {
    snake: 5,
    tetris: 3,
    ...
  },
  coinsEarnedToday: 1200,
  lastGameTime: Firestore.Timestamp
}
```

---

## 4. CORE LOGIC

### Award Coins Function
```javascript
async function awardCoins(userId, gameId, score) {
  const transactionId = generateUUID();
  const timestamp = new Date();
  
  // 1. Check daily limits
  const limitsOk = await checkDailyLimits(userId, gameId);
  if (!limitsOk) {
    return { success: false, reason: 'daily_limit_reached' };
  }
  
  // 2. Check cooldown (30 seconds)
  const cooldownOk = await checkCooldown(userId, gameId);
  if (!cooldownOk) {
    return { success: false, reason: 'cooldown_active' };
  }
  
  // 3. Validate score (basic checks)
  const validScore = validateScore(gameId, score);
  if (!validScore) {
    return { success: false, reason: 'invalid_score' };
  }
  
  // 4. Calculate coins
  const gameConfig = GAME_REWARDS[gameId];
  let coins = gameConfig.baseReward + (score * gameConfig.scoreMultiplier);
  coins = Math.min(coins, 500); // Cap per game
  coins = Math.floor(coins);
  
  // 5. Check for bonuses
  const isPersonalBest = await checkPersonalBest(userId, gameId, score);
  if (isPersonalBest) coins += 50;
  
  const isFirstGameToday = await checkFirstGameToday(userId);
  if (isFirstGameToday) coins += 100;
  
  // 6. Get current balance
  const userDoc = await getDoc(doc(db, 'users', userId));
  const currentBalance = userDoc.data().coins || 1000;
  const newBalance = currentBalance + coins;
  
  // 7. Create transaction (atomic)
  const batch = writeBatch(db);
  
  // Update user balance
  batch.update(doc(db, 'users', userId), {
    coins: newBalance,
    totalCoinsEarned: increment(coins),
    gamesPlayed: increment(1)
  });
  
  // Log transaction
  batch.set(doc(db, 'coinTransactions', transactionId), {
    transactionId,
    userId,
    gameId,
    type: 'game_reward',
    amount: coins,
    newBalance,
    metadata: { score, bonuses: [] },
    timestamp: Timestamp.now(),
    createdAt: timestamp.toISOString()
  });
  
  // Update daily limits
  batch.set(doc(db, 'dailyLimits', `${userId}_${getToday()}`), {
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
}
```

### Check Daily Limits
```javascript
async function checkDailyLimits(userId, gameId) {
  const today = getToday();
  const limitsDoc = await getDoc(doc(db, 'dailyLimits', `${userId}_${today}`));
  
  if (!limitsDoc.exists()) return true;
  
  const data = limitsDoc.data();
  const gamesPlayed = data.gamesPlayed?.[gameId] || 0;
  const coinsToday = data.coinsEarnedToday || 0;
  
  if (gamesPlayed >= 10) return false; // Max 10 games per type
  if (coinsToday >= 3000) return false; // Max 3000 coins per day
  
  return true;
}
```

### Prevent Duplicates
```javascript
async function checkCooldown(userId, gameId) {
  const limitsDoc = await getDoc(doc(db, 'dailyLimits', `${userId}_${getToday()}`));
  
  if (!limitsDoc.exists()) return true;
  
  const lastGameTime = limitsDoc.data().lastGameTime;
  if (!lastGameTime) return true;
  
  const now = Date.now();
  const lastGame = lastGameTime.toMillis();
  const cooldownMs = 30 * 1000; // 30 seconds
  
  return (now - lastGame) >= cooldownMs;
}
```

### Score Validation
```javascript
function validateScore(gameId, score) {
  const MAX_SCORES = {
    'snake': 10000,
    'space-invaders': 50000,
    'tetris': 100000,
    'pong': 5,
    'breakout': 20000,
    'pacman': 50000
  };
  
  if (score < 0) return false;
  if (score > MAX_SCORES[gameId]) return false;
  if (!Number.isInteger(score)) return false;
  
  return true;
}
```

---

## 5. UI FEATURES

### Coin Display (Header)
```html
<!-- In site header -->
<div class="coin-display">
  <span class="coin-icon">🪙</span>
  <span class="coin-amount" id="coinBalance">1000</span>
</div>
```

**CSS:**
```css
.coin-display {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.3));
  border: 2px solid #ffd700;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
}

.coin-icon {
  font-size: 24px;
  animation: coinSpin 3s infinite;
}

.coin-amount {
  font-family: 'Press Start 2P', cursive;
  font-size: 16px;
  color: #ffd700;
  text-shadow: 0 0 10px #ffd700;
}

@keyframes coinSpin {
  0%, 100% { transform: rotateY(0deg); }
  50% { transform: rotateY(180deg); }
}
```

### Game End Reward UI
```html
<!-- Show after game ends -->
<div class="coin-reward-popup">
  <div class="coin-burst">💰</div>
  <h3>+${coinsEarned} COINS!</h3>
  <p>New Balance: ${newBalance}</p>
  <div class="bonus-list">
    <!-- Show any bonuses earned -->
  </div>
</div>
```

### Leaderboard with Coins
```html
<!-- Enhanced leaderboard row -->
<div class="table-row">
  <span class="rank-col">🥇</span>
  <span class="player-col">Player123</span>
  <span class="score-col">15,000</span>
  <span class="coins-col">🪙 250</span>
</div>
```

---

## 6. ANTI-ABUSE (LIGHTWEIGHT)

### Score Validation
- Max score per game (reject impossible scores)
- Integer-only scores
- Positive numbers only
- Compare to historical data (flag >3x average)

### Rate Limits
- 30-second cooldown between games
- 10 games per type per day
- 3000 coins max per day

### Replay Protection
- Transaction IDs (UUIDs) prevent duplicates
- Timestamp checking
- Check last submission time

### Future Security
- Hash game state + score client-side
- Server-side score verification
- IP-based rate limiting
- Pattern detection (bot behavior)
- Manual review flags

---

## 7. FUTURE EXTENSIONS

### Tournaments (Phase 2)
```javascript
// Entry fee with coins
{
  tournamentId: "weekly-snake-001",
  entryFee: 100,
  prizePool: 5000,
  players: [],
  status: "open" | "active" | "complete"
}
```

### Cosmetics Shop (Phase 3)
```javascript
{
  itemId: "neon-snake-skin",
  name: "Neon Snake Skin",
  price: 500,
  type: "skin",
  gameId: "snake"
}
```

### VIP Subscription (Phase 4)
```javascript
// Monthly subscription
{
  tier: "VIP",
  benefits: {
    coinsMultiplier: 1.5,
    exclusiveSkins: true,
    noAds: true,
    dailyBonus: 200
  },
  price: "$4.99/month"
}
```

### Coin Packages (Monetization)
```javascript
{
  package: "starter",
  coins: 5000,
  price: 4.99,
  bonus: 500 // first purchase bonus
}
```

### Leaderboard Prizes
- Weekly: Top 10 get 500 coins
- Monthly: Top 3 get exclusive skins
- Seasonal: Grand prize tournaments

---

## IMPLEMENTATION PRIORITY

**Phase 1 (Now):**
1. Add coin balance to users
2. Award coins after games
3. Display coins in header
4. Show reward popup
5. Basic daily limits

**Phase 2 (Week 2):**
1. Enhanced leaderboards with coins
2. Achievement system
3. Daily challenges

**Phase 3 (Month 1):**
1. Cosmetics shop
2. Skin system
3. Tournament framework

**Phase 4 (Month 2):**
1. Real money purchases
2. VIP subscriptions
3. Advanced analytics

---

## GAME REWARD CONFIGS

```javascript
const GAME_REWARDS = {
  'snake': {
    baseReward: 10,
    scoreMultiplier: 0.1,
    maxReward: 500,
    difficulty: 'medium'
  },
  'space-invaders': {
    baseReward: 15,
    scoreMultiplier: 0.15,
    maxReward: 500,
    difficulty: 'hard'
  },
  'tetris': {
    baseReward: 20,
    scoreMultiplier: 0.2,
    maxReward: 500,
    difficulty: 'medium'
  },
  'pong': {
    baseReward: 5,
    scoreMultiplier: 0.5,
    maxReward: 500,
    difficulty: 'easy'
  },
  'breakout': {
    baseReward: 15,
    scoreMultiplier: 0.15,
    maxReward: 500,
    difficulty: 'medium'
  },
  'pacman': {
    baseReward: 20,
    scoreMultiplier: 0.2,
    maxReward: 500,
    difficulty: 'hard'
  }
};
```

