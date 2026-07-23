const score = JSON.parse(localStorage.getItem('score')) || {
  wins: 0,
  loses: 0,
  ties: 0,
  streak: 0,
  xp: 0,
  level: 1,
  bestStreak: 0,
  pickCounts: { '👊': 0, '✋': 0, '✌️': 0, '🦎': 0, '🖖': 0 }
};

// Player move history for pattern recognition (last 5 moves)
let playerMoveHistory = [];
// Track round outcomes for adaptive AI
let roundOutcomes = [];
// Timer variables
let timerInterval = null;
let timerActive = false;
// Boss Rush variables
let currentBoss = 0;
let bossHealth = 3;
// Local 2P variables
let local2PMode = false;
let player1Move = null;
let player2Move = null;
// Game mode
let gameMode = 'classic';

// Sound Manager using Web Audio API
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.initialized = false;
  }

  init() {
    if (!this.initialized) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    }
  }

  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.initialized) this.init();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playClick() {
    this.playTone(800, 0.1, 'sine', 0.2);
  }

  playTick() {
    this.playTone(1200, 0.05, 'square', 0.15);
  }

  playImpact() {
    this.playTone(150, 0.3, 'sawtooth', 0.4);
    setTimeout(() => this.playTone(100, 0.2, 'sawtooth', 0.3), 50);
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.3), i * 100);
    });
  }

  playLose() {
    this.playTone(200, 0.5, 'sawtooth', 0.3);
    setTimeout(() => this.playTone(150, 0.5, 'sawtooth', 0.2), 200);
  }

  playLevelUp() {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.3), i * 80);
    });
  }

  playAchievement() {
    const notes = [783.99, 1046.50, 1318.51];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.25, 'sine', 0.35), i * 120);
    });
  }
}

const soundManager = new SoundManager();

// Initialize streak display on load
document.addEventListener('DOMContentLoaded', () => {
  updateStreakDisplay();
  updateXPDisplay();
  setupTimerToggle();
  setupModeSelector();
  setupKeyboardControls();
  setupParticleCanvas();
  loadAchievements();
  registerServiceWorker();
  // Start timer if enabled on page load
  if (document.getElementById('timerToggle').checked) {
    startTimer();
  }
});

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  }
}

function setupTimerToggle() {
  const timerToggle = document.getElementById('timerToggle');
  timerToggle.addEventListener('change', (e) => {
    const timerDisplay = document.getElementById('timerDisplay');
    timerDisplay.style.display = e.target.checked ? 'flex' : 'none';
    if (e.target.checked && !timerActive) {
      startTimer();
    } else if (!e.target.checked && timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerActive = false;
    }
  });
}

function setupModeSelector() {
  const modeSelect = document.getElementById('gameMode');
  modeSelect.addEventListener('change', (e) => {
    gameMode = e.target.value;
    const classicPlay = document.getElementById('playgame');
    const rpslsPlay = document.getElementById('rpslsPlaygame');
    const local2pControls = document.getElementById('local2pControls');
    const bossInfo = document.getElementById('bossInfo');
    const computerLabel = document.querySelector('.computer-slot .arena-label');
    
    // Hide all mode-specific elements
    classicPlay.style.display = 'none';
    rpslsPlay.style.display = 'none';
    local2pControls.style.display = 'none';
    bossInfo.style.display = 'none';
    
    switch(gameMode) {
      case 'classic':
        classicPlay.style.display = 'flex';
        computerLabel.textContent = 'Computer';
        local2PMode = false;
        break;
      case 'rpsls':
        rpslsPlay.style.display = 'flex';
        computerLabel.textContent = 'Computer';
        local2PMode = false;
        break;
      case 'bossrush':
        classicPlay.style.display = 'flex';
        computerLabel.textContent = 'Boss';
        bossInfo.style.display = 'flex';
        local2PMode = false;
        currentBoss = 0;
        bossHealth = 3;
        updateBossDisplay();
        break;
      case 'local2p':
        classicPlay.style.display = 'flex';
        local2pControls.style.display = 'block';
        computerLabel.textContent = 'Player 2';
        local2PMode = true;
        break;
    }
  });
}

