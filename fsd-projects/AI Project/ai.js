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
let levelUpFrames = 0;
let currentLevel = 1;
let megaBombSpawnedThisLevel = false;

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
let burstParticles = [];
let mouse = { x: 0, y: 0, isDown: false };
let lastTime = Date.now();

function resize() {
    canvas.width = bgCanvas.width = window.innerWidth;
    canvas.height = bgCanvas.height = window.innerHeight;
    clearSplashes();
    initAmbient();
}

function clearSplashes() {
    bgCtx.fillStyle = '#000';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
}

function initAmbient() {
    ambientParticles = [];
    for(let i = 0; i < 65; i++) {
        ambientParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vy: Math.random() * 2.5 + 0.5,
            length: Math.random() * 25 + 10,
            opacity: Math.random() * 0.5 + 0.1
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
    frenzyFrames = 0; critFlashFrames = 0; levelUpFrames = 0; currentLevel = 1; 
    comboCount = 0; megaBombSpawnedThisLevel = false;
    gameOver = false; fruits = []; trail = []; labels = []; burstParticles = [];
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

class Label {
    constructor(x, y, text, color, size = 22) {
        this.x = x; this.y = y; this.text = text; this.color = color;
        this.alpha = 1.0; this.life = 45; this.size = size;
    }
    update() { this.y -= 1.8; this.alpha -= 0.02; this.life--; }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.shadowBlur = 20; ctx.shadowColor = this.color;
        ctx.fillStyle = "white"; ctx.font = `bold ${this.size}px Courier New`;
        ctx.textAlign = "center"; ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class GameObject {
    constructor(type = "fruit") {
        this.type = type;
        this.hitsNeeded = (type === "megabomb") ? 3 : 1;
        this.size = (type === "megabomb") ? 110 : (type === "frenzy" ? 22 : (type === "bomb" ? 24 : 35 + Math.random() * 15));
        this.x = Math.random() * (canvas.width - this.size * 2) + this.size;
        this.y = canvas.height + this.size;
        
        const neonColors = ['#00f2ff', '#00ff9f', '#ff0055', '#bc13fe', '#feee10'];
        if (this.type === "bomb" || this.type === "megabomb") this.color = '#ff3131';
        else if (this.type === "slowmo") this.color = '#00f2ff';
        else if (this.type === "frenzy") this.color = '#feee10';
        else this.color = neonColors[Math.floor(Math.random() * neonColors.length)];
        
        if (this.type === "megabomb") {
            this.speedY = -12 - Math.random() * 3; 
            this.speedX = (this.x < canvas.width / 2 ? 0.3 : -0.3);
            this.gravity = 0.06; 
        } else {
            this.speedY = (-10 - Math.random() * 6) * difficultyMultiplier; 
            this.speedX = (this.x < canvas.width / 2 ? 1 : -1) * (Math.random() * 3) * difficultyMultiplier;
            this.gravity = 0.20 * difficultyMultiplier;
        }
        this.isHalf = false; this.side = 0; this.rotation = 0;
        this.rotSpeed = (this.type === "megabomb") ? 0.015 : (Math.random() - 0.5) * 0.2;
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
        ctx.shadowBlur = (this.type === "megabomb") ? 80 : 30; 
        ctx.shadowColor = this.color; 
        ctx.lineWidth = (this.type === "megabomb") ? 12 : 5; 
        
        if (this.type === "megabomb") {
            let pulse = 1 + Math.sin(Date.now() / 150) * 0.05;
            ctx.scale(pulse, pulse);
            ctx.strokeStyle = this.color;
            ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
            ctx.fillStyle = `rgba(255, 49, 49, ${0.15 + Math.random() * 0.15})`;
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
            ctx.fillStyle = "white"; ctx.font = "bold 45px Courier New";
            ctx.textAlign = "center"; ctx.fillText(this.hitsNeeded, 0, 15);
        } else if (this.type === "frenzy") {
            ctx.strokeStyle = this.color; ctx.beginPath();
            ctx.moveTo(0, -this.size); ctx.lineTo(this.size, this.size); ctx.lineTo(-this.size, this.size); ctx.closePath();
            ctx.stroke(); ctx.fillStyle = 'rgba(254, 238, 16, 0.4)'; ctx.fill();
        } else if (this.type === "bomb") {
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff3131'; ctx.stroke();
            ctx.fillStyle = 'rgba(255, 49, 49, 0.3)'; ctx.fill();
        } else {
            ctx.strokeStyle = this.color; ctx.beginPath();
            if (!this.isHalf) { ctx.arc(0, 0, this.size, 0, Math.PI * 2); }
            else { ctx.arc(0, 0, this.size, Math.PI * 0.5, Math.PI * 1.5, this.side > 0); ctx.closePath(); }
            ctx.stroke();
            ctx.globalAlpha = 0.3; ctx.fillStyle = this.color; ctx.fill();
        }
        ctx.restore();
    }
}

function triggerDefragmentation(x, y) {
    const neonColors = ['#00f2ff', '#00ff9f', '#ff0055', '#bc13fe', '#feee10'];
    for(let i = 0; i < 40; i++) {
        burstParticles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            size: Math.random() * 8 + 4,
            color: neonColors[Math.floor(Math.random() * neonColors.length)],
            life: 1.0
        });
    }
}

function createSplash(x, y, color) {
    bgCtx.save(); bgCtx.shadowBlur = 35; bgCtx.shadowColor = color; bgCtx.fillStyle = color;
    bgCtx.globalAlpha = 0.45; bgCtx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i; const dist = 15 + Math.random() * 50;
        bgCtx.lineTo(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist);
    }
    bgCtx.fill(); bgCtx.restore();
}

