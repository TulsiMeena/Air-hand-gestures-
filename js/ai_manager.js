class AIManager {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.selectedVoice = null;
    this.enabled = true;
    this.queue = [];
    this.isSpeaking = false;
    this.personality = 'assistant'; // assistant, gamer, minimal

    this.responses = {
      assistant: {
        welcome: ["System initialized. Welcome back, Sir.", "Advanced interface ready. Awaiting inputs.", "Authentication complete. Good luck, Sir."],
        combo: ["Excellent performance.", "Impressive coordination.", "Efficiency increasing.", "Masterful technique, Sir."],
        bomb: ["Danger detected!", "Shields down! Avoid the explosives.", "Negative impact detected."],
        levelup: ["Level up! adjusting difficulty.", "Capabilities enhanced.", "Proceeding to next stage."],
        gameover: ["Mission failed. Better luck next time, Sir.", "Session terminated.", "Performance analysis complete."],
        encouragement: ["You can do better, Sir.", "Focus required.", "Stay sharp."]
      },
      gamer: {
        welcome: ["Let's GOOO!", "Ready to crush it?", "Game ON!"],
        combo: ["COMBO BREAKER!", "You're on fire!", "Unstoppable!", "Godlike!"],
        bomb: ["Ouch!", "Watch out!", "You blew it!", "Noooo!"],
        levelup: ["LEVEL UP!", "New high score incoming!", "To the moon!"],
        gameover: ["GG!", "Game Over, man!", "Try again!"],
        encouragement: ["Nice try!", "Keep pushing!", "Don't give up!"]
      },
      minimal: {
        welcome: ["Ready."],
        combo: ["Combo."],
        bomb: ["Hit."],
        levelup: ["Level Up."],
        gameover: ["End."],
        encouragement: ["..."]
      }
    };

    // Initialize voices
    if (this.synth) {
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    this.voices = this.synth.getVoices();
    // Try to select a good default (Google US English or similar)
    this.selectedVoice = this.voices.find(v => v.name.includes('Google US English')) ||
                         this.voices.find(v => v.lang === 'en-US') ||
                         this.voices[0];
  }

  getVoices() {
    return this.voices;
  }

  setVoice(voiceName) {
    const voice = this.voices.find(v => v.name === voiceName);
    if (voice) {
      this.selectedVoice = voice;
      this.speak("Voice calibration complete. How do I sound?");
    }
  }

  setPersonality(type) {
    if (this.responses[type]) {
      this.personality = type;
      this.speak("Personality matrix updated.");
    }
  }

  getRandomResponse(category) {
    const pool = this.responses[this.personality][category];
    if (!pool) return "";
    return pool[Math.floor(Math.random() * pool.length)];
  }

  speak(text, priority = false, category = null) {
    if (!this.enabled || !this.synth) return;

    // If category provided, pick a random response from that category
    let messageText = text;
    if (category) {
      messageText = this.getRandomResponse(category);
    }

    // If empty text (e.g. minimal mode sometimes), skip
    if (!messageText) return;

    if (priority) {
      this.synth.cancel();
      this.queue = [];
      this.isSpeaking = false;
    }

    this.queue.push(messageText);
    this.processQueue();
  }

  processQueue() {
    if (this.isSpeaking || this.queue.length === 0) return;

    const text = this.queue.shift();
    const utterance = new SpeechSynthesisUtterance(text);

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    // Adjust pitch/rate based on personality
    if (this.personality === 'gamer') {
      utterance.rate = 1.2;
      utterance.pitch = 1.1;
    } else if (this.personality === 'assistant') {
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
    }

    utterance.onstart = () => { this.isSpeaking = true; };
    utterance.onend = () => {
      this.isSpeaking = false;
      this.processQueue();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.processQueue();
    };

    this.synth.speak(utterance);
  }

  toggle(state) {
    this.enabled = state;
    if (!state) this.synth.cancel();
  }
}
