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
