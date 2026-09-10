// ========================================
// FRUIT CUTTER GAME
// ========================================

// Get HTML elements
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer");
const livesElement = document.getElementById("lives");

const finalScoreElement = document.getElementById("finalScore");
const highScoreElement = document.getElementById("highScore");


// ========================================
// CANVAS SIZE
// ========================================

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);


// ========================================
// GAME VARIABLES
// ========================================

let fruits = [];
let particles = [];
let bladeTrail = [];

let score = 0;
let lives = 3;
let timeLeft = 60;

let gameRunning = false;

let lastTime = 0;
let spawnTimer = 0;
let gameTimer = null;

let difficulty = 1;


// ========================================
// FRUIT TYPES
// ========================================

const fruitTypes = [
    {
        emoji: "🍎",
        points: 10
    },
    {
        emoji: "🍊",
        points: 10
    },
    {
        emoji: "🍉",
        points: 15
    },
    {
        emoji: "🍌",
        points: 10
    },
    {
        emoji: "🍓",
        points: 20
    },
    {
        emoji: "🥝",
        points: 15
    }
];


// ========================================
// HIGH SCORE
// ========================================

let highScore = localStorage.getItem("fruitCutterHighScore") || 0;

highScoreElement.textContent = highScore;


// ========================================
// START GAME
// ========================================

startButton.addEventListener("click", startGame);

restartButton.addEventListener("click", startGame);


function startGame() {

    startScreen.classList.add("hidden");

    gameOverScreen.classList.add("hidden");

    gameScreen.classList.remove("hidden");

    // Reset everything
    fruits = [];
    particles = [];
    bladeTrail = [];

    score = 0;
    lives = 3;
    timeLeft = 60;

    difficulty = 1;

    gameRunning = true;

    scoreElement.textContent = score;

    timerElement.textContent = timeLeft;

    livesElement.textContent = "❤️❤️❤️";

    clearInterval(gameTimer);

    // Timer
    gameTimer = setInterval(() => {

        if (!gameRunning) return;

        timeLeft--;

        timerElement.textContent = timeLeft;

        if (timeLeft <= 0) {
            endGame();
        }

    }, 1000);

    lastTime = performance.now();

    requestAnimationFrame(gameLoop);
}


// ========================================
// GAME LOOP
// ========================================

function gameLoop(currentTime) {

    if (!gameRunning) return;

    const deltaTime = (currentTime - lastTime) / 1000;

    lastTime = currentTime;

    update(deltaTime);

    draw();

    requestAnimationFrame(gameLoop);
}


// ========================================
// UPDATE GAME
// ========================================

function update(deltaTime) {

    // Increase difficulty
    difficulty = 1 + score / 300;

    // Spawn fruits
    spawnTimer += deltaTime;

    const spawnDelay = Math.max(
        0.35,
        1.1 - difficulty * 0.08
    );

    if (spawnTimer >= spawnDelay) {

        spawnFruit();

        spawnTimer = 0;
    }


    // Update fruits
    fruits.forEach((fruit) => {

        fruit.x += fruit.vx * deltaTime;

        fruit.y += fruit.vy * deltaTime;

        fruit.vy += fruit.gravity * deltaTime;

        fruit.rotation += fruit.rotationSpeed * deltaTime;

    });


    // Remove fruits that fall below screen
    for (let i = fruits.length - 1; i >= 0; i--) {

        if (fruits[i].y > canvas.height + 100) {

            // Only normal fruits cost a life
            if (!fruits[i].bomb) {

                loseLife();
            }

            fruits.splice(i, 1);
        }
    }


    // Update particles
    particles.forEach((particle) => {

        particle.x += particle.vx * deltaTime;

        particle.y += particle.vy * deltaTime;

        particle.vy += 500 * deltaTime;

        particle.life -= deltaTime;

    });


    particles = particles.filter(
        particle => particle.life > 0
    );


    // Blade trail fading
    bladeTrail.forEach(point => {

        point.life -= deltaTime;

    });

    bladeTrail = bladeTrail.filter(
        point => point.life > 0
    );
}


// ========================================
// SPAWN FRUIT
// ========================================

function spawnFruit() {

    const isBomb = Math.random() < 0.12;

    const size = 45 + Math.random() * 15;

    const x =
        size +
        Math.random() * (canvas.width - size * 2);

    const y = canvas.height + size;

    const vx =
        (Math.random() - 0.5) *
        250 *
        difficulty;

    const vy =
        -(650 + Math.random() * 300) *
        Math.min(difficulty, 2);

    if (isBomb) {

        fruits.push({
            x: x,
            y: y,

            size: size,

            vx: vx,
            vy: vy,

            gravity: 850,

            rotation: 0,

            rotationSpeed:
                (Math.random() - 0.5) * 5,

            bomb: true,

            emoji: "💣",

            points: 0
        });

    } else {

        const fruit =
            fruitTypes[
                Math.floor(
                    Math.random() * fruitTypes.length
                )
            ];

        fruits.push({

            x: x,
            y: y,

            size: size,

            vx: vx,
            vy: vy,

            gravity: 850,

            rotation: 0,

            rotationSpeed:
                (Math.random() - 0.5) * 5,

            bomb: false,

            emoji: fruit.emoji,

            points: fruit.points
        });
    }
}


// ========================================
// DRAW EVERYTHING
// ========================================

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Draw fruits
    fruits.forEach(drawFruit);


    // Draw particles
    particles.forEach(drawParticle);


    // Draw blade
    drawBlade();
}


// ========================================
// DRAW FRUIT
// ========================================

