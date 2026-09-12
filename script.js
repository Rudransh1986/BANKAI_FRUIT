// Screen Elements
const startScreen = document.getElementById('startScreen');
const gameplayScreen = document.getElementById('gameplayScreen');
const gameOverScreen = document.getElementById('gameOverScreen');

// UI Elements
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');
const highScoreElement = document.getElementById('highScore');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');

// Canvas Setup
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game State
let isPlaying = false;
let score = 0;
let highScore = localStorage.getItem('bankaiFruitHighScore') || 0;
highScoreElement.innerText = highScore;

// Game Entities
let fruits = [];
let particles = [];
let sliceTrail = [];
let spawnTimer = 0;

// Beautiful Fruit Colors
const fruitColors = ['#ff4b2b', '#ffd200', '#00ff87', '#00c6ff', '#e100ff'];

// Ensure canvas matches screen size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial call

// ================================
// INPUT TRACKING (Mouse & Touch)
// ================================
let isSwiping = false;

function addTrailPoint(x, y) {
    sliceTrail.push({ x, y });
    if (sliceTrail.length > 10) sliceTrail.shift(); // Keep trail smooth and short
    checkSlices();
}

// Mouse events
canvas.addEventListener('mousedown', (e) => {
    isSwiping = true;
    sliceTrail = [{ x: e.clientX, y: e.clientY }];
});
canvas.addEventListener('mousemove', (e) => {
    if (isSwiping) addTrailPoint(e.clientX, e.clientY);
});
canvas.addEventListener('mouseup', () => { isSwiping = false; sliceTrail = []; });
canvas.addEventListener('mouseleave', () => { isSwiping = false; sliceTrail = []; });

// Touch events for mobile
canvas.addEventListener('touchstart', (e) => {
    isSwiping = true;
    const touch = e.touches[0];
    sliceTrail = [{ x: touch.clientX, y: touch.clientY }];
});
canvas.addEventListener('touchmove', (e) => {
    if (isSwiping) {
        const touch = e.touches[0];
        addTrailPoint(touch.clientX, touch.clientY);
    }
});
canvas.addEventListener('touchend', () => { isSwiping = false; sliceTrail = []; });
canvas.addEventListener('touchcancel', () => { isSwiping = false; sliceTrail = []; });

// ================================
// GAME CLASSES
// ================================
class GameObject {
    constructor() {
        this.radius = Math.random() * 20 + 25; // Random size
        // Spawn slightly outside canvas bottom
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = canvas.height + this.radius;
        
        // Arc movement math (throw up, fall down)
        this.vx = (Math.random() - 0.5) * 8; // Slight horizontal drift
        this.vy = -(Math.random() * 8 + 14); // Throw velocity
        this.gravity = 0.25;
        
        // 15% chance to be a bomb instead of a fruit
        this.isBomb = Math.random() < 0.15;
        this.color = this.isBomb ? '#222' : fruitColors[Math.floor(Math.random() * fruitColors.length)];
        this.sliced = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity; // Gravity pulling it back down
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Optional visual distinction for Bombs
        if (this.isBomb) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Draw a tiny red bomb fuse spark
            ctx.beginPath();
            ctx.arc(this.x + this.radius * 0.7, this.y - this.radius * 0.7, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ff4b2b';
            ctx.fill();
        }
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 12;
        this.vy = (Math.random() - 0.5) * 12;
        this.radius = Math.random() * 5 + 3;
        this.color = color;
        this.life = 1; // Fades out over time
        this.decay = Math.random() * 0.02 + 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1; // Reset alpha
    }
}

// ================================
// CORE LOGIC & PHYSICS
// ================================
function spawnObject() {
    fruits.push(new GameObject());
}

function createParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function checkSlices() {
    if (sliceTrail.length < 2) return;
    
    // Get the last two points of the swipe to form a line segment
    const p1 = sliceTrail[sliceTrail.length - 2];
    const p2 = sliceTrail[sliceTrail.length - 1];

    for (let i = fruits.length - 1; i >= 0; i--) {
        let f = fruits[i];
        if (f.sliced) continue;

        // Math checking if the distance between fruit center and swipe line is < fruit radius
        let dist = distToSegmentSquared(f, p1, p2);
        if (dist < f.radius * f.radius) {
            f.sliced = true;
            
            if (f.isBomb) {
                gameOver();
            } else {
                score++;
                scoreElement.innerText = score;
                createParticles(f.x, f.y, f.color); // Splash!
                fruits.splice(i, 1); // Remove cut fruit
            }
        }
    }
}

// Helper Physics Math Functions for Collision Detection
function distToSegmentSquared(p, v, w) {
    let l2 = dist2(v, w);
    if (l2 === 0) return dist2(p, v);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
}
function dist2(v, w) {
    return (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
}

function drawTrail() {
    if (sliceTrail.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(sliceTrail[0].x, sliceTrail[0].y);
    for (let i = 1; i < sliceTrail.length; i++) {
        ctx.lineTo(sliceTrail[i].x, sliceTrail[i].y);
    }
    
    // Glowing sword swipe effect
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ff87';
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset
}

// ================================
// GAME LOOP
// ================================
function gameLoop() {
    if (!isPlaying) return;

    // Clear canvas frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Spawning frequency logic
    spawnTimer++;
    // Spawn faster as score gets higher
    const spawnRate = Math.max(20, 60 - Math.floor(score / 3)); 
    if (spawnTimer % spawnRate === 0) { 
        spawnObject();
    }

    // Update & Draw Objects
    for (let i = fruits.length - 1; i >= 0; i--) {
        let f = fruits[i];
        f.update();
        f.draw();

        // Garbage collect if it falls off screen
        if (f.y - f.radius > canvas.height && f.vy > 0) {
            fruits.splice(i, 1);
        }
    }

    // Update & Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Draw swipe last so it's on top
    drawTrail();

    // Call next frame
    requestAnimationFrame(gameLoop);
}

// ================================
// GAME STATE MANAGEMENT
// ================================
function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameplayScreen.classList.remove('hidden');
    
    // Reset Variables
    score = 0;
    scoreElement.innerText = score;
    fruits = [];
    particles = [];
    sliceTrail = [];
    spawnTimer = 0;
    isPlaying = true;
    
    // Start Loop
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    isPlaying = false;
    
    // Check for high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('bankaiFruitHighScore', highScore);
    }
    
    // Update End Screen UI
    finalScoreElement.innerText = score;
    highScoreElement.innerText = highScore;
    
    // Show End Screen Overlay
    gameplayScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
}

// Event Bindings
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);