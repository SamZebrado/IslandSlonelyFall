const AudioController = {
  audioContext: null,
  audioElement: null,
  isPlaying: false,
  currentTrack: null,
  volume: 0.2,
  defaultVolume: 0.2,
  isMuted: false,
  
  tracks: {
    cloudHarbor: {
      name: '云港主题',
      path: 'assets/audio/cloud_harbor_theme.wav',
      description: '明亮、轻盈、清晨海面'
    },
    empathyRoom: {
      name: '共情小屋',
      path: 'assets/audio/empathy_room_loop.wav',
      description: '安静、舒缓、低刺激'
    },
    reviewGarden: {
      name: '回顾花园',
      path: 'assets/audio/review_garden_loop.wav',
      description: '温暖、放松、成就感'
    }
  },
  
  init() {
    this.audioElement = new Audio();
    this.audioElement.volume = this.defaultVolume;
    
    this.audioElement.addEventListener('ended', () => {
      if (this.isPlaying && this.currentTrack) {
        this.audioElement.currentTime = 0;
        this.audioElement.play().catch(() => {});
      }
    });
    
    this.audioElement.addEventListener('error', (e) => {
      console.warn('音频加载失败，但不影响核心功能:', e);
    });
  },
  
  loadTrack(trackKey) {
    const track = this.tracks[trackKey];
    if (!track) return false;
    
    try {
      this.audioElement.src = track.path;
      this.currentTrack = trackKey;
      return true;
    } catch (e) {
      console.warn('加载音频失败:', e);
      return false;
    }
  },
  
  playTrack(trackKey) {
    if (!trackKey) trackKey = this.currentTrack || 'cloudHarbor';
    
    if (this.currentTrack !== trackKey) {
      this.loadTrack(trackKey);
    }
    
    const playPromise = this.audioElement.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.isPlaying = true;
        this.updateUI();
      }).catch(() => {
        console.warn('音频播放被浏览器阻止');
      });
    }
  },
  
  pauseAudio() {
    this.audioElement.pause();
    this.isPlaying = false;
    this.updateUI();
  },
  
  togglePlay() {
    if (this.isPlaying) {
      this.pauseAudio();
    } else {
      this.playTrack();
    }
  },
  
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (!this.isMuted) {
      this.audioElement.volume = this.volume;
    }
  },
  
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.audioElement.volume = this.isMuted ? 0 : this.volume;
    this.updateUI();
  },
  
  updateUI() {
    const btn = document.getElementById('audioToggleBtn');
    const indicator = document.getElementById('audioIndicator');
    
    if (btn) {
      btn.textContent = this.isPlaying ? '🔊' : '🔇';
      btn.classList.toggle('playing', this.isPlaying);
    }
    
    if (indicator) {
      indicator.classList.toggle('hidden', !this.isPlaying);
    }
  },
  
  getCurrentTrackInfo() {
    return this.tracks[this.currentTrack] || null;
  },
  
  hasAudioSupport() {
    return !!document.createElement('audio').canPlayType;
  }
};

if (typeof window !== 'undefined') {
  window.AudioController = AudioController;
  
  document.addEventListener('DOMContentLoaded', () => {
    AudioController.init();
  });
}

function initAudioControls() {
  return AudioController.init();
}

function playTrack(trackKey) {
  return AudioController.playTrack(trackKey);
}

function pauseAudio() {
  return AudioController.pauseAudio();
}

function setVolume(value) {
  return AudioController.setVolume(value);
}

export { AudioController, initAudioControls, playTrack, pauseAudio, setVolume };