function drawFruit(fruit) {

    ctx.save();

    ctx.translate(
        fruit.x,
        fruit.y
    );

    ctx.rotate(
        fruit.rotation
    );

    ctx.font =
        `${fruit.size}px Arial`;

    ctx.textAlign = "center";

    ctx.textBaseline = "middle";

    ctx.shadowColor =
        "rgba(0,0,0,0.3)";

    ctx.shadowBlur = 10;

    ctx.fillText(
        fruit.emoji,
        0,
        0
    );

    ctx.restore();
}


// ========================================
// DRAW PARTICLE
// ========================================

function drawParticle(particle) {

    ctx.save();

    ctx.globalAlpha =
        Math.max(particle.life, 0);

    ctx.beginPath();

    ctx.arc(
        particle.x,
        particle.y,
        particle.size,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        particle.color;

    ctx.fill();

    ctx.restore();
}


// ========================================
// BLADE TRAIL
// ========================================

function drawBlade() {

    if (bladeTrail.length < 2) return;

    ctx.save();

    ctx.beginPath();

    ctx.moveTo(
        bladeTrail[0].x,
        bladeTrail[0].y
    );

    for (let i = 1; i < bladeTrail.length; i++) {

        ctx.lineTo(
            bladeTrail[i].x,
            bladeTrail[i].y
        );
    }

    ctx.strokeStyle =
        "white";

    ctx.lineWidth = 5;

    ctx.lineCap = "round";

    ctx.shadowColor =
        "white";

    ctx.shadowBlur = 15;

    ctx.stroke();

    ctx.restore();
}


// ========================================
// POINTER / TOUCH CONTROL
// ========================================

let slicing = false;


// Mouse
canvas.addEventListener(
    "mousedown",
    (event) => {

        slicing = true;

        addBladePoint(
            event.clientX,
            event.clientY
        );
    }
);


canvas.addEventListener(
    "mousemove",
    (event) => {

        if (!slicing) return;

        addBladePoint(
            event.clientX,
            event.clientY
        );
    }
);


window.addEventListener(
    "mouseup",
    () => {

        slicing = false;
    }
);


// Touch
canvas.addEventListener(
    "touchstart",
    (event) => {

        event.preventDefault();

        slicing = true;

        const touch =
            event.touches[0];

        addBladePoint(
            touch.clientX,
            touch.clientY
        );
    },
    { passive: false }
);


canvas.addEventListener(
    "touchmove",
    (event) => {

        event.preventDefault();

        if (!slicing) return;

        const touch =
            event.touches[0];

        addBladePoint(
            touch.clientX,
            touch.clientY
        );
    },
    { passive: false }
);


canvas.addEventListener(
    "touchend",
    () => {

        slicing = false;
    }
);


// ========================================
// ADD BLADE POINT
// ========================================

function addBladePoint(x, y) {

    bladeTrail.push({

        x: x,
        y: y,

        life: 0.15
    });


    // Check slicing
    checkSlice(x, y);
}


// ========================================
// CHECK COLLISION / SLICE
// ========================================

function checkSlice(x, y) {

    for (
        let i = fruits.length - 1;
        i >= 0;
        i--
    ) {

        const fruit = fruits[i];

        const distance =
            Math.sqrt(
                (x - fruit.x) ** 2 +
                (y - fruit.y) ** 2
            );


        if (
            distance <
            fruit.size * 0.7
        ) {

            // Bomb
            if (fruit.bomb) {

                createExplosion(
                    fruit.x,
                    fruit.y
                );

                loseLife();

                fruits.splice(i, 1);

                continue;
            }


            // Normal fruit
            score += fruit.points;

            scoreElement.textContent =
                score;


            createFruitParticles(
                fruit.x,
                fruit.y
            );


            fruits.splice(i, 1);
        }
    }
}


// ========================================
// FRUIT PARTICLES
// ========================================

function createFruitParticles(x, y) {

    const particleCount = 15;

    for (
        let i = 0;
        i < particleCount;
        i++
    ) {

        particles.push({

            x: x,

            y: y,

            vx:
                (Math.random() - 0.5) *
                350,

            vy:
                (Math.random() - 0.5) *
                350,

            size:
                2 + Math.random() * 5,

            life:
                0.5 + Math.random() * 0.5,

            color:
                `hsl(${Math.random() * 60}, 100%, 60%)`
        });
    }
}


// ========================================
// BOMB EXPLOSION
// ========================================

function createExplosion(x, y) {

    for (
        let i = 0;
        i < 30;
        i++
    ) {

        particles.push({

            x: x,

            y: y,

            vx:
                (Math.random() - 0.5) *
                600,

            vy:
                (Math.random() - 0.5) *
                600,

            size:
                3 + Math.random() * 7,

            life:
                0.5 + Math.random() * 0.5,

            color:
                `hsl(${Math.random() * 30}, 100%, 50%)`
        });
    }
}


// ========================================
// LOSE LIFE
// ========================================

function loseLife() {

    if (!gameRunning) return;

    lives--;

    updateLives();


    if (lives <= 0) {

        endGame();
    }
}


// ========================================
// UPDATE LIVES DISPLAY
// ========================================

function updateLives() {

    livesElement.textContent =
        "❤️".repeat(lives);
}


// ========================================
// END GAME
// ========================================

function endGame() {

    gameRunning = false;

    clearInterval(gameTimer);


    // Update high score
    if (
        score >
        Number(highScore)
    ) {

        highScore = score;

        localStorage.setItem(
            "fruitCutterHighScore",
            highScore
        );
    }


    finalScoreElement.textContent =
        score;

    highScoreElement.textContent =
        highScore;


    gameScreen.classList.add("hidden");

    gameOverScreen.classList.remove(
        "hidden"
    );
}