function animate() {
    if (gameState === 'MENU') return;

    if (gameOver) {
        if (score > highScores[gameState]) {
            highScores[gameState] = score;
            localStorage.setItem('neonSlasher_' + gameState, score);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.95)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00f2ff'; ctx.textAlign = 'center'; ctx.font = 'bold 50px Courier New';
        ctx.fillText('DATA UPLOAD COMPLETE', canvas.width/2, canvas.height/2 - 100);
        ctx.font = '30px Courier New'; ctx.fillText('FINAL SCORE: ' + score, canvas.width/2, canvas.height/2 - 30);
        ctx.fillStyle = '#bc13fe'; ctx.fillText('MODE BEST: ' + highScores[gameState], canvas.width/2, canvas.height/2 + 20);
        uiContainer.style.display = 'flex';
        return;
    }

    let newLevel = Math.floor(score / 500) + 1;
    if (newLevel > currentLevel) {
        currentLevel = newLevel;
        levelUpFrames = 40;
        glitchFrames = 15;
        megaBombSpawnedThisLevel = false;
        labels.push(new Label(canvas.width/2, canvas.height/2, "SYSTEM REBOOT: L" + currentLevel, "#ffffff", 45));
    }

    if (gameState === 'ZEN') {
        let now = Date.now();
        if (now - lastTime >= 1000) { timeLeft--; lastTime = now; if (timeLeft <= 0) gameOver = true; }
    }

    ctx.save();
    if (glitchFrames > 0) { glitchFrames--; ctx.translate((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20); }

    difficultyMultiplier = (gameState === 'ZEN') ? 1 + (score / 2200) : 1 + (score / 1800);
    ctx.drawImage(bgCanvas, 0, 0);

    let levelIdx = (currentLevel - 1) % levelColors.length;
    let baseColor = levelColors[levelIdx];

    if (critFlashFrames > 0) { ctx.fillStyle = `rgba(255, 255, 255, ${critFlashFrames/10})`; critFlashFrames--; }
    else if (frenzyFrames > 0) { ctx.fillStyle = `rgba(254, 238, 16, ${Math.sin(Date.now()/50)>0?0.2:0.05})`; }
    else { ctx.fillStyle = baseColor + "12"; }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ambientParticles.forEach(p => {
        p.y += p.vy;
        if (p.y > canvas.height) { p.y = -p.length; p.x = Math.random() * canvas.width; }
        ctx.strokeStyle = "rgba(255, 255, 255, " + p.opacity + ")";
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + p.length); ctx.stroke();
    });

    for (let i = burstParticles.length - 1; i >= 0; i--) {
        let p = burstParticles[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        if (p.life <= 0) burstParticles.splice(i, 1);
    }
    ctx.globalAlpha = 1.0;

    if (slowMoFrames > 0) slowMoFrames--;
    if (frenzyFrames > 0) frenzyFrames--;

    let spawnRate = (frenzyFrames > 0) ? 0.22 : (0.04 + (score / 16000));
    if (Math.random() < spawnRate) {
        let type = "fruit";
        if (frenzyFrames > 0) type = "fruit";
        else {
            let rand = Math.random();
            if (score > 300 && !megaBombSpawnedThisLevel && rand < 0.02) { 
                type = "megabomb"; megaBombSpawnedThisLevel = true; 
            }
            else if (rand < 0.12) type = "bomb";
            else if (rand < 0.15) type = "slowmo";
            else if (rand < 0.17) type = "frenzy";
        }
        fruits.push(new GameObject(type));
    }

    if (mouse.isDown) { trail.push({ x: mouse.x, y: mouse.y }); if (trail.length > 15) trail.shift(); }
    else { if (trail.length > 0) trail.shift(); }

    if (Date.now() - lastSliceTime > comboTimeout) { comboCount = 0; }

    for (let i = fruits.length - 1; i >= 0; i--) {
        const f = fruits[i]; f.update(); f.draw();
        const dist = Math.hypot(mouse.x - f.x, mouse.y - f.y);
        
        if (mouse.isDown && dist < f.size && !f.isHalf) {
            if (f.type === "bomb") {
                lives--; score = Math.max(0, score - 50); glitchFrames = 20; comboCount = 0;
                labels.push(new Label(f.x, f.y, "CRITICAL ERROR", "#ff3131", 30));
                fruits.splice(i, 1); if (lives <= 0) gameOver = true;
            } else if (f.type === "megabomb") {
                f.hitsNeeded--;
                mouse.isDown = false; 
                if (f.hitsNeeded <= 0) {
                    score += 100; createSplash(f.x, f.y, "#ffffff");
                    triggerDefragmentation(f.x, f.y);
                    labels.push(new Label(f.x, f.y, "CORE DEFRAGMENTED +100", "#00ff9f", 28));
                    fruits.splice(i, 1);
                }
            } else if (f.type === "slowmo") {
                slowMoFrames = 200; labels.push(new Label(f.x, f.y, "TIME_WARP.exe", "#00f2ff")); fruits.splice(i, 1);
            } else if (f.type === "frenzy") {
                frenzyFrames = 300; labels.push(new Label(f.x, f.y, "OVERCLOCK_MODE", "#feee10")); fruits.splice(i, 1);
            } else {
                createSplash(f.x, f.y, f.color);
                lastSliceTime = Date.now();
                comboCount++;
                
                // --- BALANCED COMBO MATH ---
                let basePoints = 10;
                let comboBonus = 0;
                if (comboCount > 2) {
                    comboBonus = (comboCount > 5) ? 2 : 1; // Small flat bonuses
                }
                
                if (Math.random() < 0.03) { 
                    basePoints *= 2; // Critical reduced from 3x to 2x
                    critFlashFrames = 10; 
                    labels.push(new Label(f.x, f.y, "SYNC", "#ffffff", 28)); 
                }

                score += (basePoints + comboBonus);

                let h1 = new GameObject("fruit"); Object.assign(h1, {x: f.x, y: f.y, size: f.size, color: f.color, speedX: f.speedX-4, speedY: f.speedY, isHalf: true, side: -1});
                let h2 = new GameObject("fruit"); Object.assign(h2, {x: f.x, y: f.y, size: f.size, color: f.color, speedX: f.speedX+4, speedY: f.speedY, isHalf: true, side: 1});
                fruits.push(h1, h2); fruits.splice(i, 1);
            }
        } else if (f.y > canvas.height + 200) {
            if (f.type === "megabomb" && !f.isHalf) { 
                lives--; glitchFrames = 30; 
                labels.push(new Label(canvas.width/2, 100, "SYSTEM BREACH", "#ff3131", 35));
                if (lives <= 0) gameOver = true;
            }
            fruits.splice(i, 1);
        }
    }

    if (levelUpFrames > 0) {
        ctx.fillStyle = "rgba(0, 242, 255, 0.1)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        for(let i=0; i<20; i++) {
            ctx.fillStyle = "#00f2ff"; ctx.fillText(String.fromCharCode(0x30A0 + Math.random() * 96), Math.random()*canvas.width, Math.random()*canvas.height);
        }
        levelUpFrames--;
    }

    for (let i = labels.length - 1; i >= 0; i--) { labels[i].update(); labels[i].draw(); if (labels[i].life <= 0) labels.splice(i, 1); }

    if (trail.length >= 2) {
        ctx.shadowBlur = 25; ctx.shadowColor = (frenzyFrames > 0) ? '#feee10' : baseColor;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath();
        for (let i = 0; i < trail.length - 1; i++) { ctx.globalAlpha = i / trail.length; ctx.moveTo(trail[i].x, trail[i].y); ctx.lineTo(trail[i+1].x, trail[i+1].y); ctx.stroke(); }
    }
    
    ctx.restore();
    ctx.textAlign = 'left'; ctx.fillStyle = baseColor; ctx.font = 'bold 28px Courier New';
    ctx.fillText('> L' + currentLevel + ' ' + gameState, 30, 50);
    ctx.fillText('> SCORE: ' + score, 30, 90);
    if (comboCount >= 2) { ctx.fillStyle = '#ffffff'; ctx.fillText(`> COMBO: x${comboCount}`, 30, 130); }
    ctx.textAlign = 'right';
    if (gameState === 'ZEN') { ctx.fillStyle = (timeLeft <= 10) ? '#ff0055' : '#00ff9f'; ctx.fillText('TIME: ' + timeLeft + 's', canvas.width - 30, 50); }
    else { ctx.fillStyle = '#ff0055'; ctx.fillText('HEALTH: ' + 'X'.repeat(3-lives) + '_'.repeat(lives), canvas.width - 30, 50); }

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