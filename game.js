// Game state
const gameState = {
    gridWidth: 6,
    gridHeight: 5,
    targetNumber: 0,
    gameMode: 'equals', // 'equals', 'multiples', 'factors', 'inequality'
    inequalityOperator: '>', // '>' or '<' for inequality mode
    numEnemies: 2,
    numSafeZones: 1,
    score: 0,
    lives: 3,
    level: 1,
    playerPosition: { row: 0, col: 0 },
    enemies: [],
    safeZone: { row: 0, col: 0 },
    grid: [],
    correctAnswers: 0,
    totalCorrect: 0,
    gameOver: false,
    paused: false,
    playerFrozen: false
};

// Monster emojis
const PLAYER_MONSTER = '👾';
const ENEMY_MONSTERS = ['👹', '👺', '🤖'];

// Initialize the game
function initGame() {
    gameState.score = 0;
    gameState.lives = 3;
    gameState.level = 1;
    gameState.gameOver = false;
    gameState.paused = false;
    gameState.gameMode = document.getElementById('game-mode-start').value;
    gameState.numEnemies = parseInt(document.getElementById('num-enemies').value);
    gameState.numSafeZones = parseInt(document.getElementById('num-safe-zones').value);
    
    document.getElementById('game-over').classList.add('hidden');
    
    startLevel();
}

// Update target text based on game mode
function updateTargetText() {
    const targetText = document.getElementById('target-text');
    const targetNum = gameState.targetNumber;
    
    switch(gameState.gameMode) {
        case 'multiples':
            targetText.innerHTML = `Find multiples of: <span id="target-number">${targetNum}</span>`;
            break;
        case 'factors':
            targetText.innerHTML = `Find factors of: <span id="target-number">${targetNum}</span>`;
            break;
        case 'inequality':
            const op = gameState.inequalityOperator;
            targetText.innerHTML = `Find numbers ${op}: <span id="target-number">${targetNum}</span>`;
            break;
        default: // equals
            targetText.innerHTML = `Find equations that equal: <span id="target-number">${targetNum}</span>`;
    }
}

// Start a new level
function startLevel() {
    // Generate target number based on level and mode
    if (gameState.gameMode === 'multiples') {
        gameState.targetNumber = Math.floor(Math.random() * 7) + 2; // 2-8
    } else if (gameState.gameMode === 'factors') {
        const factorTargets = [12, 18, 20, 24, 30, 36, 40, 48];
        gameState.targetNumber = factorTargets[Math.floor(Math.random() * factorTargets.length)];
    } else if (gameState.gameMode === 'inequality') {
        gameState.targetNumber = Math.floor(Math.random() * (5 + gameState.level * 3)) + 5;
        gameState.inequalityOperator = Math.random() < 0.5 ? '>' : '<';
    } else { // equals
        gameState.targetNumber = Math.floor(Math.random() * (5 + gameState.level * 3)) + 3;
    }
    
    // Update target text based on mode
    updateTargetText();
    
    // Create grid with equations
    createGrid();
    
    // Place player in a random position
    gameState.playerPosition = {
        row: Math.floor(Math.random() * gameState.gridHeight),
        col: Math.floor(Math.random() * gameState.gridWidth)
    };
    
    // Create safe zones
    gameState.safeZones = [];
    for (let i = 0; i < gameState.numSafeZones; i++) {
        let safePos;
        do {
            safePos = {
                row: Math.floor(Math.random() * gameState.gridHeight),
                col: Math.floor(Math.random() * gameState.gridWidth)
            };
        } while (
            (safePos.row === gameState.playerPosition.row &&
             safePos.col === gameState.playerPosition.col) ||
            gameState.safeZones.some(s => s.row === safePos.row && s.col === safePos.col)
        );
        gameState.safeZones.push(safePos);
    }
    
    // Create enemies (use configured number)
    const numEnemies = gameState.numEnemies;
    gameState.enemies = [];
    for (let i = 0; i < numEnemies; i++) {
        let enemyPos;
        do {
            enemyPos = {
                row: Math.floor(Math.random() * gameState.gridHeight),
                col: Math.floor(Math.random() * gameState.gridWidth)
            };
        } while (
            (enemyPos.row === gameState.playerPosition.row && 
             enemyPos.col === gameState.playerPosition.col) ||
            gameState.safeZones.some(s => s.row === enemyPos.row && s.col === enemyPos.col) ||
            gameState.enemies.some(e => e.row === enemyPos.row && e.col === enemyPos.col)
        );
        
        gameState.enemies.push(enemyPos);
    }
    
    updateDisplay();
    renderGrid();
    
    // Start enemy movement
    if (gameState.enemyInterval) {
        clearInterval(gameState.enemyInterval);
    }
    gameState.enemyInterval = setInterval(moveEnemies, 800);
    
    // Start safe zone movement
    if (gameState.safeZoneInterval) {
        clearInterval(gameState.safeZoneInterval);
    }
    if (gameState.numSafeZones > 0) {
        gameState.safeZoneInterval = setInterval(moveSafeZones, 3000);
    }
}