function setupKeyboardControls() {
  document.addEventListener('keydown', (e) => {
    if (local2PMode) {
      // Local 2P mode: Player 1 (A/S/D), Player 2 (J/K/L)
      switch(e.key.toLowerCase()) {
        case 'a': handleLocal2PMove(1, '👊'); break;
        case 's': handleLocal2PMove(1, '✋'); break;
        case 'd': handleLocal2PMove(1, '✌️'); break;
        case 'j': handleLocal2PMove(2, '👊'); break;
        case 'k': handleLocal2PMove(2, '✋'); break;
        case 'l': handleLocal2PMove(2, '✌️'); break;
      }
    } else {
      // Single player mode: 1/R for Rock, 2/P for Paper, 3/S for Scissors, Space to restart
      switch(e.key.toLowerCase()) {
        case '1':
        case 'r':
          playGame('👊');
          soundManager.playClick();
          break;
        case '2':
        case 'p':
          playGame('✋');
          soundManager.playClick();
          break;
        case '3':
        case 's':
          playGame('✌️');
          soundManager.playClick();
          break;
        case ' ':
          e.preventDefault();
          if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            timerActive = false;
          }
          startTimer();
          break;
      }
    }
  });
}

function handleLocal2PMove(player, move) {
  soundManager.playClick();
  if (player === 1) {
    player1Move = move;
  } else {
    player2Move = move;
  }
  
  if (player1Move && player2Move) {
    resolveLocal2PGame();
  }
}

function resolveLocal2PGame() {
  const playerIcon = document.getElementById('playerIcon');
  const computerIcon = document.getElementById('computerIcon');
  const playerSlot = document.querySelector('.player-slot');
  const computerSlot = document.querySelector('.computer-slot');
  
  // Reset effects
  playerSlot.classList.remove('winner', 'loser', 'tie');
  computerSlot.classList.remove('winner', 'loser', 'tie');
  
  // Show moves
  playerIcon.textContent = player1Move;
  computerIcon.textContent = player2Move;
  playerIcon.classList.add('reveal');
  computerIcon.classList.add('reveal');
  
  // Determine result
  let result = '';
  if (player1Move === player2Move) {
    result = 'Tie';
    playerSlot.classList.add('tie');
    computerSlot.classList.add('tie');
  } else if (
    (player1Move === '👊' && player2Move === '✌️') ||
    (player1Move === '✋' && player2Move === '👊') ||
    (player1Move === '✌️' && player2Move === '✋')
  ) {
    result = 'Player 1 Wins';
    playerSlot.classList.add('winner');
    computerSlot.classList.add('loser');
  } else {
    result = 'Player 2 Wins';
    playerSlot.classList.add('loser');
    computerSlot.classList.add('winner');
  }
  
  // Show modal
  setTimeout(() => {
    document.getElementById('modalText').textContent = `Player 1: ${player1Move} vs Player 2: ${player2Move}\n${result}`;
    document.getElementById('resultModal').classList.add('show');
  }, 400);
  
  // Reset moves
  player1Move = null;
  player2Move = null;
}

function updateStreakDisplay() {
  const streakCount = document.getElementById('streakCount');
  const streakMultiplier = document.getElementById('streakMultiplier');
  
  streakCount.textContent = score.streak;
  
  if (score.streak >= 3) {
    const multiplier = Math.min(Math.floor(score.streak / 3) + 1, 5);
    streakMultiplier.textContent = `(${multiplier}x multiplier)`;
    streakMultiplier.classList.add('visible');
  } else {
    streakMultiplier.textContent = '';
    streakMultiplier.classList.remove('visible');
  }
}

function updateXPDisplay() {
  const levelCount = document.getElementById('levelCount');
  const xpFill = document.getElementById('xpFill');
  const xpText = document.getElementById('xpText');
  
  levelCount.textContent = score.level;
  
  const xpForNextLevel = score.level * 100;
  const xpProgress = (score.xp % xpForNextLevel) / xpForNextLevel * 100;
  
  xpFill.style.width = `${xpProgress}%`;
  xpText.textContent = `${score.xp % xpForNextLevel} / ${xpForNextLevel} XP`;
}

function addXP(amount) {
  score.xp += amount;
  const xpForNextLevel = score.level * 100;
  
  if (score.xp >= xpForNextLevel) {
    score.level++;
    soundManager.playLevelUp();
    showLevelUpNotification();
  }
  
  updateXPDisplay();
  localStorage.setItem('score', JSON.stringify(score));
}

function showLevelUpNotification() {
  // Could add a visual notification here
  console.log(`Level Up! Now level ${score.level}`);
}

// Particle System
let particleCanvas, particleCtx;
let particles = [];

function setupParticleCanvas() {
  particleCanvas = document.getElementById('particleCanvas');
  particleCtx = particleCanvas.getContext('2d');
  resizeParticleCanvas();
  window.addEventListener('resize', resizeParticleCanvas);
  animateParticles();
}

function resizeParticleCanvas() {
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
}

function createParticles(type, x, y) {
  const colors = {
    win: ['#00ff88', '#00ff00', '#88ff00', '#ffff00'],
    lose: ['#ff4444', '#ff0000', '#ff8800', '#ff4400'],
    tie: ['#ffffff', '#cccccc', '#aaaaaa', '#888888']
  };
  
  const particleColors = colors[type] || colors.tie;
  
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      life: 1,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      size: Math.random() * 8 + 4
    });
  }
}

