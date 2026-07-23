const score = JSON.parse(localStorage.getItem('score')) || {
  wins: 0,
  loses: 0,
  ties: 0,
  streak: 0
};

// Player move history for pattern recognition (last 5 moves)
let playerMoveHistory = [];
// Track round outcomes for adaptive AI
let roundOutcomes = [];
// Timer variables
let timerInterval = null;
let timerActive = false;

// Initialize streak display on load
document.addEventListener('DOMContentLoaded', () => {
  updateStreakDisplay();
  setupTimerToggle();
  // Start timer if enabled on page load
  if (document.getElementById('timerToggle').checked) {
    startTimer();
  }
});

function setupTimerToggle() {
  const timerToggle = document.getElementById('timerToggle');
  timerToggle.addEventListener('change', (e) => {
    const timerDisplay = document.getElementById('timerDisplay');
    timerDisplay.style.display = e.target.checked ? 'flex' : 'none';
  });
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

    // Apply visual effects based on result
    if (result === 'You win.') {
      playerSlot.classList.add('winner');
      score.wins += 1;
      score.streak += 1;
      roundOutcomes.push('win');
    } else if (result === 'You lose.') {
      playerSlot.classList.add('loser');
      computerSlot.classList.add('winner');
      document.body.classList.add('shake');
      score.loses += 1;
      score.streak = 0;
      roundOutcomes.push('lose');
    } else if (result === 'Tie.') {
      playerSlot.classList.add('tie');
      computerSlot.classList.add('tie');
      score.ties += 1;
      roundOutcomes.push('tie');
    }

    // Keep only last 10 outcomes for adaptive AI
    if (roundOutcomes.length > 10) {
      roundOutcomes.shift();
    }

    updateStreakDisplay();

    localStorage.setItem('score', JSON.stringify(score));

    // Show modal after reveal animation
    setTimeout(() => {
      let scoreText = `You ${playerMove} - ${computerMove} Computer. ${result}\nWins: ${score.wins}  Loses: ${score.loses}  Ties: ${score.ties}`;
      
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
  const moves = ['👊', '✋', '✌️'];
  
  if (difficulty === 'easy') {
    // Easy mode: completely random (33% each)
    const randomNumber = Math.random();
    if (randomNumber < 1 / 3) return '👊';
    if (randomNumber < 2 / 3) return '✋';
    return '✌️';
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