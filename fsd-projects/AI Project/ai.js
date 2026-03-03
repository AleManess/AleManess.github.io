const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartBtn = document.getElementById('restartBtn');
const menuBtn = document.getElementById('menuBtn');
const uiContainer = document.getElementById('ui-container');
const menu = document.getElementById('menu');

const bgCanvas = document.createElement('canvas');
const bgCtx = bgCanvas.getContext('2d');

// --- GAME STATE ---
let gameState = 'MENU'; 
let score = 0; 
let lives = 3;         
let timeLeft = 60;     
let gameOver = false;
let difficultyMultiplier = 1;
let slowMoFrames = 0;
let glitchFrames = 0;
let frenzyFrames = 0;
let critFlashFrames = 0;
let currentLevel = 1;

let comboCount = 0;
let lastSliceTime = 0;
const comboTimeout = 500; 

const levelColors = ['#00f2ff', '#bc13fe', '#00ff9f', '#feee10', '#ff0055'];

let highScores = {
    NORMAL: Number(localStorage.getItem('neonSlasher_NORMAL')) || 0,
    ZEN: Number(localStorage.getItem('neonSlasher_ZEN')) || 0
};

let fruits = [];
let trail = [];
let labels = [];
let ambientParticles = [];
let mouse = { x: 0, y: 0, isDown: false };
let lastTime = Date.now();

// --- INITIALIZATION ---
function resize() {
    canvas.width = bgCanvas.width = window.innerWidth;
    canvas.height = bgCanvas.height = window.innerHeight;
    clearSplashes();
    initAmbient();
}

function clearSplashes() {
    bgCtx.fillStyle = '#050505';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
}

function initAmbient() {
    ambientParticles = [];
    for(let i = 0; i < 40; i++) {
        ambientParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1
        });
    }
}

window.addEventListener('resize', resize);
resize();

function startGame(mode) {
    gameState = mode;
    menu.style.display = 'none';
    resetGame();
}

function resetGame() {
    score = 0; lives = 3; timeLeft = 60;
    difficultyMultiplier = 1; slowMoFrames = 0; glitchFrames = 0;
    frenzyFrames = 0; critFlashFrames = 0; currentLevel = 1; comboCount = 0;
    gameOver = false; fruits = []; trail = []; labels = [];
    uiContainer.style.display = 'none';
    clearSplashes();
    lastTime = Date.now();
    animate();
}

restartBtn.addEventListener('click', resetGame);
menuBtn.addEventListener('click', () => {
    uiContainer.style.display = 'none';
    menu.style.display = 'flex';
    gameState = 'MENU';
    clearSplashes();
});

// --- CLASSES ---
class Label {
    constructor(x, y, text, color, size = 22) {
        this.x = x; this.y = y; this.text = text; this.color = color;
        this.alpha = 1.0; this.life = 40; this.size = size;
    }
    update() { this.y -= 1.5; this.alpha -= 0.025; this.life--; }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.shadowBlur = 15; ctx.shadowColor = this.color;
        ctx.fillStyle = "white"; ctx.font = `bold ${this.size}px Courier New`;
        ctx.textAlign = "center"; ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class GameObject {
    constructor(type = "fruit") {
        this.type = type;
        this.size = (type === "frenzy") ? 18 : (type === "bomb" ? 22 : 30 + Math.random() * 20);
        this.x = Math.random() * (canvas.width - this.size * 2) + this.size;
        this.y = canvas.height + this.size;
        
        const neonColors = ['#00ff9f', '#ff0055', '#bc13fe', '#feee10'];
        if (this.type === "bomb") this.color = '#ff0000';
        else if (this.type === "slowmo") this.color = '#00f2ff';
        else if (this.type === "frenzy") this.color = '#feee10';
        else this.color = neonColors[Math.floor(Math.random() * neonColors.length)];
        
        let boost = (this.type === "frenzy") ? 1.3 : 1;
        this.speedY = (-11 - Math.random() * 7) * difficultyMultiplier * boost; 
        this.speedX = (this.x < canvas.width / 2 ? 1 : -1) * (Math.random() * 4) * difficultyMultiplier;
        this.gravity = 0.22 * difficultyMultiplier;
        this.isHalf = false; this.side = 0; this.rotation = 0;
        this.rotSpeed = (Math.random() - 0.5) * 0.25;
    }
    update() {
        let speedFactor = (slowMoFrames > 0) ? 0.35 : 1;
        this.speedY += (this.gravity * speedFactor);
        this.y += (this.speedY * speedFactor);
        this.x += (this.speedX * speedFactor);
        this.rotation += (this.rotSpeed * speedFactor);
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
        ctx.shadowBlur = 15; ctx.shadowColor = this.color; ctx.lineWidth = 3;
        
        if (this.type === "frenzy") {
            ctx.strokeStyle = this.color; ctx.beginPath();
            ctx.moveTo(0, -this.size); ctx.lineTo(this.size, this.size); ctx.lineTo(-this.size, this.size); ctx.closePath();
            ctx.stroke(); ctx.fillStyle = 'rgba(254, 238, 16, 0.2)'; ctx.fill();
        } else if (this.type === "bomb") {
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff0000'; ctx.stroke();
            ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'; ctx.fill();
        } else if (this.type === "slowmo") {
            ctx.strokeStyle = '#00f2ff'; ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
            ctx.fillStyle = 'rgba(0, 242, 255, 0.2)'; ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        } else {
            ctx.strokeStyle = this.color; ctx.beginPath();
            if (!this.isHalf) { ctx.arc(0, 0, this.size, 0, Math.PI * 2); }
            else { ctx.arc(0, 0, this.size, Math.PI * 0.5, Math.PI * 1.5, this.side > 0); ctx.closePath(); }
            ctx.stroke();
        }
        ctx.restore();
    }
}

function createSplash(x, y, color) {
    bgCtx.save(); bgCtx.shadowBlur = 25; bgCtx.shadowColor = color; bgCtx.fillStyle = color;
    bgCtx.globalAlpha = 0.3; bgCtx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i; const dist = 15 + Math.random() * 35;
        bgCtx.lineTo(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist);
    }
    bgCtx.fill(); bgCtx.restore();
}