function animateParticles() {
  particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  
  particles = particles.filter(p => p.life > 0);
  
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.3; // gravity
    p.life -= 0.02;
    p.size *= 0.98;
    
    particleCtx.beginPath();
    particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    particleCtx.fillStyle = p.color;
    particleCtx.globalAlpha = p.life;
    particleCtx.fill();
    particleCtx.globalAlpha = 1;
  });
  
  requestAnimationFrame(animateParticles);
}

// Achievement System
const achievements = [
  { id: 'first_win', name: 'First Victory', desc: 'Win your first game', icon: '🏆', condition: () => score.wins >= 1 },
  { id: 'streak_3', name: 'Hot Streak', desc: 'Win 3 games in a row', icon: '🔥', condition: () => score.streak >= 3 },
  { id: 'streak_10', name: 'Unstoppable', desc: 'Win 10 games in a row', icon: '⚡', condition: () => score.streak >= 10 },
  { id: 'wins_10', name: 'Dedicated', desc: 'Win 10 total games', icon: '🎯', condition: () => score.wins >= 10 },
  { id: 'wins_50', name: 'Veteran', desc: 'Win 50 total games', icon: '🎖️', condition: () => score.wins >= 50 },
  { id: 'level_5', name: 'Rising Star', desc: 'Reach level 5', icon: '⭐', condition: () => score.level >= 5 },
  { id: 'level_10', name: 'Champion', desc: 'Reach level 10', icon: '👑', condition: () => score.level >= 10 },
  { id: 'balanced', name: 'Balanced Player', desc: 'Play each move 10+ times', icon: '⚖️', condition: () => score.pickCounts['👊'] >= 10 && score.pickCounts['✋'] >= 10 && score.pickCounts['✌️'] >= 10 },
  { id: 'boss_killer', name: 'Boss Slayer', desc: 'Defeat a boss in Boss Rush', icon: '💀', condition: () => currentBoss > 0 },
  { id: 'speed_demon', name: 'Speed Demon', desc: 'Win with timer enabled', icon: '⏱️', condition: () => false } // Special condition
];

let unlockedAchievements = JSON.parse(localStorage.getItem('achievements')) || [];

function loadAchievements() {
  renderAchievements();
}

function checkAchievements() {
  achievements.forEach(achievement => {
    if (!unlockedAchievements.includes(achievement.id) && achievement.condition()) {
      unlockAchievement(achievement);
    }
  });
}

function unlockAchievement(achievement) {
  unlockedAchievements.push(achievement.id);
  localStorage.setItem('achievements', JSON.stringify(unlockedAchievements));
  soundManager.playAchievement();
  showAchievementNotification(achievement);
  renderAchievements();
}

function showAchievementNotification(achievement) {
  // Could add a toast notification here
  console.log(`Achievement Unlocked: ${achievement.name}`);
}

