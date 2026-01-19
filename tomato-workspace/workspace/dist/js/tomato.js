class TomatoTimer {
    constructor() {
        this.historyKey = 'tomatoTimerHistory';
        this.settingsKey = 'tomatoTimerSettings';
        this.countdown = null;
        this.intervalMinutes = 15;
        this.secondsRemaining = 0;
        this.history = [];
        this.audio = document.getElementById('reminder-sound');
        this.backgroundMusic = document.getElementById('background-music');
        this.musicToggleBtn = document.getElementById('music-toggle');
        this.musicPlaying = false;
        this.audioUnlocked = false;

        this.cacheElements();
        this.bindEvents();
        this.restoreState();
        this.updateDisplay(0);
        this.updateMusicButton();
    }

    cacheElements() {
        this.display = document.getElementById('timer-display');
        this.status = document.getElementById('timer-status');
        this.startBtn = document.getElementById('start-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.notifyToggle = document.getElementById('notify-toggle');
        this.historyList = document.getElementById('history-list');
        this.clearHistoryBtn = document.getElementById('clear-history');
        this.intervalInputs = Array.from(document.querySelectorAll('input[name="interval"]'));
        this.customInput = document.getElementById('custom-interval');
        this.musicToggleBtn = document.getElementById('music-toggle');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startCountdown());
        this.stopBtn.addEventListener('click', () => this.stopCountdown());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        if (this.musicToggleBtn) {
            this.musicToggleBtn.addEventListener('click', () => this.toggleMusic());
        }
        this.intervalInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.intervalMinutes = parseInt(input.value, 10);
                this.saveSettings();
            });
        });
        if (this.customInput) {
            this.customInput.addEventListener('input', () => {
                this.customInput.value = this.customInput.value.replace(/\D/g, '');
                if (this.customInput.value) {
                    this.intervalInputs.forEach(input => input.checked = false);
                }
                if (this.customInput.value === '') {
                    this.selectIntervalInput(this.intervalMinutes);
                }
            });
        }
    }

    restoreState() {
        const settings = JSON.parse(localStorage.getItem(this.settingsKey) || '{}');
        if (settings.intervalMinutes) {
            this.intervalMinutes = settings.intervalMinutes;
            this.selectIntervalInput(settings.intervalMinutes);
        }
        if (settings.customInterval) {
            this.customInput.value = settings.customInterval;
        }
        if (settings.remindersEnabled !== undefined) {
            this.notifyToggle.checked = settings.remindersEnabled;
        }
        const history = JSON.parse(localStorage.getItem(this.historyKey) || '[]');
        this.history = history;
        this.renderHistory();
    }

    selectIntervalInput(value) {
        this.intervalInputs.forEach(input => {
            input.checked = parseInt(input.value, 10) === value;
        });
    }

    getCustomInterval() {
        if (!this.customInput) return 0;
        const customValue = parseInt(this.customInput.value, 10);
        return Number.isFinite(customValue) && customValue > 0 ? customValue : 0;
    }

    getSelectedInterval() {
        const custom = this.getCustomInterval();
        if (custom > 0) {
            return custom;
        }
        const selected = document.querySelector('input[name="interval"]:checked');
        const value = parseInt(selected?.value, 10);
        return value || this.intervalMinutes;
    }

    saveSettings() {
        const customInterval = this.getCustomInterval();
        localStorage.setItem(this.settingsKey, JSON.stringify({
            intervalMinutes: this.intervalMinutes,
            remindersEnabled: this.notifyToggle.checked,
            customInterval: customInterval > 0 ? customInterval : null
        }));
    }

    startCountdown() {
        if (this.countdown) return;

        this.resetReminderSound();
        this.unlockAudio();
        this.resetMusicForSession();

        const selected = document.querySelector('input[name="interval"]:checked');
        this.intervalMinutes = parseInt(selected?.value || this.intervalMinutes, 10);
        this.saveSettings();
        const selectedInterval = this.getSelectedInterval();
        this.intervalMinutes = selectedInterval;
        this.selectIntervalInput(this.intervalMinutes);
        this.secondsRemaining = this.intervalMinutes * 60;
        this.updateDisplay(this.secondsRemaining);
        this.updateStatus(`Focusing for ${this.intervalMinutes} minutes`);
        this.toggleButtons(true);
        this.saveSettings();

        this.countdown = setInterval(() => {
            this.secondsRemaining -= 1;
            if (this.secondsRemaining <= 0) {
                this.completeSession();
            } else {
                this.updateDisplay(this.secondsRemaining);
                this.updateStatus(`Time left: ${this.formatTime(this.secondsRemaining)}`);
            }
        }, 1000);
    }

    stopCountdown() {
        if (!this.countdown) return;
        clearInterval(this.countdown);
        this.countdown = null;
        this.updateDisplay(0);
        this.updateStatus('Timer stopped');
        this.toggleButtons(false);
    }

    completeSession() {
        clearInterval(this.countdown);
        this.countdown = null;
        this.updateDisplay(0);
        this.updateStatus('Time’s up! Take a break or restart.');
        this.logHistoryEntry();
        this.toggleButtons(false);
        if (this.notifyToggle.checked) {
            this.playReminder();
        }
    }

    toggleButtons(isRunning) {
        this.startBtn.disabled = isRunning;
        this.stopBtn.disabled = !isRunning;
    }

    updateDisplay(seconds) {
        this.display.textContent = this.formatTime(seconds);
    }

    updateStatus(message) {
        this.status.textContent = message;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }

    playReminder() {
        this.audio.currentTime = 0;
        this.audio.play().catch(() => {});
    }

    resetReminderSound() {
        if (!this.audio) return;
        this.audio.pause();
        this.audio.currentTime = 0;
    }

    toggleMusic() {
        if (!this.backgroundMusic) return;
        if (this.musicPlaying) {
            this.backgroundMusic.pause();
        } else {
            this.backgroundMusic.play().catch(() => {});
        }
        this.musicPlaying = !this.musicPlaying;
        this.updateMusicButton();
    }

    updateMusicButton() {
        if (!this.musicToggleBtn) return;
        this.musicToggleBtn.textContent = this.musicPlaying ? 'Pause gentle music' : 'Play gentle music';
    }

    unlockAudio() {
        if (this.audioUnlocked) return;
        this.audio.play().then(() => {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audioUnlocked = true;
        }).catch(() => {
            // Autoplay prevented — we simply won't unlock yet.
        });
    }

    resetMusicForSession() {
        if (!this.backgroundMusic) return;
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
        if (this.musicPlaying) {
            this.backgroundMusic.play().catch(() => {});
        }
    }

    unlockAudio() {
        if (this.audioUnlocked) return;
        this.audio.play().then(() => {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audioUnlocked = true;
        }).catch(() => {
            // Autoplay prevented - continue silently
        });
    }

    logHistoryEntry() {
        const timestamp = new Date();
        const entry = {
            id: timestamp.getTime(),
            interval: this.intervalMinutes,
            label: `${this.intervalMinutes} min focus completed`,
            time: timestamp.toLocaleString()
        };
        this.history.unshift(entry);
        this.history = this.history.slice(0, 15);
        localStorage.setItem(this.historyKey, JSON.stringify(this.history));
        this.renderHistory();
    }

    renderHistory() {
        this.historyList.innerHTML = '';
        if (this.history.length === 0) {
            const empty = document.createElement('li');
            empty.textContent = 'No history yet.';
            empty.style.opacity = '0.7';
            this.historyList.appendChild(empty);
            return;
        }
        this.history.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.label}</span><span>${item.time}</span>`;
            this.historyList.appendChild(li);
        });
    }

    clearHistory() {
        this.history = [];
        localStorage.removeItem(this.historyKey);
        this.renderHistory();
    }
}

document.addEventListener('DOMContentLoaded', () => new TomatoTimer());