// Create grid with math equations
function createGrid() {
    gameState.grid = [];
    gameState.correctAnswers = 0;
    gameState.totalCorrect = 0;
    
    const target = gameState.targetNumber;
    
    for (let row = 0; row < gameState.gridHeight; row++) {
        gameState.grid[row] = [];
        for (let col = 0; col < gameState.gridWidth; col++) {
            const cell = generateCellContent(target, Math.random() < 0.4); // 40% correct answers
            gameState.grid[row][col] = cell;
            if (cell.isCorrect) {
                gameState.totalCorrect++;
            }
        }
    }
    
    // Ensure at least a few correct answers exist
    if (gameState.totalCorrect < 3) {
        for (let i = 0; i < 3 - gameState.totalCorrect; i++) {
            const row = Math.floor(Math.random() * gameState.gridHeight);
            const col = Math.floor(Math.random() * gameState.gridWidth);
            if (!gameState.grid[row][col].isCorrect) {
                gameState.grid[row][col] = generateCellContent(target, true);
                gameState.totalCorrect++;
            }
        }
    }
}

// Generate cell content based on game mode
function generateCellContent(target, shouldBeCorrect) {
    switch(gameState.gameMode) {
        case 'multiples':
            return generateMultiples(target, shouldBeCorrect);
        case 'factors':
            return generateFactors(target, shouldBeCorrect);
        case 'inequality':
            return generateInequality(target, shouldBeCorrect);
        default: // equals
            return generateEquation(target, shouldBeCorrect);
    }
}

// Generate multiples content
function generateMultiples(target, shouldBeCorrect) {
    let number;
    
    if (shouldBeCorrect) {
        // Generate a multiple of target
        const multiplier = Math.floor(Math.random() * 10) + 1;
        number = target * multiplier;
    } else {
        // Generate a non-multiple
        do {
            number = Math.floor(Math.random() * (target * 10)) + 1;
        } while (number % target === 0);
    }
    
    return {
        displayText: number.toString(),
        value: number,
        isCorrect: number % target === 0,
        eaten: false,
        correctAnswer: target
    };
}

// Generate factors content
function generateFactors(target, shouldBeCorrect) {
    let number;
    
    if (shouldBeCorrect) {
        // Generate a factor of target
        const factors = [];
        for (let i = 1; i <= target; i++) {
            if (target % i === 0) {
                factors.push(i);
            }
        }
        number = factors[Math.floor(Math.random() * factors.length)];
    } else {
        // Generate a non-factor
        do {
            number = Math.floor(Math.random() * target) + 1;
        } while (target % number === 0);
    }
    
    return {
        displayText: number.toString(),
        value: number,
        isCorrect: target % number === 0,
        eaten: false,
        correctAnswer: target
    };
}

