const dino = document.getElementById('dino');
const obstacleArea = document.getElementById('obstacle-area');
const levelDisplay = document.getElementById('level-display');
const scoreDisplay = document.getElementById('score-display');
const messageDisplay = document.getElementById('message-display');

// --- GAME STATE VARIABLES ---
let isJumping = false;
let gameRunning = false;
let currentLevel = 1;
let score = 0;
let levelDistance = 0;
let levelLength = 5000; // Distance to clear a level (in score units)
let gameSpeed = 5;      // Base obstacle speed (pixels per frame)
let levelSpeedMultiplier = 1.0;

// --- LEVEL DEFINITIONS (from your concept) ---
const levels = {
    1: { speed: 1.0, interval: 2000, challenge: "Basic Cacti" },
    2: { speed: 1.1, interval: 1500, challenge: "Small Gaps (Closer Spacing)" },
    3: { speed: 1.25, interval: 1800, challenge: "Flying Obstacles (TODO: implement height check)" },
    // Add more levels here...
};

// --- GAME FUNCTIONS ---

// 1. DINO JUMP MECHANIC
function jump() {
    if (!isJumping && gameRunning) {
        isJumping = true;
        dino.classList.add('jump');

        setTimeout(() => {
            dino.classList.remove('jump');
            isJumping = false;
        }, 600); // Must match the animation duration in CSS
    }
}

// 2. OBSTACLE CREATION
function createObstacle() {
    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');
    
    // Level 3+ example: Change size for flying obstacles or stacking
    if (currentLevel >= 3 && Math.random() < 0.3) {
        obstacle.style.height = '15px'; // "Flying" low obstacle
        obstacle.style.bottom = '40px'; 
    }
    
    obstacleArea.appendChild(obstacle);

    // Initial position for the obstacle
    let rightPosition = -15; 
    
    // Animation loop for the obstacle movement
    const moveObstacle = setInterval(() => {
        if (!gameRunning) {
            clearInterval(moveObstacle);
            obstacle.remove();
            return;
        }

        // Calculate speed based on current level
        const currentSpeed = gameSpeed * levelSpeedMultiplier;
        
        rightPosition += currentSpeed;
        obstacle.style.right = rightPosition + 'px';

        // Collision Detection (simple box model)
        const dinoRect = dino.getBoundingClientRect();
        const obstacleRect = obstacle.getBoundingClientRect();

        // Check if the boxes overlap
        if (
            dinoRect.left < obstacleRect.right &&
            dinoRect.right > obstacleRect.left &&
            dinoRect.top < obstacleRect.bottom &&
            dinoRect.bottom > obstacleRect.top
        ) {
            // COLLISION! Game Over/Level Reset
            gameOver();
            clearInterval(moveObstacle);
            return;
        }

        // Remove obstacle once it's off-screen to the left
        if (rightPosition > 600) { 
            clearInterval(moveObstacle);
            obstacle.remove();
        }
    }, 20); // Frame rate (50 FPS)
}


// 3. LEVEL CONTROL AND LOOP
let obstacleTimer;

function startGame() {
    if (gameRunning) return;
    
    gameRunning = true;
    score = 0;
    levelDistance = 0;
    messageDisplay.textContent = "Go!";

    // Clear existing obstacles
    obstacleArea.innerHTML = '';
    
    // Set up the current level's speed
    const currentLevelData = levels[currentLevel] || levels[1];
    levelSpeedMultiplier = currentLevelData.speed;

    // Start generating obstacles at the level's interval
    obstacleTimer = setInterval(createObstacle, currentLevelData.interval);
    
    // Main game loop for score and level progression
    const gameLoop = setInterval(() => {
        if (!gameRunning) {
            clearInterval(gameLoop);
            return;
        }
        
        score++;
        levelDistance++;
        scoreDisplay.textContent = score;

        // Check for Level Completion
        if (levelDistance >= levelLength) {
            clearInterval(obstacleTimer); // Stop spawning obstacles
            clearInterval(gameLoop);
            
            levelUp();
        }
        
    }, 50); // Score update frequency
}

function levelUp() {
    currentLevel++;
    levelDistance = 0; // Reset distance counter
    levelDisplay.textContent = currentLevel;
    messageDisplay.textContent = `LEVEL ${currentLevel} COMPLETE! NEW CHALLENGE: ${levels[currentLevel]?.challenge || 'Increased Speed'}`;
    
    // Clear all obstacles before starting the next level
    obstacleArea.innerHTML = ''; 
    
    // Brief pause before starting the next level
    setTimeout(() => {
        if (levels[currentLevel]) {
            startGame(); // Start the next level
        } else {
            messageDisplay.textContent = "YOU WIN! Game Complete!";
            gameRunning = false;
        }
    }, 2000); 
}

function gameOver() {
    gameRunning = false;
    clearInterval(obstacleTimer);
    messageDisplay.textContent = `Game Over! Level ${currentLevel} Failed. Press SPACE to Restart Level.`;
    
    // Wait for the restart command
}

// --- EVENT LISTENERS ---
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!gameRunning) {
            startGame();
        } else {
            jump();
        }
    }
});

// Initialize the display
levelDisplay.textContent = currentLevel;
