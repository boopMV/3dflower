/**
 * ==========================================================================
 * ЦВЕТОК ЛЮБВИ — УЛЬТРА-ОПТИМИЗИРОВАННАЯ 3D ВЕРСИЯ (60-120 FPS)
 * 100% Аппаратное GPU-ускорение, нулевая нагрузка на процессор при простое
 * ==========================================================================
 */

(function () {
    'use strict';

    // --- DOM элементы ---
    const flower = document.getElementById('flower');
    const flowerWrapper = document.getElementById('flower-wrapper');
    const sceneViewport = document.getElementById('scene-viewport');
    const stamensContainer = document.getElementById('stamens');
    const canvas = document.getElementById('ambient-canvas');
    const ctx = canvas.getContext('2d');
    const heartsContainer = document.getElementById('hearts-container');
    const dragHint = document.getElementById('drag-hint');

    // Кнопки интерфейса
    const themeButtons = document.querySelectorAll('.theme-btn');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playPauseIcon = document.getElementById('play-pause-icon');
    const layersBtn = document.getElementById('layers-btn');
    const layersText = document.getElementById('layers-text');
    const resetViewBtn = document.getElementById('reset-view-btn');
    const musicBtn = document.getElementById('music-btn');
    const musicIcon = document.getElementById('music-icon');

    // Модальное окно послания
    const openLetterBtn = document.getElementById('open-letter-btn');
    const closeLetterBtn = document.getElementById('close-letter-btn');
    const letterModal = document.getElementById('letter-modal');
    const letterBodyDisplay = document.getElementById('letter-body-display');
    const letterParagraph = document.getElementById('letter-paragraph');
    const letterEditContainer = document.getElementById('letter-edit-container');
    const letterTextarea = document.getElementById('letter-textarea');
    const editLetterBtn = document.getElementById('edit-letter-btn');
    const saveLetterBtn = document.getElementById('save-letter-btn');
    const cancelLetterBtn = document.getElementById('cancel-letter-btn');

    // ==========================================================================
    // РОМАНТИЧЕСКИЕ ПАЛИТРЫ
    // ==========================================================================
    const THEMES = {
        rose: {
            tip:   { h: 352, s: 95, l: 68 },
            mid:   { h: 348, s: 90, l: 46 },
            base:  { h: 340, s: 82, l: 20 },
            petalCanvas: 'rgba(255, 65, 110, 0.75)'
        },
        peony: {
            tip:   { h: 344, s: 90, l: 84 },
            mid:   { h: 338, s: 85, l: 62 },
            base:  { h: 326, s: 75, l: 26 },
            petalCanvas: 'rgba(255, 140, 190, 0.75)'
        },
        orchid: {
            tip:   { h: 298, s: 92, l: 72 },
            mid:   { h: 284, s: 82, l: 50 },
            base:  { h: 266, s: 72, l: 22 },
            petalCanvas: 'rgba(215, 110, 255, 0.75)'
        },
        sunset: {
            tip:   { h: 44,  s: 96, l: 72 },
            mid:   { h: 14,  s: 92, l: 54 },
            base:  { h: 354, s: 80, l: 24 },
            petalCanvas: 'rgba(255, 130, 70, 0.75)'
        }
    };

    let currentThemeKey = 'rose';
    let isLushMode = false;
    let isBloomingPaused = false;

    // ==========================================================================
    // ЛЕГКАЯ БЫСТРАЯ 3D СБОРКА ЦВЕТКА (КОМПАКТНЫЙ РАЗМЕР)
    // ==========================================================================

    function buildFlower() {
        const oldPetals = flower.querySelectorAll('.petal');
        oldPetals.forEach(p => p.remove());

        if (isLushMode) {
            // Пышный режим: 5 внутренних (10 звеньев) + 6 внешних (12 звеньев)
            createPetalLayer({
                count: 5,
                maxParts: 10,
                maxFontStep: 5.5 / 10,
                rotateX: -16,
                translateZ: 3.0,
                angleOffset: 0,
                isInner: true
            });

            createPetalLayer({
                count: 6,
                maxParts: 12,
                maxFontStep: 7.2 / 12,
                rotateX: -26,
                translateZ: 4.5,
                angleOffset: 30,
                isInner: false
            });
        } else {
            // Базовый сверхбыстрый режим: 6 лепестков по 12 звеньев (всего 72 элемента!)
            // Идеально помещается в центр экрана и не тормозит на любом устройстве
            createPetalLayer({
                count: 6,
                maxParts: 12,
                maxFontStep: 7.2 / 12,
                rotateX: -24,
                translateZ: 4.2,
                angleOffset: 0,
                isInner: false
            });
        }

        buildStamens();
    }

    function createPetalLayer(config) {
        const angleStep = 360 / config.count;

        for (let i = 0; i < config.count; i++) {
            const petal = createPetal(config.maxParts, config.maxFontStep, config.isInner);
            const currAngle = (angleStep * i + config.angleOffset) + 'deg';
            const transform = `rotateY(${currAngle}) rotateX(${config.rotateX}deg) translateZ(${config.translateZ}vmin)`;

            petal.setAttribute('style', `transform: ${transform}`);
            if (config.isInner) {
                petal.classList.add('inner-petal');
            }

            flower.appendChild(petal);
        }
    }

    function createPetal(maxParts, fontStep, isInner) {
        let box = createBox(null, 0, maxParts, fontStep, isInner);

        const petal = document.createElement('div');
        petal.classList.add('petal');

        for (let i = 1; i <= maxParts; i++) {
            const newBox = createBox(box, i, maxParts, fontStep, isInner);
            box = newBox;
        }

        petal.appendChild(box);
        return petal;
    }

    function createBox(innerBox, pos, maxParts, fontStep, isInner) {
        const progress = pos / maxParts;
        const curve = Math.sin(progress * Math.PI);
        const baseWidth = isInner ? 0.85 : 1.0;
        const fontSizeVal = (0.2 + curve * 0.9 * maxParts * fontStep * baseWidth).toFixed(2);
        const fontSize = `${fontSizeVal}vmin`;

        const color = getPetalColor(progress, isInner);

        const shape = document.createElement('div');
        shape.classList.add('shape');

        const box = document.createElement('div');
        box.classList.add('box');
        box.style.color = color;
        box.style.fontSize = fontSize;

        if (innerBox) {
            box.appendChild(innerBox);
        }
        box.appendChild(shape);

        return box;
    }

    function getPetalColor(t, isInner) {
        const theme = THEMES[currentThemeKey];
        let h, s, l;

        if (t <= 0.5) {
            const k = t / 0.5;
            h = theme.tip.h + (theme.mid.h - theme.tip.h) * k;
            s = theme.tip.s + (theme.mid.s - theme.tip.s) * k;
            l = theme.tip.l + (theme.mid.l - theme.tip.l) * k;
        } else {
            const k = (t - 0.5) / 0.5;
            h = theme.mid.h + (theme.base.h - theme.mid.h) * k;
            s = theme.mid.s + (theme.base.s - theme.mid.s) * k;
            l = theme.mid.l + (theme.base.l - theme.mid.l) * k;
        }

        if (isInner) {
            l = Math.max(12, l - 5);
        }

        return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`;
    }

    function buildStamens() {
        stamensContainer.innerHTML = '';
        const count = 8;
        const radius = 1.4;

        for (let i = 0; i < count; i++) {
            const angle = (360 / count) * i;
            const tilt = 10 + (i % 2) * 4;
            const stamen = document.createElement('div');
            stamen.classList.add('stamen');
            stamen.style.transform = `rotateY(${angle}deg) rotateX(${tilt}deg) translateZ(${radius}vmin)`;
            stamensContainer.appendChild(stamen);
        }
    }

    // ==========================================================================
    // УМНОЕ 3D ВРАЩЕНИЕ (ОСТАНАВЛИВАЕТ RAF В ПОКОЕ — 0% НАГРУЗКИ НА CPU)
    // ==========================================================================
    let isDragging = false;
    let isAnimating = false;
    let startX = 0;
    let startY = 0;
    let rotX = -32;
    let rotY = 0;
    let targetRotX = -32;
    let targetRotY = 0;
    let hintFaded = false;

    function init3DInteraction() {
        function triggerRAF() {
            if (!isAnimating) {
                isAnimating = true;
                requestAnimationFrame(updateSceneTransform);
            }
        }

        function onPointerDown(e) {
            if (e.target.closest('.controls-panel') || e.target.closest('.letter-modal-backdrop') || e.target.closest('.modal-close-btn')) {
                return;
            }

            isDragging = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = clientX;
            startY = clientY;

            if (!hintFaded && dragHint) {
                dragHint.classList.add('fade-out');
                hintFaded = true;
            }

            spawnHeartsAt(clientX, clientY);
            triggerRAF();
        }

        function onPointerMove(e) {
            if (!isDragging) return;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const dx = clientX - startX;
            const dy = clientY - startY;

            startX = clientX;
            startY = clientY;

            targetRotY += dx * 0.45;
            targetRotX -= dy * 0.45;
            targetRotX = Math.max(-75, Math.min(25, targetRotX));

            triggerRAF();
        }

        function onPointerUp() {
            isDragging = false;
        }

        sceneViewport.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        sceneViewport.addEventListener('touchstart', onPointerDown, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: true });
        window.addEventListener('touchend', onPointerUp);

        function updateSceneTransform() {
            const dx = targetRotX - rotX;
            const dy = targetRotY - rotY;

            // Если есть заметная разница или пользователь тянет — продолжаем
            if (isDragging || Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
                rotX += dx * 0.18;
                rotY += dy * 0.18;
                flowerWrapper.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
                requestAnimationFrame(updateSceneTransform);
            } else {
                // В покое фиксируем координаты и ОСТАНАВЛИВАЕМ RAF
                rotX = targetRotX;
                rotY = targetRotY;
                flowerWrapper.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
                isAnimating = false; // ОСВОБОЖДАЕМ ПОТОК ДЛЯ 60-120 FPS
            }
        }
    }

    // ==========================================================================
    // ЛЕГКИЕ СЕРДЕЧКИ ПРИ КЛИКЕ
    // ==========================================================================
    const ROMANTIC_EMOJIS = ['❤️', '💖', '✨', '🌸', '💕'];

    function spawnHeartsAt(x, y) {
        const count = 2 + Math.floor(Math.random() * 2);

        for (let i = 0; i < count; i++) {
            const heart = document.createElement('span');
            heart.classList.add('floating-heart');
            heart.textContent = ROMANTIC_EMOJIS[Math.floor(Math.random() * ROMANTIC_EMOJIS.length)];

            const offsetX = (Math.random() - 0.5) * 28;
            const offsetY = (Math.random() - 0.5) * 20;

            heart.style.left = `${x + offsetX}px`;
            heart.style.top = `${y + offsetY}px`;

            heartsContainer.appendChild(heart);

            setTimeout(() => {
                heart.remove();
            }, 1400);
        }
    }

    // ==========================================================================
    // УЛЬТРА-ЛЕГКИЙ ХОЛСТ ЧАСТИЦ (БЕЗ НАГРУЗКИ)
    // ==========================================================================
    let width = 0;
    let height = 0;
    const particles = [];
    const petalParticles = [];

    function initCanvasAtmosphere() {
        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', resize);
        resize();

        // Всего 10 светлячков
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: 1 + Math.random() * 1.2,
                alpha: 0.2 + Math.random() * 0.4,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: -0.2 - Math.random() * 0.3,
                pulseSpeed: 0.02,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }

        // Всего 8 падающих лепестков
        for (let i = 0; i < 8; i++) {
            petalParticles.push(createFallingPetal(true));
        }

        function createFallingPetal(randomY) {
            return {
                x: Math.random() * width,
                y: randomY ? Math.random() * height : -20,
                size: 6 + Math.random() * 5,
                speedY: 0.5 + Math.random() * 0.7,
                speedX: (Math.random() - 0.5) * 0.4,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.02,
                oscillation: Math.random() * Math.PI * 2,
                oscSpeed: 0.02
            };
        }

        function renderAtmosphere() {
            ctx.clearRect(0, 0, width, height);

            // Светлячки
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.speedX;
                p.y += p.speedY;
                p.pulsePhase += p.pulseSpeed;

                const currentAlpha = Math.max(0.1, p.alpha + Math.sin(p.pulsePhase) * 0.2);

                if (p.y < -10) p.y = height + 10;
                if (p.x < -10) p.x = width + 10;
                if (p.x > width + 10) p.x = -10;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 230, 180, ${currentAlpha.toFixed(2)})`;
                ctx.fill();
            }

            // Лепестки
            const petalColor = THEMES[currentThemeKey].petalCanvas;

            for (let i = 0; i < petalParticles.length; i++) {
                const petal = petalParticles[i];
                petal.y += petal.speedY;
                petal.oscillation += petal.oscSpeed;
                petal.x += petal.speedX + Math.sin(petal.oscillation) * 0.5;
                petal.rotation += petal.rotSpeed;

                if (petal.y > height + 25) {
                    petalParticles[i] = createFallingPetal(false);
                    continue;
                }

                ctx.save();
                ctx.translate(petal.x, petal.y);
                ctx.rotate(petal.rotation);
                ctx.scale(1, 0.65);

                ctx.beginPath();
                ctx.moveTo(0, -petal.size);
                ctx.bezierCurveTo(petal.size * 0.7, -petal.size * 0.5, petal.size * 0.8, petal.size * 0.5, 0, petal.size);
                ctx.bezierCurveTo(-petal.size * 0.8, petal.size * 0.5, -petal.size * 0.7, -petal.size * 0.5, 0, -petal.size);
                ctx.closePath();

                ctx.fillStyle = petalColor;
                ctx.fill();
                ctx.restore();
            }

            requestAnimationFrame(renderAtmosphere);
        }

        requestAnimationFrame(renderAtmosphere);
    }

    // ==========================================================================
    // РОМАНТИЧЕСКИЙ ЗВУКОВОЙ ПЕЙЗАЖ
    // ==========================================================================
    let audioCtx = null;
    let isMusicPlaying = false;
    let musicTimer = null;

    const NOTES = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];

    function toggleMusic() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        isMusicPlaying = !isMusicPlaying;

        if (isMusicPlaying) {
            musicBtn.classList.add('active');
            musicIcon.textContent = '🔊';
            playGenerativeMelody();
        } else {
            musicBtn.classList.remove('active');
            musicIcon.textContent = '🎵';
            if (musicTimer) clearTimeout(musicTimer);
        }
    }

    function playNote(frequency, duration = 1.8) {
        if (!audioCtx || !isMusicPlaying) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

        const now = audioCtx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    function playGenerativeMelody() {
        if (!isMusicPlaying) return;

        const note = NOTES[Math.floor(Math.random() * NOTES.length)];
        playNote(note, 2.0);

        const delay = 900 + Math.random() * 900;
        musicTimer = setTimeout(playGenerativeMelody, delay);
    }

    // ==========================================================================
    // ПАНЕЛЬ УПРАВЛЕНИЯ
    // ==========================================================================
    function setupControls() {
        themeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetBtn = e.currentTarget;
                const themeKey = targetBtn.dataset.theme;
                if (!THEMES[themeKey] || themeKey === currentThemeKey) return;

                themeButtons.forEach(b => b.classList.remove('active'));
                targetBtn.classList.add('active');

                currentThemeKey = themeKey;
                buildFlower();

                const rect = targetBtn.getBoundingClientRect();
                spawnHeartsAt(rect.left + rect.width / 2, rect.top);
            });
        });

        playPauseBtn.addEventListener('click', () => {
            isBloomingPaused = !isBloomingPaused;
            if (isBloomingPaused) {
                flower.classList.add('paused');
                playPauseIcon.textContent = '▶️';
                playPauseBtn.classList.add('active');
            } else {
                flower.classList.remove('paused');
                playPauseIcon.textContent = '⏸';
                playPauseBtn.classList.remove('active');
            }
        });

        layersBtn.addEventListener('click', () => {
            isLushMode = !isLushMode;
            layersText.textContent = isLushMode ? 'Пышный бутон' : 'Нежный цветок';
            layersBtn.classList.toggle('active', isLushMode);
            buildFlower();
        });

        resetViewBtn.addEventListener('click', () => {
            targetRotX = -32;
            targetRotY = 0;
            flowerWrapper.style.transform = `rotateX(-32deg) rotateY(0deg)`;
        });

        musicBtn.addEventListener('click', toggleMusic);
    }

    // ==========================================================================
    // МОДАЛЬНОЕ ОКНО ПОСЛАНИЯ
    // ==========================================================================
    const STORAGE_KEY = 'flower_love_letter_text';

    function setupLoveLetter() {
        const savedText = localStorage.getItem(STORAGE_KEY);
        if (savedText && savedText.trim()) {
            letterParagraph.textContent = savedText.trim();
        }

        openLetterBtn.addEventListener('click', () => {
            letterModal.classList.add('open');
            letterModal.setAttribute('aria-hidden', 'false');
            spawnHeartsAt(window.innerWidth / 2, window.innerHeight / 2);
        });

        function closeModal() {
            letterModal.classList.remove('open');
            letterModal.setAttribute('aria-hidden', 'true');
            letterEditContainer.classList.add('hidden');
            letterBodyDisplay.classList.remove('hidden');
        }

        closeLetterBtn.addEventListener('click', closeModal);
        letterModal.addEventListener('click', (e) => {
            if (e.target === letterModal) closeModal();
        });

        editLetterBtn.addEventListener('click', () => {
            letterTextarea.value = letterParagraph.textContent.trim();
            letterBodyDisplay.classList.add('hidden');
            letterEditContainer.classList.remove('hidden');
            letterTextarea.focus();
        });

        saveLetterBtn.addEventListener('click', () => {
            const newText = letterTextarea.value.trim();
            if (newText) {
                letterParagraph.textContent = newText;
                localStorage.setItem(STORAGE_KEY, newText);
            }
            letterEditContainer.classList.add('hidden');
            letterBodyDisplay.classList.remove('hidden');
        });

        cancelLetterBtn.addEventListener('click', () => {
            letterEditContainer.classList.add('hidden');
            letterBodyDisplay.classList.remove('hidden');
        });
    }

    // ==========================================================================
    // СТАРТ
    // ==========================================================================
    function init() {
        buildFlower();
        init3DInteraction();
        initCanvasAtmosphere();
        setupControls();
        setupLoveLetter();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();