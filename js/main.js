document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('Starting Advanced Face Lock Authentication System...');
    new FaceAuthenticationSystem();
  } catch (error) {
    console.error('Failed to initialize authentication system:', error);
    document.getElementById('authStatus').textContent = '❌ System initialization failed. Please refresh the page.';

    // Emergency fallback - direct game access after extended time
    setTimeout(() => {
      document.getElementById('faceAuthScreen').style.display = 'none';
      document.getElementById('gameScreen').style.display = 'block';
      new AdvancedGestureGame();
    }, 5000);
  }
});

// Theme Switching Logic
const themeSelect = document.getElementById('themeSelect');
if (themeSelect) {
  themeSelect.addEventListener('change', (e) => {
    document.body.className = e.target.value;
  });
}

// Car Speed Detector Integration
let carDetector = null;

document.addEventListener('DOMContentLoaded', () => {
  const carModeBtn = document.getElementById('carModeBtn');
  const backToGameBtn = document.getElementById('backToGameBtn');
  const carScreen = document.getElementById('carScreen');
  const gameScreen = document.getElementById('gameScreen');

  if (carModeBtn) {
    carModeBtn.addEventListener('click', () => {
      // Hide game screen
      gameScreen.style.display = 'none';

      // Show car screen
      carScreen.style.display = 'block';

      // Initialize detector if needed
      if (!carDetector) {
        carDetector = new CarSpeedDetector();
      }

      // Start detection
      carDetector.start();
    });
  }

  if (backToGameBtn) {
    backToGameBtn.addEventListener('click', () => {
      if (carDetector) {
        carDetector.stop();
      }
      carScreen.style.display = 'none';
      gameScreen.style.display = 'block';
    });
  }
});