function renderAchievements() {
  const grid = document.getElementById('achievementsGrid');
  grid.innerHTML = '';
  
  achievements.forEach(achievement => {
    const isUnlocked = unlockedAchievements.includes(achievement.id);
    const item = document.createElement('div');
    item.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
    item.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-name">${achievement.name}</div>
      <div class="achievement-desc">${achievement.desc}</div>
    `;
    grid.appendChild(item);
  });
}

// Leaderboard System
function getLeaderboard() {
  return JSON.parse(localStorage.getItem('leaderboard')) || [];
}

function saveToLeaderboard(playerName, scoreValue) {
  const leaderboard = getLeaderboard();
  leaderboard.push({
    name: playerName,
    score: scoreValue,
    date: new Date().toISOString()
  });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard.splice(10); // Keep top 10
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

function renderLeaderboard() {
  const content = document.getElementById('leaderboardContent');
  const leaderboard = getLeaderboard();
  
  if (leaderboard.length === 0) {
    content.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6);">No scores yet. Be the first!</p>';
    return;
  }
  
  content.innerHTML = leaderboard.map((entry, index) => `
    <div class="leaderboard-entry">
      <span class="leaderboard-rank">${index + 1}</span>
      <span class="leaderboard-name">${entry.name}</span>
      <span class="leaderboard-score">${entry.score}</span>
    </div>
  `).join('');
}

// Boss System
const bosses = [
  { name: 'Pattern Master', health: 3, behavior: 'aggressive' },
  { name: 'Time Warden', health: 3, behavior: 'freeze' },
  { name: 'Mind Reader', health: 3, behavior: 'adaptive' }
];

function updateBossDisplay() {
  const bossName = document.getElementById('bossName');
  const bossHealth = document.getElementById('bossHealth');
  
  if (currentBoss < bosses.length) {
    bossName.textContent = bosses[currentBoss].name;
    bossHealth.textContent = '❤️'.repeat(bossHealth);
  } else {
    bossName.textContent = 'All Bosses Defeated!';
    bossHealth.textContent = '🏆';
  }
}

function handleBossResult(result) {
  if (gameMode !== 'bossrush') return;
  
  if (result === 'You win.') {
    bossHealth--;
    if (bossHealth <= 0) {
      currentBoss++;
      bossHealth = 3;
      if (currentBoss >= bosses.length) {
        // All bosses defeated
        unlockAchievement(achievements.find(a => a.id === 'boss_killer'));
      }
    }
  }
  updateBossDisplay();
}

// Modal Functions
function showStatsModal() {
  soundManager.playClick();
  const totalGames = score.wins + score.loses + score.ties;
  const winRate = totalGames > 0 ? Math.round((score.wins / totalGames) * 100) : 0;
  
  document.getElementById('totalGames').textContent = totalGames;
  document.getElementById('winRate').textContent = `${winRate}%`;
  document.getElementById('bestStreak').textContent = score.bestStreak;
  
  // Update pick distribution
  const totalPicks = score.pickCounts['👊'] + score.pickCounts['✋'] + score.pickCounts['✌️'];
  const rockPercent = totalPicks > 0 ? Math.round((score.pickCounts['👊'] / totalPicks) * 100) : 33;
  const paperPercent = totalPicks > 0 ? Math.round((score.pickCounts['✋'] / totalPicks) * 100) : 33;
  const scissorsPercent = totalPicks > 0 ? Math.round((score.pickCounts['✌️'] / totalPicks) * 100) : 34;
  
  document.getElementById('rockDist').style.width = `${rockPercent}%`;
  document.getElementById('rockPercent').textContent = `${rockPercent}%`;
  document.getElementById('paperDist').style.width = `${paperPercent}%`;
  document.getElementById('paperPercent').textContent = `${paperPercent}%`;
  document.getElementById('scissorsDist').style.width = `${scissorsPercent}%`;
  document.getElementById('scissorsPercent').textContent = `${scissorsPercent}%`;
  
  document.getElementById('statsModal').classList.add('show');
}

function closeStatsModal() {
  document.getElementById('statsModal').classList.remove('show');
}

function showAchievementsModal() {
  soundManager.playClick();
  renderAchievements();
  document.getElementById('achievementsModal').classList.add('show');
}

function closeAchievementsModal() {
  document.getElementById('achievementsModal').classList.remove('show');
}

function showLeaderboardModal() {
  soundManager.playClick();
  renderLeaderboard();
  document.getElementById('leaderboardModal').classList.add('show');
}

function closeLeaderboardModal() {
  document.getElementById('leaderboardModal').classList.remove('show');
}

function startTimer() {
  if (!document.getElementById('timerToggle').checked) return;
  
  timerActive = true;
  let timeLeft = 3;
  const timerCount = document.getElementById('timerCount');
  timerCount.textContent = timeLeft;
  
  timerInterval = setInterval(() => {
    timeLeft--;
    timerCount.textContent = timeLeft;
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerActive = false;
      handleTimeout();
    }
  }, 1000);
}

function handleTimeout() {
  // Player forfeits the round
  const playerIcon = document.getElementById('playerIcon');
  const computerIcon = document.getElementById('computerIcon');
  const playerSlot = document.querySelector('.player-slot');
  const computerSlot = document.querySelector('.computer-slot');
  
  // Reset effects
  playerSlot.classList.remove('winner', 'loser', 'tie');
  computerSlot.classList.remove('winner', 'loser', 'tie');
  document.body.classList.remove('shake');
  
  // Show timeout result
  playerIcon.textContent = '⏰';
  computerIcon.textContent = '👊';
  playerIcon.classList.add('reveal');
  computerIcon.classList.add('reveal');
  
  // Player loses
  playerSlot.classList.add('loser');
  computerSlot.classList.add('winner');
  document.body.classList.add('shake');
  
  score.loses += 1;
  score.streak = 0;
  
  localStorage.setItem('score', JSON.stringify(score));
  updateStreakDisplay();
  
  // Show modal
  setTimeout(() => {
    document.getElementById('modalText').textContent = `Time's up! You forfeited the round.\nWins: ${score.wins}  Loses: ${score.loses}  Ties: ${score.ties}`;
    
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    modalCloseBtn.textContent = 'Play Again';
    
    document.getElementById('resultModal').classList.add('show');
  }, 400);
}

