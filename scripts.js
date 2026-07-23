const score = JSON.parse(localStorage.getItem('score')) || {
  wins: 0,
  loses: 0,
  ties: 0
};

function playGame(playerMove) {
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

  const computerMove = pickComputerMove();
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
    } else if (result === 'You lose.') {
      playerSlot.classList.add('loser');
      computerSlot.classList.add('winner');
      document.body.classList.add('shake');
      score.loses += 1;
    } else if (result === 'Tie.') {
      playerSlot.classList.add('tie');
      computerSlot.classList.add('tie');
      score.ties += 1;
    }

    localStorage.setItem('score', JSON.stringify(score));

    // Show modal after reveal animation
    setTimeout(() => {
      document.getElementById('modalText').textContent = `You ${playerMove} - ${computerMove} Computer. ${result}\nWins: ${score.wins}  Loses: ${score.loses}  Ties: ${score.ties}`;
      
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
};

function pickComputerMove() {
  const randomNumber = Math.random();

  let computerMove = '';

  if (randomNumber >= 0 && randomNumber < 1 / 3) {
    computerMove = '👊';
  } else if (randomNumber >= 1 / 3 && randomNumber < 2 / 3) {
    computerMove = '✋';
  } else if (randomNumber >= 2 / 3 && randomNumber < 1) {
    computerMove = '✌️';
  }

  return computerMove;
};