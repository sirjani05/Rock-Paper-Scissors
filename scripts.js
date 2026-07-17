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

      let result = '';

      if (playerMove === 'scissors') {
        if (computerMove === 'rock') {
          result = 'You lose.';
        } else if (computerMove === 'paper') {
          result = 'You win.';
        } else if (computerMove === 'scissors') {
          result = 'Tie.';
        }

        
      } else if (playerMove === 'paper') {
        if (computerMove === 'rock') {
          result = 'You win.';
        } else if (computerMove === 'paper') {
          result = 'Tie.';
        } else if (computerMove === 'scissors') {
          result = 'You lose.';
        }


      } else if (playerMove === 'rock') {
        if (computerMove === 'rock') {
          result = 'Tie.';
        } else if (computerMove === 'paper') {
          result = 'You lose.';
        } else if (computerMove === 'scissors') {
          result = 'You win.';
        }
      }

      if (result === 'You win.'){
        score.wins += 1
      } else if (result === 'You lose.') {
        score.loses += 1
      } else if (result === 'Tie.') {
        score.ties += 1
      }

      localStorage.setItem('score', JSON.stringify(score));

      document.getElementById('modalText').textContent = `You picked ${playerMove}. Computer picked ${computerMove}. ${result}\nWins: ${score.wins}  Loses: ${score.loses}  Ties: ${score.ties}`;
      document.getElementById('resultModal').classList.add('show');

      }

    function closeModal() {
      document.getElementById('resultModal').classList.remove('show');
    }
      
    function pickComputerMove() {
      const randomNumber = Math.random();

      let computerMove = '';

      if (randomNumber >= 0 && randomNumber < 1/3) {
        computerMove = 'rock';
      } else if (randomNumber >= 1/3 && randomNumber < 2/3) {
        computerMove = 'paper';
      } else if (randomNumber >= 2/3 && randomNumber < 1) {
        computerMove = 'scissors';
      }

      return computerMove;
    }