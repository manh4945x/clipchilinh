// Custom HTML5 Video Player Controller (Inline Mode)
window.CustomPlayer = {
  container: null,
  video: null,
  playPauseBtn: null,
  muteBtn: null,
  volumeSlider: null,
  fullscreenBtn: null,
  timelineContainer: null,
  timelineProgress: null,
  timelineHandle: null,
  timeDisplay: null,
  speedBtn: null,
  speedMenu: null,
  speedOptions: null,
  playOverlayBtn: null,

  isDragging: false,
  controlsTimeout: null,

  init() {
    // DOM Element selections
    this.container = document.getElementById('player-container');
    this.video = this.container.querySelector('video');
    
    this.playPauseBtn = document.getElementById('player-play-btn');
    this.muteBtn = document.getElementById('player-mute-btn');
    this.volumeSlider = document.getElementById('player-volume-input');
    this.fullscreenBtn = document.getElementById('player-fullscreen-btn');
    
    this.timelineContainer = document.getElementById('timeline-scrub-box');
    this.timelineProgress = this.timelineContainer.querySelector('.timeline-progress');
    this.timelineHandle = this.timelineContainer.querySelector('.timeline-handle');
    this.timeDisplay = document.getElementById('player-time-display');

    this.speedBtn = document.getElementById('player-speed-settings-btn');
    this.speedMenu = document.getElementById('player-speed-dropdown');
    this.speedOptions = this.speedMenu.querySelectorAll('.speed-option');
    this.playOverlayBtn = document.getElementById('player-pulse-action');

    this.registerEvents();
  },

  registerEvents() {
    // Play/Pause button
    this.playPauseBtn.addEventListener('click', () => this.togglePlay());
    
    // Video clicks (toggle play on clicking the video track)
    this.video.addEventListener('click', () => {
      this.togglePlay();
      this.showScreenPulse();
    });

    // Update controls icons and times
    this.video.addEventListener('play', () => this.updatePlayIcon(true));
    this.video.addEventListener('pause', () => this.updatePlayIcon(false));
    this.video.addEventListener('timeupdate', () => this.updateProgress());
    this.video.addEventListener('loadedmetadata', () => this.updateTimeDisplay(0, this.video.duration));

    // Progress bar interactions
    this.timelineContainer.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.scrub(e);
    });
    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) this.scrub(e);
    });
    window.addEventListener('mouseup', () => {
      if (this.isDragging) this.isDragging = false;
    });

    // Volume controls
    this.muteBtn.addEventListener('click', () => this.toggleMute());
    this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));

    // Fullscreen controls
    this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    document.addEventListener('fullscreenchange', () => this.updateFullscreenIcon());
    document.addEventListener('webkitfullscreenchange', () => this.updateFullscreenIcon());

    // Speed controls
    this.speedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.speedMenu.classList.toggle('active');
    });
    document.addEventListener('click', () => {
      this.speedMenu.classList.remove('active');
    });
    this.speedOptions.forEach(opt => {
      opt.addEventListener('click', (e) => {
        const speed = parseFloat(e.target.dataset.speed);
        this.video.playbackRate = speed;
        this.speedOptions.forEach(o => o.classList.remove('selected'));
        e.target.classList.add('selected');
        this.speedBtn.innerHTML = speed === 1 ? '<i class="fas fa-cog"></i>' : `${speed}x`;
      });
    });

    // Controls Auto Hide (on inactivity)
    this.container.addEventListener('mousemove', () => this.resetControlsTimeout());
    this.container.addEventListener('mouseleave', () => this.hideControls());
    
    // Key bindings (space bar, arrow keys)
    window.addEventListener('keydown', (e) => {
      // Only capture keyboard if watch view is active and user is not typing in comments
      const watchView = document.getElementById('watch-view');
      const isWatchActive = watchView && watchView.classList.contains('active');
      const activeEl = document.activeElement;
      const isTyping = activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT');

      if (!isWatchActive || isTyping) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.video.currentTime += 10;
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.video.currentTime -= 10;
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        this.toggleFullscreen();
      }
    });
  },

  open(videoUrl) {
    this.video.src = videoUrl;
    this.video.play()
      .then(() => {
        this.resetControlsTimeout();
      })
      .catch((err) => {
        console.warn("Autoplay was blocked or video source failed to load:", err);
      });
  },

  close() {
    this.video.pause();
    this.video.removeAttribute('src');
    this.video.load();
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen().catch(() => {});
      }
    }
    clearTimeout(this.controlsTimeout);
  },

  togglePlay() {
    if (this.video.paused) {
      this.video.play();
    } else {
      this.video.pause();
    }
    this.resetControlsTimeout();
  },

  updatePlayIcon(isPlaying) {
    if (isPlaying) {
      this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
      this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
  },

  showScreenPulse() {
    this.playOverlayBtn.className = 'play-overlay-btn'; // Reset
    void this.playOverlayBtn.offsetWidth; // Trigger reflow
    
    const isPlaying = !this.video.paused;
    this.playOverlayBtn.innerHTML = isPlaying ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    this.playOverlayBtn.classList.add('show-pulse');
  },

  updateProgress() {
    if (this.isDragging) return;
    const percentage = (this.video.currentTime / this.video.duration) * 100;
    this.timelineProgress.style.width = `${percentage}%`;
    this.timelineHandle.style.left = `${percentage}%`;
    this.updateTimeDisplay(this.video.currentTime, this.video.duration);
  },

  scrub(e) {
    const rect = this.timelineContainer.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const percentage = Math.max(0, Math.min(1, position)) * 100;
    
    this.timelineProgress.style.width = `${percentage}%`;
    this.timelineHandle.style.left = `${percentage}%`;
    
    const targetTime = (percentage / 100) * this.video.duration;
    this.video.currentTime = isNaN(targetTime) ? 0 : targetTime;
    
    this.updateTimeDisplay(this.video.currentTime, this.video.duration);
    this.resetControlsTimeout();
  },

  updateTimeDisplay(current, duration) {
    const formatTime = (secs) => {
      if (isNaN(secs)) return '00:00';
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    };
    this.timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  },

  toggleMute() {
    this.video.muted = !this.video.muted;
    this.updateVolumeIcon();
    this.volumeSlider.value = this.video.muted ? 0 : this.video.volume;
  },

  setVolume(value) {
    const vol = parseFloat(value);
    this.video.volume = vol;
    this.video.muted = vol === 0;
    this.updateVolumeIcon();
  },

  updateVolumeIcon() {
    if (this.video.muted || this.video.volume === 0) {
      this.muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else if (this.video.volume < 0.5) {
      this.muteBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
    } else {
      this.muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
  },

  toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (this.container.requestFullscreen) {
        this.container.requestFullscreen();
      } else if (this.container.webkitRequestFullscreen) {
        this.container.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  },

  updateFullscreenIcon() {
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
    if (isFullscreen) {
      this.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
      this.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    }
  },

  resetControlsTimeout() {
    this.container.classList.remove('controls-hidden');
    clearTimeout(this.controlsTimeout);
    
    // Only set timeout to hide if video is playing
    if (!this.video.paused) {
      this.controlsTimeout = setTimeout(() => {
        this.hideControls();
      }, 3000);
    }
  },

  hideControls() {
    if (!this.video.paused && !this.isDragging && !this.speedMenu.classList.contains('active')) {
      this.container.classList.add('controls-hidden');
    }
  }
};