function playGame(playerMove) {
  // Clear any existing timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerActive = false;

  soundManager.playClick();

  const moveButtons = document.querySelectorAll('.move-button');
  moveButtons.forEach((button) => button.classList.remove('selected'));

  const chosenButton = Array.from(moveButtons).find((button) => button.textContent.trim() === {
    rock: '👊',
    paper: '✋',
    scissors: '✌️'
  }[playerMove]);

  if (chosenButton) {
    chosenButton.classList.add('selected');
  }

  // Track pick counts for stats
  if (score.pickCounts[playerMove] !== undefined) {
    score.pickCounts[playerMove]++;
  }

  // Add player move to history for pattern recognition
  playerMoveHistory.push(playerMove);
  if (playerMoveHistory.length > 5) {
    playerMoveHistory.shift();
  }

  const difficulty = document.getElementById('difficulty').value;
  const computerMove = pickComputerMove(difficulty);
  const playerIcon = document.getElementById('playerIcon');
  const computerIcon = document.getElementById('computerIcon');
  const playerSlot = document.querySelector('.player-slot');
  const computerSlot = document.querySelector('.computer-slot');

  // Reset previous effects
  playerSlot.classList.remove('winner', 'loser', 'tie');
  computerSlot.classList.remove('winner', 'loser', 'tie');
  document.body.classList.remove('shake');

  // Start countdown animation with bouncing fists
  playerIcon.textContent = '👊';
  computerIcon.textContent = '👊';
  playerIcon.classList.remove('reveal');
  computerIcon.classList.remove('reveal');
  computerIcon.classList.remove('thinking');
  playerIcon.classList.add('bouncing');
  computerIcon.classList.add('bouncing');

  // After 3 bounces (1.5s), reveal the actual moves
  setTimeout(() => {
    playerIcon.classList.remove('bouncing');
    computerIcon.classList.remove('bouncing');
    
    playerIcon.textContent = playerMove;
    computerIcon.textContent = computerMove;
    
    playerIcon.classList.add('reveal');
    computerIcon.classList.add('reveal');

    // Determine result
    let result = '';

    if (gameMode === 'rpsls') {
      result = determineRPSLSResult(playerMove, computerMove);
    } else {
      // Classic RPS
      if (playerMove === '✌️') {
        if (computerMove === '👊') {
          result = 'You lose.';
        } else if (computerMove === '✋') {
          result = 'You win.';
        } else if (computerMove === '✌️') {
          result = 'Tie.';
        }
      } else if (playerMove === '✋') {
        if (computerMove === '👊') {
          result = 'You win.';
        } else if (computerMove === '✋') {
          result = 'Tie.';
        } else if (computerMove === '✌️') {
          result = 'You lose.';
        }
      } else if (playerMove === '👊') {
        if (computerMove === '👊') {
          result = 'Tie.';
        } else if (computerMove === '✋') {
          result = 'You lose.';
        } else if (computerMove === '✌️') {
          result = 'You win.';
        }
      }
    }

    // Apply visual effects based on result
    if (result === 'You win.') {
      playerSlot.classList.add('winner');
      score.wins += 1;
      score.streak += 1;
      roundOutcomes.push('win');
      if (score.streak > score.bestStreak) {
        score.bestStreak = score.streak;
      }
      addXP(25);
      soundManager.playVictory();
      createParticles('win', window.innerWidth / 2, window.innerHeight / 2);
      handleBossResult(result);
    } else if (result === 'You lose.') {
      playerSlot.classList.add('loser');
      computerSlot.classList.add('winner');
      document.body.classList.add('shake');
      score.loses += 1;
      score.streak = 0;
      roundOutcomes.push('lose');
      addXP(5);
      soundManager.playLose();
      createParticles('lose', window.innerWidth / 2, window.innerHeight / 2);
    } else if (result === 'Tie.') {
      playerSlot.classList.add('tie');
      computerSlot.classList.add('tie');
      score.ties += 1;
      roundOutcomes.push('tie');
      addXP(10);
      createParticles('tie', window.innerWidth / 2, window.innerHeight / 2);
    }

    // Keep only last 10 outcomes for adaptive AI
    if (roundOutcomes.length > 10) {
      roundOutcomes.shift();
    }

    updateStreakDisplay();
    checkAchievements();

    localStorage.setItem('score', JSON.stringify(score));

    // Show modal after reveal animation
    setTimeout(() => {
      let scoreText = `You ${playerMove} - ${computerMove} Computer. ${result}\nWins: ${score.wins}  Loses: ${score.loses}  Ties: ${score.ties}`;
      
      // Add boss dialogue in Boss Rush mode
      if (gameMode === 'bossrush') {
        const dialogue = getBossDialogue(result);
        if (dialogue) {
          scoreText += `\n\n💬 "${dialogue}"`;
        }
      }
      
      // Add multiplier info if streak is 3 or more
      if (score.streak >= 3) {
        const multiplier = Math.min(Math.floor(score.streak / 3) + 1, 5);
        scoreText += `\n🔥 ${score.streak} Win Streak! (${multiplier}x multiplier)`;
      }
      
      document.getElementById('modalText').textContent = scoreText;
      
      // Update modal button text based on result
      const modalCloseBtn = document.getElementById('modalCloseBtn');
      if (result === 'You win.') {
        modalCloseBtn.textContent = 'Continue';
      } else {
        modalCloseBtn.textContent = 'Play Again';
      }
      
      document.getElementById('resultModal').classList.add('show');
    }, 400);

  }, 1500);

};

