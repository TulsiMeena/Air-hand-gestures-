class AdvancedGestureGame {
  constructor() {
    this.videoElement = document.getElementsByClassName('input_video')[0];
    this.canvasElement = document.getElementsByClassName('output_canvas')[0];
    this.canvasCtx = this.canvasElement.getContext('2d');
    this.gestureText = document.getElementById('gestureText');
    this.status = document.getElementById('status');
    this.scoreElement = document.getElementById('score');
    this.comboElement = document.getElementById('combo');
    this.bubblesElement = document.getElementById('bubbles');
    this.highScoreElement = document.getElementById('highScore');
    this.timerElement = document.getElementById('timer');

    // Camera state
    this.cameraStarted = false;
    this.camera = null;
    this.hands = null;

    // Game state
    this.currentGesture = 'None';
    this.gestureHistory = [];
    this.maxHistoryLength = 5;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('gestureGameHighScore')) || 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lastGestureTime = 0;

    // Advanced game features
    this.powerUps = [];
    this.achievements = [];
    this.gameTime = 0;
    this.gameStartTime = Date.now();
    this.multiplier = 1;
    this.freezeTime = 0;
    this.specialEffects = [];
    this.soundEnabled = true;
    this.timeRemaining = 60;
    this.gameActive = true;

    // Sound effects
    this.audioContext = null;
    this.sounds = {};

    // Speech synthesis
    this.speechEnabled = true;
    this.speechSynthesis = null;
    this.voices = [];
    this.selectedVoice = null;

    // Advanced bubble game properties
    this.bubbles = [];
    this.bubbleSpawnRate = 800;
    this.lastBubbleSpawn = 0;
    this.bubblesPopped = 0;
    this.maxBubbles = 10;
    this.gameLevel = 1;

    // Advanced game features
    this.powerUpsActive = [];
    this.slowMotionActive = false;
    this.doublePointsActive = false;
    this.rapidFireActive = false;
    this.shieldActive = false;
    this.magnetActive = false;

    // Visual effects
    this.particles = [];
    this.gestureTrail = [];
    this.backgroundParticles = [];

    // Performance settings
    this.lastFrameTime = 0;
    this.targetFPS = 30;
    this.frameInterval = 1000 / this.targetFPS;
    this.performanceMode = true;
    this.skipFrames = 0;

    // Gesture confidence tracking
    this.gestureConfidence = {};
    this.gestureThreshold = 3;

    // Custom Gesture Memory ("Smriti")
    this.magicGesture = null;
    this.isRecordingGesture = false;
    this.magicCooldown = 0;

    this.initializeGame();
  }

  initializeGame() {
    this.gameCameraQuality = '1080p'; // Default game camera quality
    this.setupEventListeners();
    this.startGameLoop();
    this.createBackgroundParticles();
    this.startBackgroundAnimation();
    this.initializeAudio();
    this.status.textContent = '🎮 Welcome! Game is ready to play!';
    this.status.style.color = '#00ff88';

    if (this.highScoreElement) {
      this.highScoreElement.textContent = this.highScore;
    }

    // Setup game camera quality controls
    this.setupGameCameraControls();

    // Setup Play Again button
    const playAgainBtn = document.getElementById('playAgainBtn');
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        this.restartGame();
      });
    }

    // Setup Magic Gesture button
    const recordGestureBtn = document.getElementById('recordGestureBtn');
    if (recordGestureBtn) {
      recordGestureBtn.addEventListener('click', () => {
        this.startMagicRecording();
      });
    }

    // Auto-start camera since user is authenticated
    setTimeout(() => {
      this.startCamera();
    }, 1000);
  }

  setupGameCameraControls() {
    const gameQualitySelect = document.getElementById('gameQualitySelect');
    if (gameQualitySelect) {
      gameQualitySelect.addEventListener('change', (e) => {
        this.gameCameraQuality = e.target.value;
        console.log(`Game camera quality changed to: ${this.gameCameraQuality}`);
      });
    }

    const gameCameraOptimize = document.getElementById('gameCameraOptimize');
    if (gameCameraOptimize) {
      gameCameraOptimize.addEventListener('click', () => {
        this.optimizeGameCamera();
      });
    }
  }

  async optimizeGameCamera() {
    try {
      this.status.textContent = '⚡ Optimizing game camera for maximum performance...';
      this.status.style.color = '#ffa500';

      if (this.camera) {
        this.camera.stop();
      }

      // Restart camera with new quality
      await this.startCamera();

      this.status.textContent = `✅ Game camera optimized for ${this.gameCameraQuality} gaming!`;
      this.status.style.color = '#00ff88';

      this.speakText(`Game camera optimized for ${this.gameCameraQuality} gaming! Maximum performance enabled Sir!`);

    } catch (error) {
      console.error('Game camera optimization failed:', error);
      this.status.textContent = '❌ Game camera optimization failed. Using current settings.';
      this.status.style.color = '#ff6464';
    }
  }

  async initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.createSoundEffects();
      this.initializeSpeech();
    } catch (error) {
      console.log('Audio not available:', error);
      this.soundEnabled = false;
    }
  }

  initializeSpeech() {
    if ('speechSynthesis' in window) {
      this.speechEnabled = true;
      this.speechSynthesis = window.speechSynthesis;
      this.getVoices();

      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.getVoices();
      }
    } else {
      this.speechEnabled = false;
    }
  }

  getVoices() {
    this.voices = this.speechSynthesis.getVoices();
    this.selectedVoice = this.voices.find(voice =>
      voice.lang.includes('hi') || voice.lang.includes('Hindi')
    ) || this.voices.find(voice => voice.lang.includes('en')) || this.voices[0];
  }

  speakText(text) {
    if (!this.speechEnabled || !this.soundEnabled) return;

    this.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.rate = 1.1;
    utterance.pitch = 1.2;
    utterance.volume = 0.8;

    this.speechSynthesis.speak(utterance);
  }

  createSoundEffects() {
    this.sounds.pop = (frequency = 800) => {
      if (!this.soundEnabled || !this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.3, this.audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.1);
    };

    this.sounds.specialPop = () => {
      if (!this.soundEnabled || !this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.2);
    };

    this.sounds.combo = () => {
      if (!this.soundEnabled || !this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1000, this.audioContext.currentTime + 0.15);

      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.15);
    };
  }

  async startCamera() {
    if (this.cameraStarted) return;

    try {
      this.status.textContent = '🚀 Starting game camera...';
      this.status.style.color = '#ffa500';

      await this.initializeHands();
      await this.initializeCamera();

      this.cameraStarted = true;
      document.getElementById('cameraBtn').textContent = '📷 Camera Active';
      document.getElementById('cameraBtn').classList.add('active');

    } catch (error) {
      console.error('Game camera failed to start:', error);
      this.status.textContent = '❌ Game camera failed. Please check permissions.';
      this.status.style.color = '#ff6464';
    }
  }

  initializeHands() {
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.hands.onResults(this.onResults.bind(this));
  }

  async initializeCamera() {
    try {
      const quality = this.gameCameraQuality || '1080p';
      const qualitySettings = {
        '4K': { width: 3840, height: 2160, frameRate: 30 },
        '1080p': { width: 1920, height: 1080, frameRate: 60 },
        '720p': { width: 1280, height: 720, frameRate: 60 }
      };

      const settings = qualitySettings[quality];
      const constraints = {
        video: {
          width: { ideal: settings.width, min: settings.width * 0.5 },
          height: { ideal: settings.height, min: settings.height * 0.5 },
          facingMode: 'user',
          frameRate: { ideal: settings.frameRate, min: 15 },
          aspectRatio: { ideal: 16/9 }
        }
      };

      console.log(`Initializing ${quality} game camera...`);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = stream;

      await new Promise((resolve) => {
        this.videoElement.onloadeddata = resolve;
      });

      this.camera = new Camera(this.videoElement, {
        onFrame: async () => {
          if (this.videoElement.readyState === 4) {
            try {
              await this.hands.send({ image: this.videoElement });
            } catch (error) {
              console.log('Hand processing error (non-critical):', error.message);
            }
          }
        },
        width: 1280,
        height: 720,
        facingMode: 'user'
      });

      await this.camera.start();

      this.status.textContent = '🎮 Game camera ready! Start playing with hand gestures!';
      this.status.style.color = '#00ff88';

      setTimeout(() => {
        this.resizeCanvas();
      }, 500);

    } catch (error) {
      throw error;
    }
  }

  onResults(results) {
    const currentTime = performance.now();

    if (currentTime - this.lastFrameTime < 16) {
      return;
    }
    this.lastFrameTime = currentTime;

    requestAnimationFrame(() => {
      this.canvasCtx.save();
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

      this.drawBackground(results.image);

      if (!this.performanceMode && this.backgroundParticles.length < 20) {
        this.drawBackgroundEffects();
      }

      this.updateBubbles();
      this.drawBubbles();

      if (this.particles.length < 100) {
        this.updateParticles();
        this.drawParticles();
      } else {
        this.particles = this.particles.slice(0, 50);
      }

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // Handle Magic Gesture Recording
        if (this.isRecordingGesture) {
          this.captureMagicGesture(landmarks);
        } else if (this.magicGesture && Date.now() > this.magicCooldown) {
          this.detectMagicGesture(landmarks);
        }

        results.multiHandLandmarks.forEach((lms, index) => {
          this.drawOptimizedHand(lms, index);
          this.checkMultiFingerCollision(lms);
          this.drawGestureTrail(lms[8], index);
        });

        const gesture = this.recognizeAdvancedGesture(landmarks);
        this.updateGesture(gesture);
      } else {
        this.updateGesture('None');
      }

      this.drawGameUI();
      this.spawnBubbles();

      this.canvasCtx.restore();
    });
  }

  drawBackground(image) {
    this.canvasCtx.drawImage(image, 0, 0, this.canvasElement.width, this.canvasElement.height);

    const gradient = this.canvasCtx.createLinearGradient(0, 0, 0, this.canvasElement.height);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.05)');
    gradient.addColorStop(1, 'rgba(240, 147, 251, 0.05)');

    this.canvasCtx.fillStyle = gradient;
    this.canvasCtx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
  }

  recognizeAdvancedGesture(landmarks) {
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerPips = [3, 6, 10, 14, 18];

    const fingersUp = [];

    if (landmarks[fingerTips[0]].x > landmarks[fingerPips[0]].x) {
      fingersUp.push(1);
    } else {
      fingersUp.push(0);
    }

    for (let i = 1; i < 5; i++) {
      if (landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y) {
        fingersUp.push(1);
      } else {
        fingersUp.push(0);
      }
    }

    const totalFingers = fingersUp.reduce((sum, finger) => sum + finger, 0);

    if (totalFingers === 0) {
      return 'Fist';
    } else if (totalFingers === 1 && fingersUp[1] === 1) {
      return 'Point Up';
    } else if (totalFingers === 2 && fingersUp[1] === 1 && fingersUp[2] === 1) {
      return 'Peace Sign';
    } else if (this.isOKGesture(landmarks)) {
      return 'OK Sign';
    } else if (totalFingers === 5) {
      return 'Open Hand';
    } else if (this.isRockSign(landmarks, fingersUp)) {
      return 'Rock Sign';
    } else {
      return `${totalFingers} Fingers`;
    }
  }

  isOKGesture(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];

    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2)
    );

    return distance < 0.05;
  }

  isRockSign(landmarks, fingersUp) {
    return fingersUp[1] === 1 && fingersUp[4] === 1 &&
           fingersUp[2] === 0 && fingersUp[3] === 0;
  }

  startMagicRecording() {
    this.speakText("Get ready! Recording gesture in 3 seconds.");
    document.getElementById('magicStatus').textContent = "⏳ Get Ready...";

    setTimeout(() => {
      this.isRecordingGesture = true;
      document.getElementById('magicStatus').textContent = "📸 HOLD POSE!";
    }, 3000);
  }

  captureMagicGesture(landmarks) {
    // Normalize landmarks (relative to wrist)
    const wrist = landmarks[0];
    const normalized = landmarks.map(p => ({
      x: p.x - wrist.x,
      y: p.y - wrist.y,
      z: p.z - wrist.z
    }));

    this.magicGesture = normalized;
    this.isRecordingGesture = false;

    this.speakText("Gesture recorded! Use it to clear the screen.");
    document.getElementById('magicStatus').textContent = "✅ Gesture Active! Use it!";
    document.getElementById('recordGestureBtn').style.background = 'rgba(0, 255, 136, 0.3)';
    document.getElementById('recordGestureBtn').style.borderColor = '#00ff88';
  }

  detectMagicGesture(landmarks) {
    if (!this.magicGesture) return;

    const wrist = landmarks[0];
    let totalError = 0;

    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      const target = this.magicGesture[i];

      const dx = (p.x - wrist.x) - target.x;
      const dy = (p.y - wrist.y) - target.y;
      const dz = (p.z - wrist.z) - target.z;

      totalError += Math.sqrt(dx*dx + dy*dy + dz*dz);
    }

    const avgError = totalError / landmarks.length;

    // Threshold for detection (tune as needed)
    if (avgError < 0.08) {
      this.triggerMagicEffect();
    }
  }

  triggerMagicEffect() {
    this.magicCooldown = Date.now() + 2000; // 2s cooldown
    this.sounds.specialPop();
    this.speakText("Magic Gesture Detected! Screen Clear!");

    // Pop all bubbles
    this.bubbles.forEach(bubble => {
      this.createAdvancedPopEffect(bubble.x, bubble.y, 'rainbow');
      this.score += 50;
    });
    this.bubbles = [];
    this.scoreElement.textContent = this.score;

    // Visual flash
    this.canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.canvasCtx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
  }

  updateGesture(gesture) {
    this.gestureHistory.push(gesture);
    if (this.gestureHistory.length > this.maxHistoryLength) {
      this.gestureHistory.shift();
    }

    const gestureCount = {};
    this.gestureHistory.forEach(g => {
      gestureCount[g] = (gestureCount[g] || 0) + 1;
    });

    const mostCommonGesture = Object.keys(gestureCount).reduce((a, b) =>
      gestureCount[a] > gestureCount[b] ? a : b
    );

    if (mostCommonGesture !== this.currentGesture) {
      this.currentGesture = mostCommonGesture;
      this.gestureText.textContent = this.currentGesture;
      this.highlightAction(this.currentGesture);
      this.updateGameScore(this.currentGesture);

      this.gestureText.classList.add('active');
      setTimeout(() => {
        this.gestureText.classList.remove('active');
      }, 1000);
    }
  }

  highlightAction(gesture) {
    document.querySelectorAll('.action-item').forEach(item => {
      item.classList.remove('active');
    });

    const gestureMap = {
      'Point Up': 'action1',
      'Peace Sign': 'action2',
      'OK Sign': 'action3',
      'Fist': 'action4',
      'Open Hand': 'action5',
      'Rock Sign': 'action6'
    };

    if (gestureMap[gesture]) {
      const element = document.getElementById(gestureMap[gesture]);
      if (element) {
        element.classList.add('active');
      }
    }
  }

  updateGameScore(gesture) {
    const currentTime = Date.now();
    const recognizedGestures = ['Point Up', 'Peace Sign', 'OK Sign', 'Fist', 'Open Hand', 'Rock Sign'];

    if (recognizedGestures.includes(gesture)) {
      this.score += 15; // Increased base score

      if (currentTime - this.lastGestureTime < 2000 && this.lastGestureTime > 0) {
        this.combo += 1;
        this.score += this.combo * 8; // Higher combo bonus

        if (this.combo > this.maxCombo) {
          this.maxCombo = this.combo;
        }

        if (this.combo > 3) {
          this.sounds.combo();
          if (this.combo === 5) {
            this.speakText("Excellent combo Sir! You are amazing!");
          } else if (this.combo === 10) {
            this.speakText("Outstanding performance Sir! Master level achieved!");
          }
        }
      } else {
        this.combo = 0;
      }

      this.lastGestureTime = currentTime;
      this.updateGameLevel();
    } else if (gesture === 'None') {
      if (currentTime - this.lastGestureTime > 3000) {
        this.combo = 0;
      }
    }

    // Check and update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('gestureGameHighScore', this.highScore);
      if (this.highScoreElement) {
        this.highScoreElement.textContent = this.highScore;
      }
    }

    this.scoreElement.textContent = this.score;
    this.comboElement.textContent = this.combo;
  }

  updateGameLevel() {
    const newLevel = Math.floor(this.score / 500) + 1;
    if (newLevel > this.gameLevel) {
      this.gameLevel = newLevel;
      this.bubbleSpawnRate = Math.max(800, 1200 - (this.gameLevel * 100));
      this.maxBubbles = Math.min(10, 8 + this.gameLevel);

      this.createLevelUpEffect();
    }
  }

  spawnBubbles() {
    if (!this.gameActive) return;
    const currentTime = Date.now();
    if (currentTime - this.lastBubbleSpawn > this.bubbleSpawnRate && this.bubbles.length < this.maxBubbles) {
      const bubble = {
        x: 100 + Math.random() * (this.canvasElement.width - 200),
        y: this.canvasElement.height + 100,
        radius: 25 + Math.random() * 35,
        speed: 2 + Math.random() * 3 + (this.gameLevel * 0.3),
        color: `hsl(${Math.random() * 360}, 85%, 70%)`,
        opacity: 0.8 + Math.random() * 0.2,
        wobble: Math.random() * 0.02,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        id: Date.now() + Math.random(),
        specialType: this.getRandomBubbleType()
      };

      this.configureBubbleType(bubble);
      this.bubbles.push(bubble);
      this.lastBubbleSpawn = currentTime;
    }
  }

  getRandomBubbleType() {
    const rand = Math.random();
    if (rand < 0.05) return 'bomb';
    if (rand < 0.10) return 'diamond';
    if (rand < 0.20) return 'golden';
    if (rand < 0.30) return 'rainbow';
    if (rand < 0.45) return 'food';
    if (rand < 0.60) return 'animal';
    return 'normal';
  }

  configureBubbleType(bubble) {
    bubble.icon = '🎈'; // Default

    switch (bubble.specialType) {
      case 'golden':
        bubble.color = 'hsl(45, 100%, 70%)';
        bubble.radius *= 1.5;
        bubble.icon = ['🌟', '👑', '🏆', '📀'][Math.floor(Math.random() * 4)];
        break;
      case 'diamond':
        bubble.color = 'hsl(200, 100%, 90%)';
        bubble.radius *= 0.8;
        bubble.speed *= 0.7;
        bubble.icon = ['💎', '💍', '💠'][Math.floor(Math.random() * 3)];
        break;
      case 'rainbow':
        bubble.color = `hsl(${Date.now() * 0.1 % 360}, 100%, 70%)`;
        bubble.isRainbow = true;
        bubble.icon = ['🌈', '🎨', '🍭'][Math.floor(Math.random() * 3)];
        break;
      case 'bomb':
        bubble.color = 'hsl(0, 0%, 20%)';
        bubble.radius *= 1.2;
        bubble.wobble *= 2;
        bubble.icon = ['💣', '🧨', '💥'][Math.floor(Math.random() * 3)];
        break;
      case 'food':
        bubble.icon = ['🍎', '🍌', '🍕', '🍩', '🍓', '🍔', '🍇'][Math.floor(Math.random() * 7)];
        break;
      case 'animal':
        bubble.icon = ['🦋', '🐞', '🐦', '🦊', '🐼', '🦄'][Math.floor(Math.random() * 6)];
        bubble.speed *= 1.2; // Animals move faster
        break;
      case 'normal':
      default:
        bubble.icon = ['🎈', '🫧', '🔮', '🔵', '🟣', '🥎'][Math.floor(Math.random() * 6)];
        break;
    }
  }

  updateBubbles() {
    this.bubbles = this.bubbles.filter(bubble => {
      bubble.y -= bubble.speed;
      bubble.x += Math.sin(bubble.y * bubble.wobble) * 2;
      bubble.rotation += bubble.rotationSpeed;
      return bubble.y + bubble.radius > -100;
    });
  }

  drawBubbles() {
    this.bubbles.forEach(bubble => {
      this.canvasCtx.save();
      this.canvasCtx.translate(bubble.x, bubble.y);
      this.canvasCtx.rotate(bubble.rotation);
      this.canvasCtx.globalAlpha = bubble.opacity;

      // Draw bubble background (glow)
      const gradient = this.canvasCtx.createRadialGradient(0, 0, 0, 0, 0, bubble.radius);

      if (bubble.specialType === 'bomb') {
        gradient.addColorStop(0, 'rgba(255, 50, 50, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (bubble.specialType === 'golden') {
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }

      this.canvasCtx.fillStyle = gradient;
      this.canvasCtx.beginPath();
      this.canvasCtx.arc(0, 0, bubble.radius * 1.2, 0, 2 * Math.PI);
      this.canvasCtx.fill();

      // Draw the "Picture" (Emoji)
      this.canvasCtx.font = `${bubble.radius * 1.5}px Arial`;
      this.canvasCtx.textAlign = 'center';
      this.canvasCtx.textBaseline = 'middle';
      this.canvasCtx.fillStyle = 'white';

      // Shadow for better visibility
      this.canvasCtx.shadowColor = 'rgba(0,0,0,0.5)';
      this.canvasCtx.shadowBlur = 5;

      this.canvasCtx.fillText(bubble.icon, 0, 0);

      this.canvasCtx.restore();
    });
  }

  checkMultiFingerCollision(landmarks) {
    const fingerTips = [4, 8, 12, 16, 20];

    fingerTips.forEach(tipIndex => {
      this.checkBubbleCollision(landmarks[tipIndex]);
    });
  }

  checkBubbleCollision(fingerTip) {
    if (!fingerTip) return;

    const fingerX = fingerTip.x * this.canvasElement.width;
    const fingerY = fingerTip.y * this.canvasElement.height;

    this.bubbles = this.bubbles.filter(bubble => {
      const distance = Math.sqrt(
        Math.pow(fingerX - bubble.x, 2) + Math.pow(fingerY - bubble.y, 2)
      );

      if (distance < bubble.radius) {
        this.bubblesPopped++;

        if (bubble.specialType === 'bomb') {
          this.score = Math.max(0, this.score - 50);
          this.combo = 0;
          this.sounds.pop(150);
          this.speakText("Bomb! Oh no!");
          this.createAdvancedPopEffect(bubble.x, bubble.y, 'bomb');
        } else {
          let points = bubble.specialType === 'golden' ? 75 : 25; // Increased points
          this.score += points;
          this.combo += 1;

          if (bubble.specialType === 'golden') {
            this.sounds.specialPop();
            this.speakText("Golden bubble! Fantastic Sir!");
          } else if (bubble.specialType === 'diamond') {
            this.sounds.specialPop();
            this.speakText("Diamond hit! Incredible skill Sir!");
          } else if (bubble.specialType === 'rainbow') {
            this.sounds.specialPop();
            this.speakText("Rainbow power! Amazing Sir!");
          } else {
            this.sounds.pop(600 + Math.random() * 400);
            const encouragements = [
              "Excellent Sir!", "Perfect aim!", "Outstanding!",
              "Brilliant shot!", "Superb skills!", "Magnificent!"
            ];
            if (Math.random() < 0.3) {
              this.speakText(encouragements[Math.floor(Math.random() * encouragements.length)]);
            }
          }
          this.createAdvancedPopEffect(bubble.x, bubble.y, bubble.specialType);
        }

        // Check and update high score
        if (this.score > this.highScore) {
          this.highScore = this.score;
          localStorage.setItem('gestureGameHighScore', this.highScore);
          if (this.highScoreElement) {
            this.highScoreElement.textContent = this.highScore;
          }
        }

        this.scoreElement.textContent = this.score;
        this.comboElement.textContent = this.combo;
        this.bubblesElement.textContent = this.bubblesPopped;

        return false;
      }
      return true;
    });
  }

  createAdvancedPopEffect(x, y, specialType = 'normal') {
    const particleCount = specialType === 'golden' ? 30 : specialType === 'diamond' ? 25 : 15;
    let colors;

    switch(specialType) {
      case 'golden':
        colors = ['#FFD700', '#FFA500', '#FF8C00', '#FFFF00'];
        break;
      case 'diamond':
        colors = ['#B0E0E6', '#87CEEB', '#ADD8E6', '#F0F8FF'];
        break;
      case 'rainbow':
        colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        break;
      case 'bomb':
        colors = ['#000000', '#333333', '#FF0000', '#8B0000'];
        break;
      default:
        colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#F7DC6F', '#BB8FCE'];
    }

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 / particleCount) * i;
      const speed = 4 + Math.random() * 8;
      const particle = {
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'explosion',
        special: specialType
      };
      this.particles.push(particle);
    }

    // Add extra sparkle effect for special bubbles
    if (specialType !== 'normal') {
      for (let i = 0; i < 10; i++) {
        const sparkle = {
          x: x + (Math.random() - 0.5) * 50,
          y: y + (Math.random() - 0.5) * 50,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 1.5,
          decay: 0.015,
          size: 2 + Math.random() * 3,
          color: '#FFFFFF',
          type: 'sparkle'
        };
        this.particles.push(sparkle);
      }
    }
  }

  updateParticles() {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;

      if (particle.type === 'explosion') {
        particle.vy += 0.2;
        particle.vx *= 0.99;
      }

      return particle.life > 0;
    });
  }

  drawParticles() {
    this.particles.forEach(particle => {
      this.canvasCtx.save();
      this.canvasCtx.globalAlpha = particle.life;
      this.canvasCtx.fillStyle = particle.color;

      this.canvasCtx.beginPath();
      this.canvasCtx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
      this.canvasCtx.fill();

      this.canvasCtx.restore();
    });
  }

  drawOptimizedHand(landmarks, handIndex = 0) {
    this.canvasCtx.save();

    const handColors = ['#00FF88', '#FF8800'];
    const pointColors = ['#FF4444', '#4444FF'];

    this.canvasCtx.strokeStyle = handColors[handIndex % 2];
    this.canvasCtx.lineWidth = 2;

    drawConnectors(this.canvasCtx, landmarks, HAND_CONNECTIONS, {
      color: handColors[handIndex % 2],
      lineWidth: 2
    });

    this.canvasCtx.fillStyle = pointColors[handIndex % 2];

    drawLandmarks(this.canvasCtx, landmarks, {
      color: pointColors[handIndex % 2],
      lineWidth: 1,
      radius: 3
    });

    this.canvasCtx.restore();
  }

  drawGestureTrail(fingerTip, handIndex = 0) {
    if (!this.gestureTrail) this.gestureTrail = [];
    if (!this.gestureTrail[handIndex]) this.gestureTrail[handIndex] = [];

    const x = fingerTip.x * this.canvasElement.width;
    const y = fingerTip.y * this.canvasElement.height;

    this.gestureTrail[handIndex].push({ x, y, time: Date.now() });

    this.gestureTrail[handIndex] = this.gestureTrail[handIndex].filter(point => Date.now() - point.time < 1000);

    if (this.gestureTrail[handIndex].length > 2) {
      this.canvasCtx.save();

      const trailColors = ['rgba(255, 255, 255, 0.8)', 'rgba(255, 200, 100, 0.8)'];
      this.canvasCtx.strokeStyle = trailColors[handIndex % 2];
      this.canvasCtx.lineWidth = 4;
      this.canvasCtx.lineCap = 'round';
      this.canvasCtx.shadowColor = trailColors[handIndex % 2];
      this.canvasCtx.shadowBlur = 10;

      this.canvasCtx.beginPath();
      this.canvasCtx.moveTo(this.gestureTrail[handIndex][0].x, this.gestureTrail[handIndex][0].y);

      for (let i = 1; i < this.gestureTrail[handIndex].length; i++) {
        this.canvasCtx.lineTo(this.gestureTrail[handIndex][i].x, this.gestureTrail[handIndex][i].y);
      }

      this.canvasCtx.stroke();
      this.canvasCtx.restore();
    }
  }

  createBackgroundParticles() {
    for (let i = 0; i < 20; i++) {
      this.backgroundParticles.push({
        x: Math.random() * this.canvasElement.width,
        y: Math.random() * this.canvasElement.height,
        speed: 0.3 + Math.random() * 1,
        size: 1 + Math.random() * 2,
        opacity: 0.1 + Math.random() * 0.2,
        color: `hsl(${Math.random() * 360}, 70%, 70%)`
      });
    }
  }

  drawBackgroundEffects() {
    this.backgroundParticles.forEach(particle => {
      particle.y -= particle.speed;
      if (particle.y < -10) {
        particle.y = this.canvasElement.height + 10;
        particle.x = Math.random() * this.canvasElement.width;
      }

      this.canvasCtx.save();
      this.canvasCtx.globalAlpha = particle.opacity;
      this.canvasCtx.fillStyle = particle.color;
      this.canvasCtx.beginPath();
      this.canvasCtx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
      this.canvasCtx.fill();
      this.canvasCtx.restore();
    });
  }

  drawGameUI() {
    this.canvasCtx.save();
    this.canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.canvasCtx.font = 'bold 20px Arial';
    this.canvasCtx.fillText(`Level: ${this.gameLevel}`, 20, 35);

    this.canvasCtx.font = 'bold 16px Arial';
    this.canvasCtx.fillText(`Best Combo: ${this.maxCombo}`, 20, 60);

    if (this.performanceMode) {
      this.canvasCtx.fillStyle = 'rgba(100, 255, 100, 0.9)';
      this.canvasCtx.fillText('⚡ Performance Mode', 20, 85);
    }

    this.canvasCtx.restore();
  }

  createLevelUpEffect() {
    const centerX = this.canvasElement.width / 2;
    const centerY = this.canvasElement.height / 2;

    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 / 30) * i;
      const particle = {
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * 6,
        vy: Math.sin(angle) * 6,
        life: 1.0,
        decay: 0.02,
        size: 4 + Math.random() * 3,
        color: '#FFD700',
        type: 'levelup'
      };
      this.particles.push(particle);
    }
  }

  setupEventListeners() {
    const cameraBtn = document.getElementById('cameraBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const performanceBtn = document.getElementById('performanceBtn');
    const soundBtn = document.getElementById('soundBtn');
    const voiceBtn = document.getElementById('voiceBtn');
    const videoContainer = document.querySelector('.video-container');

    cameraBtn.addEventListener('click', () => {
      this.startCamera();
    });

    fullscreenBtn.addEventListener('click', () => {
      this.toggleFullscreen(videoContainer, fullscreenBtn);
    });

    performanceBtn.addEventListener('click', () => {
      this.togglePerformanceMode(performanceBtn);
    });

    soundBtn.addEventListener('click', () => {
      this.toggleSound(soundBtn);
    });

    voiceBtn.addEventListener('click', () => {
      this.toggleVoice(voiceBtn);
    });

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        this.exitFullscreen(videoContainer, fullscreenBtn);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'f' || e.key === 'F') {
        this.toggleFullscreen(videoContainer, fullscreenBtn);
      }
      if (e.key === 'p' || e.key === 'P') {
        this.togglePerformanceMode(performanceBtn);
      }
      if (e.key === 's' || e.key === 'S') {
        this.toggleSound(soundBtn);
      }
    });
  }

  toggleSound(soundBtn) {
    this.soundEnabled = !this.soundEnabled;

    if (this.soundEnabled) {
      soundBtn.textContent = '🔊 Sound On';
      soundBtn.classList.remove('muted');

      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    } else {
      soundBtn.textContent = '🔇 Sound Off';
      soundBtn.classList.add('muted');
    }
  }

  toggleVoice(voiceBtn) {
    this.speechEnabled = !this.speechEnabled;

    if (this.speechEnabled && 'speechSynthesis' in window) {
      voiceBtn.textContent = '🎤 AI Voice On';
      voiceBtn.classList.remove('muted');

      setTimeout(() => {
        this.speakText("Voice system activated Sir!");
      }, 500);
    } else {
      voiceBtn.textContent = '🔇 AI Voice Off';
      voiceBtn.classList.add('muted');

      if (this.speechSynthesis) {
        this.speechSynthesis.cancel();
      }
    }
  }

  toggleFullscreen(videoContainer, fullscreenBtn) {
    if (!document.fullscreenElement) {
      videoContainer.requestFullscreen().then(() => {
        videoContainer.classList.add('fullscreen');
        fullscreenBtn.textContent = '🗗 Exit Fullscreen';

        document.body.style.overflow = 'hidden';
        this.canvasElement.style.transform = 'scaleX(-1) translateZ(0)';

        setTimeout(() => {
          this.resizeCanvas();
        }, 100);
      });
    } else {
      document.exitFullscreen();
    }
  }

  exitFullscreen(videoContainer, fullscreenBtn) {
    videoContainer.classList.remove('fullscreen');
    fullscreenBtn.textContent = '🔳 Fullscreen Mode';

    document.body.style.overflow = '';
    this.canvasElement.style.transform = 'scaleX(-1)';

    setTimeout(() => {
      this.resizeCanvas();
    }, 100);
  }

  togglePerformanceMode(performanceBtn) {
    this.performanceMode = !this.performanceMode;

    if (this.performanceMode) {
      performanceBtn.textContent = '🔥 Normal Mode';
      performanceBtn.classList.add('active');
      this.targetFPS = 20;
      this.maxBubbles = Math.min(6, this.maxBubbles);
    } else {
      performanceBtn.textContent = '⚡ High Performance';
      performanceBtn.classList.remove('active');
      this.targetFPS = 30;
      this.maxBubbles = 8 + this.gameLevel;
    }
  }

  resizeCanvas() {
    const isFullscreen = document.fullscreenElement;
    if (isFullscreen) {
      this.canvasElement.width = window.screen.width;
      this.canvasElement.height = window.screen.height;
      this.canvasElement.style.width = '100vw';
      this.canvasElement.style.height = '100vh';
    } else {
      this.canvasElement.width = 1280;
      this.canvasElement.height = 720;
      this.canvasElement.style.width = '';
      this.canvasElement.style.height = '';
    }
  }

  startGameLoop() {
    this.gameTimerInterval = setInterval(() => {
      if (this.particles.length > 200) {
        this.particles = this.particles.slice(-100);
      }

      if (this.gameActive) {
        this.timeRemaining--;
        if (this.timerElement) this.timerElement.textContent = this.timeRemaining;

        if (this.timeRemaining <= 0) {
          this.gameOver();
        }
      }
    }, 1000);
  }

  gameOver() {
    this.gameActive = false;
    this.sounds.specialPop();
    this.speakText("Game Over! Great job Sir!");

    document.getElementById('finalScore').textContent = this.score;
    document.getElementById('finalHighScore').textContent = this.highScore;
    document.getElementById('gameOverModal').style.display = 'flex';
  }

  restartGame() {
    this.score = 0;
    this.combo = 0;
    this.bubblesPopped = 0;
    this.timeRemaining = 60;
    this.gameActive = true;
    this.gameLevel = 1;

    this.scoreElement.textContent = 0;
    this.comboElement.textContent = 0;
    this.bubblesElement.textContent = 0;
    if (this.timerElement) this.timerElement.textContent = 60;

    document.getElementById('gameOverModal').style.display = 'none';
    this.speakText("Game restarted! Good luck!");
  }

  startBackgroundAnimation() {
    setInterval(() => {
      if (this.backgroundParticles.length < 20) {
        this.createBackgroundParticles();
      }
    }, 10000);
  }
}