// Generate inequality content
function generateInequality(target, shouldBeCorrect) {
    const operations = ['+', '-'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2, answer;
    
    const operator = gameState.inequalityOperator;
    
    if (shouldBeCorrect) {
        // Generate equation that satisfies inequality
        num1 = Math.floor(Math.random() * 15) + 1;
        num2 = Math.floor(Math.random() * 15) + 1;
        
        if (operation === '+') {
            answer = num1 + num2;
        } else {
            if (num1 < num2) [num1, num2] = [num2, num1];
            answer = num1 - num2;
        }
        
        // Adjust to satisfy inequality
        if (operator === '>' && answer <= target) {
            num1 = target + Math.floor(Math.random() * 5) + 2;
            num2 = Math.floor(Math.random() * 5) + 1;
            answer = operation === '+' ? num1 + num2 : num1 - num2;
        } else if (operator === '<' && answer >= target) {
            num1 = Math.floor(Math.random() * target);
            num2 = Math.floor(Math.random() * (target - num1));
            answer = operation === '+' ? num1 + num2 : Math.max(0, num1 - num2);
        }
    } else {
        // Generate equation that doesn't satisfy inequality
        num1 = Math.floor(Math.random() * 15) + 1;
        num2 = Math.floor(Math.random() * 15) + 1;
        
        if (operation === '+') {
            answer = num1 + num2;
        } else {
            if (num1 < num2) [num1, num2] = [num2, num1];
            answer = num1 - num2;
        }
        
        // Ensure it doesn't satisfy inequality
        const satisfies = operator === '>' ? answer > target : answer < target;
        if (satisfies) {
            // Flip the operation or adjust numbers
            if (operator === '>') {
                answer = Math.floor(Math.random() * target);
            } else {
                answer = target + Math.floor(Math.random() * 10) + 1;
            }
            num1 = answer + Math.floor(Math.random() * 5);
            num2 = num1 - answer;
        }
    }
    
    const satisfiesInequality = operator === '>' ? answer > target : answer < target;
    
    return {
        num1,
        num2,
        operation,
        answer,
        displayText: `${num1} ${operation} ${num2}`,
        value: answer,
        isCorrect: satisfiesInequality,
        eaten: false,
        correctAnswer: target
    };
}

// Generate a math equation
function generateEquation(target, shouldBeCorrect) {
    const operations = ['+', '-'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1, num2, answer;
    
    if (shouldBeCorrect) {
        // Generate equation that equals target
        if (operation === '+') {
            num1 = Math.floor(Math.random() * (target - 1)) + 1;
            num2 = target - num1;
        } else { // subtraction
            num1 = target + Math.floor(Math.random() * 10) + 1;
            num2 = num1 - target;
        }
        answer = target;
    } else {
        // Generate equation that doesn't equal target
        num1 = Math.floor(Math.random() * 15) + 1;
        num2 = Math.floor(Math.random() * 15) + 1;
        
        if (operation === '+') {
            answer = num1 + num2;
        } else {
            if (num1 < num2) [num1, num2] = [num2, num1]; // Ensure positive result
            answer = num1 - num2;
        }
        
        // Make sure it's not accidentally correct
        if (answer === target) {
            answer = target + (Math.random() < 0.5 ? 1 : -1);
            if (operation === '+') {
                num2 = answer - num1;
            } else {
                num2 = num1 - answer;
            }
        }
    }
    
    return {
        num1,
        num2,
        operation,
        answer,
        isCorrect: answer === target,
        eaten: false
    };
}

// Render the grid
function renderGrid() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    
    for (let row = 0; row < gameState.gridHeight; row++) {
        for (let col = 0; col < gameState.gridWidth; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            const equation = gameState.grid[row][col];
            
            if (equation.eaten) {
                cell.classList.add('eaten');
            } else if (equation.isCorrect) {
                cell.classList.add('correct');
            } else {
                cell.classList.add('incorrect');
            }
            
            // Add equation text only if not eaten
            if (!equation.eaten) {
                const equationDiv = document.createElement('div');
                equationDiv.className = 'equation';
                
                if (equation.displayText) {
                    equationDiv.textContent = equation.displayText;
                } else {
                    equationDiv.textContent = `${equation.num1} ${equation.operation} ${equation.num2}`;
                }
                
                cell.appendChild(equationDiv);
            }
            
            // Add monsters
            if (row === gameState.playerPosition.row && col === gameState.playerPosition.col) {
                const monster = document.createElement('div');
                monster.className = 'monster player-monster';
                monster.textContent = PLAYER_MONSTER;
                cell.appendChild(monster);
            }
            
            // Add safe zone
            gameState.safeZones.forEach(safeZone => {
                if (row === safeZone.row && col === safeZone.col) {
                    cell.classList.add('safe-cell');
                }
            });
            
            // Add enemies
            gameState.enemies.forEach((enemy, index) => {
                if (row === enemy.row && col === enemy.col) {
                    const monster = document.createElement('div');
                    monster.className = 'monster enemy-monster';
                    monster.textContent = ENEMY_MONSTERS[index % ENEMY_MONSTERS.length];
                    cell.appendChild(monster);
                }
            });
            
            board.appendChild(cell);
        }
    }
}

// Show notification message
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 2000);
}