// --- MAIN LOOP ---
function animate() {
    if (gameState === 'MENU') return;

    if (gameOver) {
        if (score > highScores[gameState]) {
            highScores[gameState] = score;
            localStorage.setItem('neonSlasher_' + gameState, score);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00f2ff'; ctx.textAlign = 'center'; ctx.font = 'bold 50px Courier New';
        ctx.fillText('DATA UPLOAD COMPLETE', canvas.width/2, canvas.height/2 - 100);
        ctx.font = '30px Courier New'; ctx.fillText('FINAL SCORE: ' + score, canvas.width/2, canvas.height/2 - 30);
        ctx.fillStyle = '#bc13fe'; ctx.fillText('MODE BEST: ' + highScores[gameState], canvas.width/2, canvas.height/2 + 20);
        uiContainer.style.display = 'flex';
        return;
    }

    if (Date.now() - lastSliceTime > comboTimeout) { comboCount = 0; }

    let newLevel = Math.floor(score / 500) + 1;
    if (newLevel > currentLevel) {
        currentLevel = newLevel;
        labels.push(new Label(canvas.width/2, canvas.height/2, "LEVEL UP: " + currentLevel, "#ffffff", 40));
    }

    if (gameState === 'ZEN') {
        let now = Date.now();
        if (now - lastTime >= 1000) { timeLeft--; lastTime = now; if (timeLeft <= 0) gameOver = true; }
    }

    ctx.save();
    if (glitchFrames > 0) { glitchFrames--; ctx.translate((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20); }

    difficultyMultiplier = (gameState === 'ZEN') ? 1 + (score / 2000) : 1 + (score / 1500);
    ctx.drawImage(bgCanvas, 0, 0);

    let levelIdx = (currentLevel - 1) % levelColors.length;
    let baseColor = levelColors[levelIdx];

    // Background Effects
    if (critFlashFrames > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${critFlashFrames / 10})`;
        critFlashFrames--;
    } else if (frenzyFrames > 0) {
        let flash = Math.sin(Date.now() / 50) > 0 ? 0.15 : 0.05;
        ctx.fillStyle = `rgba(254, 238, 16, ${flash})`;
    } else if (slowMoFrames > 0) {
        ctx.fillStyle = 'rgba(0, 40, 80, 0.3)';
    } else {
        ctx.fillStyle = baseColor + "15";
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Ambient Particles
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ambientParticles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    if (slowMoFrames > 0) slowMoFrames--;
    if (frenzyFrames > 0) frenzyFrames--;

    let spawnRate = (frenzyFrames > 0) ? 0.22 : (0.035 + (score / 15000));
    if (Math.random() < spawnRate) {
        let rand = Math.random();
        let type = "fruit";
        if (frenzyFrames > 0) type = "fruit";
        else if (gameState === 'NORMAL') {
            if (rand < 0.14) type = "bomb";
            else if (rand < 0.17) type = "slowmo";
            else if (rand < 0.19) type = "frenzy";
        } else if (gameState === 'ZEN') {
            if (rand < 0.05) type = "slowmo";
        }
        fruits.push(new GameObject(type));
    }

    if (mouse.isDown) { trail.push({ x: mouse.x, y: mouse.y }); if (trail.length > 15) trail.shift(); }
    else { if (trail.length > 0) trail.shift(); }

    for (let i = fruits.length - 1; i >= 0; i--) {
        const f = fruits[i]; f.update(); f.draw();
        const dist = Math.hypot(mouse.x - f.x, mouse.y - f.y);
        
        if (mouse.isDown && dist < f.size && !f.isHalf) {
            if (f.type === "bomb") {
                lives--; score = Math.max(0, score - 50); glitchFrames = 15; comboCount = 0;
                labels.push(new Label(f.x, f.y, "!!! BOOM !!!", "#ff0000"));
                fruits.splice(i, 1); if (lives <= 0) gameOver = true;
            } else if (f.type === "slowmo") {
                slowMoFrames = 200; labels.push(new Label(f.x, f.y, "CHRONO", "#00f2ff")); fruits.splice(i, 1);
            } else if (f.type === "frenzy") {
                frenzyFrames = 300; labels.push(new Label(f.x, f.y, "GOLDEN FRENZY", "#feee10")); fruits.splice(i, 1);
            } else {
                createSplash(f.x, f.y, f.color);
                lastSliceTime = Date.now();
                comboCount++;
                
                let points = 10;
                if (Math.random() < 0.1) {
                    points *= 2;
                    critFlashFrames = 8;
                    labels.push(new Label(f.x, f.y, "CRITICAL!!", "#ffffff", 30));
                }

                if (comboCount >= 3) {
                    points += (comboCount * 2);
                    labels.push(new Label(f.x, f.y, `x${comboCount}`, "#ffffff", 24));
                } else if (critFlashFrames <= 0) {
                    labels.push(new Label(f.x, f.y, "SLICE!", f.color));
                }
                
                score += points;

                let h1 = new GameObject("fruit"); Object.assign(h1, {x: f.x, y: f.y, size: f.size, color: f.color, speedX: f.speedX-4, speedY: f.speedY, isHalf: true, side: -1});
                let h2 = new GameObject("fruit"); Object.assign(h2, {x: f.x, y: f.y, size: f.size, color: f.color, speedX: f.speedX+4, speedY: f.speedY, isHalf: true, side: 1});
                fruits.push(h1, h2); fruits.splice(i, 1);
            }
        } else if (f.y > canvas.height + 100) fruits.splice(i, 1);
    }

    for (let i = labels.length - 1; i >= 0; i--) {
        labels[i].update(); labels[i].draw(); if (labels[i].life <= 0) labels.splice(i, 1);
    }

    if (trail.length >= 2) {
        ctx.shadowBlur = 15; ctx.shadowColor = (frenzyFrames > 0) ? '#feee10' : baseColor;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i < trail.length - 1; i++) {
            ctx.globalAlpha = i / trail.length;
            ctx.moveTo(trail[i].x, trail[i].y);
            ctx.lineTo(trail[i+1].x, trail[i+1].y);
            ctx.stroke();
        }
    }
    ctx.restore();
    
    // UI
    ctx.textAlign = 'left'; ctx.fillStyle = baseColor; ctx.font = 'bold 28px Courier New';
    ctx.fillText('> L' + currentLevel + ' ' + gameState, 30, 50);
    ctx.fillText('> SCORE: ' + score, 30, 90);
    
    if (comboCount >= 2) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`> COMBO: x${comboCount}`, 30, 130);
    }

    if (frenzyFrames > 0) {
        ctx.textAlign = 'center'; ctx.fillStyle = '#feee10';
        ctx.fillText('!! FRENZY PROTOCOL !!', canvas.width/2, 50);
    }

    ctx.textAlign = 'right';
    if (gameState === 'ZEN') {
        ctx.fillStyle = (timeLeft <= 10) ? '#ff0055' : '#00ff9f';
        ctx.fillText('TIME: ' + timeLeft + 's', canvas.width - 30, 50);
    } else {
        ctx.fillStyle = '#ff0055';
        ctx.fillText('STRIKES: ' + 'X'.repeat(3-lives) + '_'.repeat(lives), canvas.width - 30, 50);
    }

    requestAnimationFrame(animate);
}

const setMouse = (e) => {
    const t = e.touches ? e.touches[0] : e;
    const rect = canvas.getBoundingClientRect();
    mouse.x = t.clientX - rect.left; mouse.y = t.clientY - rect.top;
};
window.addEventListener('mousemove', setMouse);
window.addEventListener('mousedown', () => mouse.isDown = true);
window.addEventListener('mouseup', () => mouse.isDown = false);
window.addEventListener('touchstart', (e) => { mouse.isDown = true; setMouse(e); e.preventDefault(); }, {passive: false});
window.addEventListener('touchmove', (e) => { setMouse(e); e.preventDefault(); }, {passive: false});
window.addEventListener('touchend', () => mouse.isDown = false);