function closeModal() {
  document.getElementById('resultModal').classList.remove('show');
  // Start timer for next round if enabled
  if (document.getElementById('timerToggle').checked) {
    startTimer();
  }
};

function pickComputerMove(difficulty = 'medium') {
  // Boss Rush mode - use boss-specific AI
  if (gameMode === 'bossrush' && currentBoss < bosses.length) {
    return pickBossMove();
  }

  const moves = gameMode === 'rpsls' ? ['👊', '✋', '✌️', '🦎', '🖖'] : ['👊', '✋', '✌️'];
  
  if (difficulty === 'easy') {
    // Easy mode: completely random
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
  }
  
  if (difficulty === 'medium') {
    // Medium mode: Markov chain pattern recognition
    // Analyze player's last 5 moves to predict next move
    if (playerMoveHistory.length < 2) {
      // Not enough data, use random
      const randomNumber = Math.random();
      if (randomNumber < 1 / 3) return '👊';
      if (randomNumber < 2 / 3) return '✋';
      return '✌️';
    }
    
    // Count transitions from last move to next move
    const lastMove = playerMoveHistory[playerMoveHistory.length - 1];
    const transitionCounts = { '👊': 0, '✋': 0, '✌️': 0 };
    
    for (let i = 0; i < playerMoveHistory.length - 1; i++) {
      if (playerMoveHistory[i] === lastMove) {
        transitionCounts[playerMoveHistory[i + 1]]++;
      }
    }
    
    // Predict player's most likely next move
    let predictedMove = moves[0];
    let maxCount = transitionCounts[predictedMove];
    
    for (const move of moves) {
      if (transitionCounts[move] > maxCount) {
        maxCount = transitionCounts[move];
        predictedMove = move;
      }
    }
    
    // Counter the predicted move (70% chance to use counter, 30% random)
    if (Math.random() < 0.7) {
      return getCounterMove(predictedMove);
    }
    
    // Fallback to random
    const randomNumber = Math.random();
    if (randomNumber < 1 / 3) return '👊';
    if (randomNumber < 2 / 3) return '✋';
    return '✌️';
  }
  
  if (difficulty === 'hard') {
    // Hard mode: Adaptive counter strategy
    // Analyze psychological patterns based on round outcomes
    
    if (roundOutcomes.length < 3) {
      // Not enough data, use medium strategy
      return pickComputerMove('medium');
    }
    
    // Check if player tends to switch after losing
    let switchAfterLose = 0;
    let totalLoses = 0;
    
    for (let i = 1; i < roundOutcomes.length; i++) {
      if (roundOutcomes[i - 1] === 'lose') {
        totalLoses++;
        if (playerMoveHistory[i] !== playerMoveHistory[i - 1]) {
          switchAfterLose++;
        }
      }
    }
    
    // Check if player tends to repeat after winning
    let repeatAfterWin = 0;
    let totalWins = 0;
    
    for (let i = 1; i < roundOutcomes.length; i++) {
      if (roundOutcomes[i - 1] === 'win') {
        totalWins++;
        if (playerMoveHistory[i] === playerMoveHistory[i - 1]) {
          repeatAfterWin++;
        }
      }
    }
    
    let predictedMove;
    
    // Predict based on patterns
    if (totalLoses > 0 && switchAfterLose / totalLoses > 0.6) {
      // Player tends to switch after losing
      // Predict they'll switch to something that beats what they just lost to
      const lastMove = playerMoveHistory[playerMoveHistory.length - 1];
      predictedMove = getSwitchMove(lastMove);
    } else if (totalWins > 0 && repeatAfterWin / totalWins > 0.6) {
      // Player tends to repeat after winning
      predictedMove = playerMoveHistory[playerMoveHistory.length - 1];
    } else {
      // Use Markov chain prediction
      if (playerMoveHistory.length >= 2) {
        const lastMove = playerMoveHistory[playerMoveHistory.length - 1];
        const transitionCounts = { '👊': 0, '✋': 0, '✌️': 0 };
        
        for (let i = 0; i < playerMoveHistory.length - 1; i++) {
          if (playerMoveHistory[i] === lastMove) {
            transitionCounts[playerMoveHistory[i + 1]]++;
          }
        }
        
        predictedMove = moves[0];
        let maxCount = transitionCounts[predictedMove];
        
        for (const move of moves) {
          if (transitionCounts[move] > maxCount) {
            maxCount = transitionCounts[move];
            predictedMove = move;
          }
        }
      } else {
        // Random if no data
        const randomNumber = Math.random();
        if (randomNumber < 1 / 3) return '👊';
        if (randomNumber < 2 / 3) return '✋';
        return '✌️';
      }
    }
    
    // Counter the predicted move (80% success rate)
    if (Math.random() < 0.8) {
      return getCounterMove(predictedMove);
    }
    
    // Fallback to random
    const randomNumber = Math.random();
    if (randomNumber < 1 / 3) return '👊';
    if (randomNumber < 2 / 3) return '✋';
    return '✌️';
  }
  
  // Default to random
  const randomNumber = Math.random();
  if (randomNumber < 1 / 3) return '👊';
  if (randomNumber < 2 / 3) return '✋';
  return '✌️';
}