// Update display (score, lives, etc.)
function updateDisplay() {
    document.getElementById('target-number').textContent = gameState.targetNumber;
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
    
    // Update lives display
    const hearts = '❤️ '.repeat(gameState.lives);
    document.getElementById('lives').textContent = hearts || '💀';
}

// Handle player movement
function movePlayer(direction) {
    if (gameState.gameOver || gameState.paused || gameState.playerFrozen) return;
    
    const newPos = { ...gameState.playerPosition };
    
    switch(direction) {
        case 'up':
            newPos.row = Math.max(0, newPos.row - 1);
            break;
        case 'down':
            newPos.row = Math.min(gameState.gridHeight - 1, newPos.row + 1);
            break;
        case 'left':
            newPos.col = Math.max(0, newPos.col - 1);
            break;
        case 'right':
            newPos.col = Math.min(gameState.gridWidth - 1, newPos.col + 1);
            break;
    }
    
    gameState.playerPosition = newPos;
    
    // Check collision with enemies
    checkEnemyCollision();
    
    renderGrid();
    updateDisplay();
}

// Handle eating equation at current position
function eatEquation() {
    if (gameState.gameOver || gameState.paused || gameState.playerFrozen) return;
    
    const pos = gameState.playerPosition;
    const cell = gameState.grid[pos.row][pos.col];
    
    if (cell.eaten) {
        return; // Already eaten
    }
    
    cell.eaten = true;
    
    if (cell.isCorrect) {
        // Correct answer!
        gameState.score += 10 * gameState.level;
        gameState.correctAnswers++;
        
        // Check if level complete
        if (gameState.correctAnswers >= gameState.totalCorrect) {
            gameState.level++;
            gameState.paused = true;
            setTimeout(() => {
                gameState.paused = false;
                startLevel();
            }, 1000);
        }
    } else {
        // Wrong answer!
        let feedbackMessage;
        
        if (gameState.gameMode === 'multiples') {
            feedbackMessage = `❌ Oops! ${cell.value} is not a multiple of ${gameState.targetNumber}`;
        } else if (gameState.gameMode === 'factors') {
            feedbackMessage = `❌ Oops! ${cell.value} is not a factor of ${gameState.targetNumber}`;
        } else if (gameState.gameMode === 'inequality') {
            const correctOp = gameState.inequalityOperator;
            feedbackMessage = `❌ Oops! ${cell.num1} ${cell.operation} ${cell.num2} = ${cell.value}, not ${correctOp} ${gameState.targetNumber}`;
        } else { // equals
            const correctAnswer = cell.operation === '+' 
                ? cell.num1 + cell.num2 
                : cell.num1 - cell.num2;
            feedbackMessage = `❌ Oops! ${cell.num1} ${cell.operation} ${cell.num2} = ${correctAnswer}`;
        }
        
        showNotification(feedbackMessage);
        
        gameState.playerFrozen = true;
        setTimeout(() => {
            gameState.playerFrozen = false;
        }, 2000);
        loseLife();
    }
    
    renderGrid();
    updateDisplay();
}

