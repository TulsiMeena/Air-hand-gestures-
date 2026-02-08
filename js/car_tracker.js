class CarSpeedDetector {
  constructor() {
    this.videoElement = document.getElementById('carVideo');
    this.canvasElement = document.getElementById('carCanvas');
    this.canvasCtx = this.canvasElement.getContext('2d');

    this.carCountElement = document.getElementById('carCount');
    this.maxSpeedElement = document.getElementById('maxSpeed');
    this.statusElement = document.getElementById('carStatus');
    this.backBtn = document.getElementById('backToGameBtn');

    this.isActive = false;
    this.model = null;
    this.stream = null;
    this.objects = new Map(); // Track objects by ID (simulated)
    this.nextObjectId = 0;
    this.maxSpeed = 0;

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.backBtn.addEventListener('click', () => {
      this.stop();
      document.getElementById('carScreen').style.display = 'none';
      document.getElementById('gameScreen').style.display = 'block';
    });
  }

  async start() {
    this.isActive = true;
    this.statusElement.textContent = "⏳ Loading AI Model...";
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    try {
      if (!this.model) {
        // Load Coco-SSD model
        this.model = await cocoSsd.load();
      }

      this.statusElement.textContent = "📷 Starting Camera...";
      await this.startCamera();

      this.statusElement.textContent = "🚀 Detecting Cars...";
      this.detectLoop();

    } catch (error) {
      console.error("Car detector error:", error);
      this.statusElement.textContent = "❌ Error: " + error.message;
    }
  }

  stop() {
    this.isActive = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  async startCamera() {
    const constraints = {
      video: {
        facingMode: 'environment', // Use back camera if available
        width: { ideal: 640 }, // Lower resolution for better performance
        height: { ideal: 480 },
        frameRate: { ideal: 30 }
      }
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.videoElement.srcObject = this.stream;

    return new Promise((resolve) => {
      this.videoElement.onloadedmetadata = () => {
        this.videoElement.play();
        resolve();
      };
    });
  }

  async detectLoop() {
    if (!this.isActive) return;

    // Performance optimization: Process frames efficiently
    // Detect objects
    try {
      const predictions = await this.model.detect(this.videoElement);

      // Filter for vehicles and humans
      const detectedObjects = predictions.filter(p =>
        ['person', 'car', 'truck', 'bus', 'motorcycle', 'bicycle'].includes(p.class)
      );

      this.updateTracking(detectedObjects);
      this.drawResults(detectedObjects);

      this.carCountElement.textContent = detectedObjects.length;
      this.maxSpeedElement.textContent = Math.round(this.maxSpeed);
    } catch (e) {
      console.warn("Detection skipped frame", e);
    }

    requestAnimationFrame(() => this.detectLoop());
  }

  updateTracking(vehicles) {
    // Simple tracking logic:
    // Match current vehicles to previous objects based on proximity (IoU or center distance)
    // Calculate speed based on displacement

    const currentFrameObjects = new Map();
    const currentTime = Date.now();

    vehicles.forEach(vehicle => {
      const centerX = vehicle.bbox[0] + vehicle.bbox[2] / 2;
      const centerY = vehicle.bbox[1] + vehicle.bbox[3] / 2;

      let bestMatchId = null;
      let minDistance = 100; // Pixel threshold for matching

      // Try to find match in previous objects
      for (const [id, obj] of this.objects.entries()) {
        const dist = Math.sqrt(
          Math.pow(centerX - obj.x, 2) + Math.pow(centerY - obj.y, 2)
        );

        if (dist < minDistance) {
          minDistance = dist;
          bestMatchId = id;
        }
      }

      if (bestMatchId !== null) {
        // Update existing object
        const prevObj = this.objects.get(bestMatchId);
        const timeDelta = (currentTime - prevObj.lastTime) / 1000; // seconds

        // Calculate speed (pixels per second)
        const pixelSpeed = minDistance / timeDelta;

        // Convert to fake km/h (scale factor assumes 1920px width ~ 20 meters view)
        // This is a rough estimation for "game/demo" feel
        const scaleFactor = 0.5;
        const speedKmh = pixelSpeed * scaleFactor;

        // Smoothing
        const smoothedSpeed = prevObj.speed * 0.7 + speedKmh * 0.3;

        if (smoothedSpeed > this.maxSpeed) this.maxSpeed = smoothedSpeed;

        currentFrameObjects.set(bestMatchId, {
          x: centerX,
          y: centerY,
          lastTime: currentTime,
          speed: smoothedSpeed,
          class: vehicle.class,
          bbox: vehicle.bbox
        });

        // Remove from old map so we don't match again
        this.objects.delete(bestMatchId);

      } else {
        // New object
        const newId = this.nextObjectId++;
        currentFrameObjects.set(newId, {
          x: centerX,
          y: centerY,
          lastTime: currentTime,
          speed: 0,
          class: vehicle.class,
          bbox: vehicle.bbox
        });
      }
    });

    this.objects = currentFrameObjects;
  }

  drawResults(vehicles) {
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    this.canvasCtx.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);

    // Iterate through TRACKED objects to draw speed
    for (const [id, obj] of this.objects.entries()) {
      const [x, y, width, height] = obj.bbox;

      // Box
      this.canvasCtx.strokeStyle = '#00ff88';
      this.canvasCtx.lineWidth = 4;
      this.canvasCtx.strokeRect(x, y, width, height);

      // Label Background
      this.canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.canvasCtx.fillRect(x, y - 30, width, 30);

      // Text
      this.canvasCtx.fillStyle = '#ffffff';
      this.canvasCtx.font = 'bold 16px Arial';
      this.canvasCtx.fillText(
        `${obj.class.toUpperCase()} | ${Math.round(obj.speed)} KM/H`,
        x + 5,
        y - 10
      );
    }
  }
}