function getCounterMove(move) {
  const counters = {
    '👊': '✋',  // Paper beats Rock
    '✋': '✌️',  // Scissors beats Paper
    '✌️': '👊'   // Rock beats Scissors
  };
  return counters[move];
}

function getSwitchMove(move) {
  // Predict what player might switch to after losing
  // If they lost with Rock, they might switch to Paper (to beat Rock)
  const switches = {
    '👊': '✋',
    '✋': '✌️',
    '✌️': '👊'
  };
  return switches[move];
}

function determineRPSLSResult(playerMove, computerMove) {
  // RPSLS rules:
  // Scissors cuts Paper, Paper covers Rock, Rock crushes Lizard, Lizard poisons Spock, Spock smashes Scissors
  // Scissors decapitates Lizard, Lizard eats Paper, Paper disproves Spock, Spock vaporizes Rock, Rock crushes Scissors
  
  const wins = {
    '👊': ['✌️', '🦎'],  // Rock crushes Scissors, Rock crushes Lizard
    '✋': ['👊', '🖖'],  // Paper covers Rock, Paper disproves Spock
    '✌️': ['✋', '🦎'],  // Scissors cuts Paper, Scissors decapitates Lizard
    '🦎': ['🖖', '✋'],  // Lizard poisons Spock, Lizard eats Paper
    '🖖': ['✌️', '👊']   // Spock smashes Scissors, Spock vaporizes Rock
  };
  
  if (playerMove === computerMove) {
    return 'Tie.';
  }
  
  if (wins[playerMove].includes(computerMove)) {
    return 'You win.';
  }
  
  return 'You lose.';
}

// Boss AI System
function pickBossMove() {
  const boss = bosses[currentBoss];
  const moves = ['👊', '✋', '✌️'];
  
  switch(boss.behavior) {
    case 'aggressive':
      // Boss 1: Aggressive pattern detection - 90% accuracy
      return pickAggressiveBossMove();
    case 'freeze':
      // Boss 2: Time Warden - can freeze timer
      return pickFreezeBossMove();
    case 'adaptive':
      // Boss 3: Mind Reader - highly adaptive with dialogue
      return pickAdaptiveBossMove();
    default:
      return moves[Math.floor(Math.random() * moves.length)];
  }
}

function pickAggressiveBossMove() {
  // Boss 1: Aggressive pattern detection with 90% accuracy
  if (playerMoveHistory.length >= 2) {
    const lastMove = playerMoveHistory[playerMoveHistory.length - 1];
    const transitionCounts = { '👊': 0, '✋': 0, '✌️': 0 };
    
    for (let i = 0; i < playerMoveHistory.length - 1; i++) {
      if (playerMoveHistory[i] === lastMove) {
        transitionCounts[playerMoveHistory[i + 1]]++;
      }
    }
    
    // Predict most likely next move
    let predictedMove = '👊';
    let maxCount = transitionCounts[predictedMove];
    
    for (const move of ['👊', '✋', '✌️']) {
      if (transitionCounts[move] > maxCount) {
        maxCount = transitionCounts[move];
        predictedMove = move;
      }
    }
    
    // Counter with 90% accuracy
    if (Math.random() < 0.9) {
      return getCounterMove(predictedMove);
    }
  }
  
  return ['👊', '✋', '✌️'][Math.floor(Math.random() * 3)];
}