// Move enemies
function moveEnemies() {
    if (gameState.gameOver || gameState.paused) return;
    
    gameState.enemies.forEach(enemy => {
        const directions = ['up', 'down', 'left', 'right'];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        const newPos = { ...enemy };
        
        switch(direction) {
            case 'up':
                newPos.row = Math.max(0, newPos.row - 1);
                break;
            case 'down':
                newPos.row = Math.min(gameState.gridHeight - 1, newPos.row + 1);
                break;
            case 'left':
                newPos.col = Math.max(0, newPos.col - 1);
                break;
            case 'right':
                newPos.col = Math.min(gameState.gridWidth - 1, newPos.col + 1);
                break;
        }
        
        // Prevent enemy from entering safe zones
        const isOnSafeZone = gameState.safeZones.some(s => 
            newPos.row === s.row && newPos.col === s.col
        );
        
        if (!isOnSafeZone) {
            enemy.row = newPos.row;
            enemy.col = newPos.col;
        }
    });
    
    checkEnemyCollision();
    renderGrid();
}

// Move safe zones
function moveSafeZones() {
    if (gameState.gameOver || gameState.paused) return;
    
    gameState.safeZones.forEach((safeZone, index) => {
        let newPos;
        do {
            newPos = {
                row: Math.floor(Math.random() * gameState.gridHeight),
                col: Math.floor(Math.random() * gameState.gridWidth)
            };
        } while (
            gameState.enemies.some(e => e.row === newPos.row && e.col === newPos.col) ||
            gameState.safeZones.some((s, i) => i !== index && s.row === newPos.row && s.col === newPos.col)
        );
        
        safeZone.row = newPos.row;
        safeZone.col = newPos.col;
    });
    
    renderGrid();
}

// Check collision with enemies
function checkEnemyCollision() {
    // Player is safe if on any safe zone
    const isOnSafeZone = gameState.safeZones.some(safeZone =>
        gameState.playerPosition.row === safeZone.row &&
        gameState.playerPosition.col === safeZone.col
    );
    
    if (isOnSafeZone) {
        return; // No collision when on safe zone
    }
    
    const collision = gameState.enemies.some(enemy => 
        enemy.row === gameState.playerPosition.row && 
        enemy.col === gameState.playerPosition.col
    );
    
    if (collision) {
        loseLife();
    }
}

// Lose a life
function loseLife() {
    gameState.lives--;
    
    if (gameState.lives <= 0) {
        endGame(false);
    } else {
        // Respawn player in a new position
        let newPos;
        do {
            newPos = {
                row: Math.floor(Math.random() * gameState.gridHeight),
                col: Math.floor(Math.random() * gameState.gridWidth)
            };
        } while (
            gameState.enemies.some(e => e.row === newPos.row && e.col === newPos.col)
        );
        gameState.playerPosition = newPos;
    }
    
    updateDisplay();
}

// End the game
function endGame(won) {
    gameState.gameOver = true;
    clearInterval(gameState.enemyInterval);
    clearInterval(gameState.safeZoneInterval);
    
    const modal = document.getElementById('game-over');
    const title = document.getElementById('game-over-title');
    const message = document.getElementById('game-over-message');
    const finalScore = document.getElementById('final-score');
    
    if (won) {
        title.textContent = '🎉 You Win! 🎉';
        message.innerHTML = `Amazing! You reached level ${gameState.level}!<br>Final score: `;
    } else {
        title.textContent = '😢 Game Over!';
        message.innerHTML = 'Your final score: ';
    }
    
    finalScore.textContent = gameState.score;
    modal.classList.remove('hidden');
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (gameState.gameOver) return;
    
    switch(e.key) {
        case 'ArrowUp':
            e.preventDefault();
            movePlayer('up');
            break;
        case 'ArrowDown':
            e.preventDefault();
            movePlayer('down');
            break;
        case 'ArrowLeft':
            e.preventDefault();
            movePlayer('left');
            break;
        case 'ArrowRight':
            e.preventDefault();
            movePlayer('right');
            break;
        case ' ':
            e.preventDefault();
            eatEquation();
            break;
    }
});

// Restart button
document.getElementById('restart-btn').addEventListener('click', () => {
    initGame();
});

// Start game button
document.getElementById('start-game-btn').addEventListener('click', () => {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    initGame();
});

// Back to menu button
document.getElementById('back-to-menu-btn').addEventListener('click', () => {
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    gameState.gameOver = true;
    clearInterval(gameState.enemyInterval);
    clearInterval(gameState.safeZoneInterval);
});

// Start the game when page loads (show start screen) (show start screen)
window.addEventListener('load', () => {
    // Start screen is shown by default
});