function pickFreezeBossMove() {
  // Boss 2: Time Warden - can freeze timer occasionally
  // 30% chance to freeze timer for 2 seconds
  if (Math.random() < 0.3 && timerActive) {
    freezeTimer();
  }
  
  // Uses adaptive AI with 85% accuracy
  if (playerMoveHistory.length >= 2) {
    const lastMove = playerMoveHistory[playerMoveHistory.length - 1];
    const transitionCounts = { '👊': 0, '✋': 0, '✌️': 0 };
    
    for (let i = 0; i < playerMoveHistory.length - 1; i++) {
      if (playerMoveHistory[i] === lastMove) {
        transitionCounts[playerMoveHistory[i + 1]]++;
      }
    }
    
    let predictedMove = '👊';
    let maxCount = transitionCounts[predictedMove];
    
    for (const move of ['👊', '✋', '✌️']) {
      if (transitionCounts[move] > maxCount) {
        maxCount = transitionCounts[move];
        predictedMove = move;
      }
    }
    
    if (Math.random() < 0.85) {
      return getCounterMove(predictedMove);
    }
  }
  
  return ['👊', '✋', '✌️'][Math.floor(Math.random() * 3)];
}

function freezeTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    setTimeout(() => {
      if (timerActive) {
        startTimer();
      }
    }, 2000);
  }
}

function pickAdaptiveBossMove() {
  // Boss 3: Mind Reader - highly adaptive with dialogue reactions
  // Uses psychological pattern analysis with 95% accuracy
  
  if (roundOutcomes.length >= 3) {
    let switchAfterLose = 0;
    let totalLoses = 0;
    
    for (let i = 1; i < roundOutcomes.length; i++) {
      if (roundOutcomes[i - 1] === 'lose') {
        totalLoses++;
        if (playerMoveHistory[i] !== playerMoveHistory[i - 1]) {
          switchAfterLose++;
        }
      }
    }
    
    let repeatAfterWin = 0;
    let totalWins = 0;
    
    for (let i = 1; i < roundOutcomes.length; i++) {
      if (roundOutcomes[i - 1] === 'win') {
        totalWins++;
        if (playerMoveHistory[i] === playerMoveHistory[i - 1]) {
          repeatAfterWin++;
        }
      }
    }
    
    let predictedMove;
    
    if (totalLoses > 0 && switchAfterLose / totalLoses > 0.6) {
      const lastMove = playerMoveHistory[playerMoveHistory.length - 1];
      predictedMove = getSwitchMove(lastMove);
    } else if (totalWins > 0 && repeatAfterWin / totalWins > 0.6) {
      predictedMove = playerMoveHistory[playerMoveHistory.length - 1];
    } else {
      if (playerMoveHistory.length >= 2) {
        const lastMove = playerMoveHistory[playerMoveHistory.length - 1];
        const transitionCounts = { '👊': 0, '✋': 0, '✌️': 0 };
        
        for (let i = 0; i < playerMoveHistory.length - 1; i++) {
          if (playerMoveHistory[i] === lastMove) {
            transitionCounts[playerMoveHistory[i + 1]]++;
          }
        }
        
        predictedMove = '👊';
        let maxCount = transitionCounts[predictedMove];
        
        for (const move of ['👊', '✋', '✌️']) {
          if (transitionCounts[move] > maxCount) {
            maxCount = transitionCounts[move];
            predictedMove = move;
          }
        }
      } else {
        return ['👊', '✋', '✌️'][Math.floor(Math.random() * 3)];
      }
    }
    
    // 95% accuracy
    if (Math.random() < 0.95) {
      return getCounterMove(predictedMove);
    }
  }
  
  return ['👊', '✋', '✌️'][Math.floor(Math.random() * 3)];
}

function getBossDialogue(result) {
  if (gameMode !== 'bossrush' || currentBoss >= bosses.length) return '';
  
  const dialogues = {
    0: { // Pattern Master
      win: ["I see your patterns!", "Predictable as always.", "I know what you'll do next."],
      lose: ["Impossible!", "You broke my pattern!", "How did you know?"]
    },
    1: { // Time Warden
      win: ["Time is on my side.", "Too slow!", "I control the flow."],
      lose: ["You're faster than time!", "My freeze failed!", "Temporal anomaly detected!"]
    },
    2: { // Mind Reader
      win: ["I can read your thoughts.", "Your mind is an open book.", "I knew you'd pick that."],
      lose: ["You've blocked my mind reading!", "Unpredictable!", "How are you doing this?"]
    }
  };
  
  const bossDialogues = dialogues[currentBoss];
  const dialogueArray = result === 'You win.' ? bossDialogues.lose : bossDialogues.win;
  return dialogueArray[Math.floor(Math.random() * dialogueArray.length)];
}