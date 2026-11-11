/**
 * High-Precision Timer Engine for FIBA 3x3 Scoreboard
 * Handles Game Clock, 12-second Shot Clock ("Shoot Lock"), and Timeout Timer
 * uses delta time calculation against performance.now() to avoid drift.
 */

class ScoreboardTimer {
  constructor(stateManager) {
    this.sm = stateManager;
    this.lastTickTime = null;
    this.rafId = null;

    // Warning sound triggers for shot clock countdown
    this.lastShotClockSecondAnnounced = null;

    this.startLoop();
  }

  startLoop() {
    const loop = (timestamp) => {
      if (!this.lastTickTime) {
        this.lastTickTime = timestamp;
      }
      const deltaMs = timestamp - this.lastTickTime;
      this.lastTickTime = timestamp;

      this.tick(deltaMs);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  tick(deltaMs) {
    let stateChanged = false;
    const { gameClock, shotClock, timeout, config } = this.sm.state;

    // 1. TIMEOUT TIMER (Takes priority if active)
    if (timeout.active) {
      timeout.remainingMs = Math.max(0, timeout.remainingMs - deltaMs);
      stateChanged = true;

      if (timeout.remainingMs <= 0) {
        timeout.active = false;
        timeout.callingTeam = null;
        if (window.scoreboardAudio && config.soundEnabled) {
          window.scoreboardAudio.playWhistle();
        }
        this.sm.broadcast('whistle');
        this.sm.logEvent('Waktu Timeout Selesai (30 Detik)', 'TIMEOUT_END');
      }
    }

    // 2. GAME CLOCK
    if (gameClock.running && !gameClock.isOvertime) {
      gameClock.remainingMs = Math.max(0, gameClock.remainingMs - deltaMs);
      stateChanged = true;

      if (gameClock.remainingMs <= 0) {
        gameClock.running = false;
        shotClock.running = false;
        gameClock.isFinished = true;

        if (this.sm.state.teamA.score === this.sm.state.teamB.score) {
          this.sm.state.winner = 'tie';
          this.sm.logEvent('WAKTU REGULER HABIS (10:00) - SKOR IMBANG! Butuh Overtime.', 'GAME_TIE');
        } else {
          const winTeam = this.sm.state.teamA.score > this.sm.state.teamB.score ? 'teamA' : 'teamB';
          const teamName = this.sm.state[winTeam].name;
          this.sm.state.winner = winTeam;
          this.sm.state.winnerReason = `Waktu 10:00 Habis! ${teamName} Menang berdasarkan perolehan skor!`;
          this.sm.logEvent(`WAKTU HABIS: ${teamName} Menang (${this.sm.state.teamA.score} - ${this.sm.state.teamB.score})`, 'GAME_END');
        }

        if (config.autoBuzzerGameClock && window.scoreboardAudio && config.soundEnabled) {
          window.scoreboardAudio.playHorn(1.8);
        }
        this.sm.broadcast('horn');
      }
    }

    // 3. SHOT CLOCK ("SHOOT LOCK")
    // Runs when shotClock.running is true and shotClock is active/enabled (can run during Overtime!)
    const isShotClockActive = shotClock.enabled !== false && shotClock.visible !== false;
    if (shotClock.running && isShotClockActive) {
      shotClock.remainingMs = Math.max(0, shotClock.remainingMs - deltaMs);
      stateChanged = true;

      const currentSec = Math.ceil(shotClock.remainingMs / 1000);

      // Warning beep on 3, 2, 1
      if (currentSec <= 3 && currentSec > 0 && this.lastShotClockSecondAnnounced !== currentSec) {
        this.lastShotClockSecondAnnounced = currentSec;
        // Optional warning sound
        if (config.soundEnabled && window.scoreboardAudio) {
          window.scoreboardAudio.playWarningBeep();
        }
      }

      // Shot Clock EXPIRED!
      if (shotClock.remainingMs <= 0) {
        shotClock.running = false;
        // In basketball, shot clock violation usually halts the game clock
        gameClock.running = false;
        this.lastShotClockSecondAnnounced = null;

        this.sm.logEvent('PELANGGARAN SHOT CLOCK (12 Detik Habis)! Horn berbunyi.', 'SHOT_CLOCK_VIOLATION');

        if (config.autoBuzzerShotClock && window.scoreboardAudio && config.soundEnabled) {
          window.scoreboardAudio.playShotClockBuzzer();
        }
        this.sm.broadcast('shotClock');
      }
    } else {
      this.lastShotClockSecondAnnounced = null;
    }

    if (stateChanged) {
      // Notify UI listeners (throttled inside views or direct)
      this.sm.notifySubscribers();
    }
  }

  // ================= CONTROL METHODS =================

  // Start / Pause Master Clock (Synchronized Game + Shot Clock)
  toggleMasterClock() {
    if (this.sm.state.gameClock.isFinished && !this.sm.state.gameClock.isOvertime) {
      return;
    }

    const isShotClockActive = this.sm.isShotClockActive
      ? this.sm.isShotClockActive()
      : (this.sm.state.shotClock.enabled !== false && this.sm.state.shotClock.visible !== false);

    // Di babak Overtime, waktu utama adalah OT sehingga master clock mengendalikan Shot Clock (jika aktif)
    if (this.sm.state.gameClock.isOvertime) {
      if (isShotClockActive) {
        const shouldRun = !this.sm.state.shotClock.running;
        this.sm.state.shotClock.running = shouldRun;
        this.sm.state.gameClock.running = shouldRun;
        if (shouldRun && this.sm.state.shotClock.remainingMs <= 0) {
          this.resetShotClock(true);
        }
      } else {
        this.sm.state.gameClock.running = !this.sm.state.gameClock.running;
      }
      this.sm.broadcast();
      this.sm.notifySubscribers();
      return;
    }

    const shouldRun = !this.sm.state.gameClock.running;
    this.sm.state.gameClock.running = shouldRun;

    // Shot clock follows game clock ONLY IF active
    if (isShotClockActive) {
      if (this.sm.state.shotClock.remainingMs <= 0) {
        this.resetShotClock(false);
      }
      this.sm.state.shotClock.running = shouldRun;
    } else {
      this.sm.state.shotClock.running = false;
    }

    this.sm.broadcast();
    this.sm.notifySubscribers();
  }

  startMasterClock() {
    this.sm.state.gameClock.running = true;
    const isShotClockActive = this.sm.isShotClockActive
      ? this.sm.isShotClockActive()
      : (this.sm.state.shotClock.enabled !== false && this.sm.state.shotClock.visible !== false);

    if (isShotClockActive && this.sm.state.shotClock.remainingMs > 0) {
      this.sm.state.shotClock.running = true;
    } else {
      this.sm.state.shotClock.running = false;
    }
    this.sm.broadcast();
    this.sm.notifySubscribers();
  }

  pauseMasterClock() {
    this.sm.state.gameClock.running = false;
    this.sm.state.shotClock.running = false;
    this.sm.broadcast();
    this.sm.notifySubscribers();
  }

  // Shot clock standalone controls
  toggleShotClock() {
    const isShotClockActive = this.sm.isShotClockActive
      ? this.sm.isShotClockActive()
      : (this.sm.state.shotClock.enabled !== false && this.sm.state.shotClock.visible !== false);

    if (!isShotClockActive) {
      this.toggleShotClockEnabled();
      return;
    }

    this.sm.state.shotClock.running = !this.sm.state.shotClock.running;
    this.sm.broadcast();
    this.sm.notifySubscribers();
  }

  /**
   * Reset Shot Clock to 12s (Official 3x3 rule) or custom seconds
   * @param {boolean} autoStart Whether to start ticking immediately
   * @param {number|null} seconds Defaults to config shotClockSeconds (12)
   * @param {boolean} forceEnable If true, re-enables shot clock if it was disabled
   */
  resetShotClock(autoStart = false, seconds = null, forceEnable = false) {
    const sec = seconds !== null ? seconds : (this.sm.state.config.shotClockSeconds || 12);
    this.sm.state.shotClock.totalMs = sec * 1000;
    this.sm.state.shotClock.remainingMs = sec * 1000;

    if (forceEnable) {
      this.sm.state.shotClock.enabled = true;
      this.sm.state.shotClock.visible = true;
    }

    const isShotClockActive = this.sm.isShotClockActive
      ? this.sm.isShotClockActive()
      : (this.sm.state.shotClock.enabled !== false && this.sm.state.shotClock.visible !== false);

    this.lastShotClockSecondAnnounced = null;

    if (autoStart && isShotClockActive) {
      this.sm.state.shotClock.running = true;
    } else if (!isShotClockActive) {
      this.sm.state.shotClock.running = false;
    }

    this.sm.broadcast();
    this.sm.notifySubscribers();
  }

  setShotClockSeconds(seconds) {
    this.sm.state.shotClock.remainingMs = Math.max(0, seconds * 1000);
    this.sm.broadcast();
    this.sm.notifySubscribers();
  }

  toggleShotClockEnabled() {
    if (this.sm.toggleShotClockEnabled) {
      this.sm.toggleShotClockEnabled();
    } else {
      this.toggleShotClockVisibility();
    }
  }

  toggleShotClockVisibility() {
    const isCurrentlyActive = this.sm.isShotClockActive
      ? this.sm.isShotClockActive()
      : (this.sm.state.shotClock.enabled !== false && this.sm.state.shotClock.visible !== false);
    const nextState = !isCurrentlyActive;

    this.sm.state.shotClock.enabled = nextState;
    this.sm.state.shotClock.visible = nextState;
    if (!nextState) {
      this.sm.state.shotClock.running = false;
      this.sm.logEvent('Shot Clock dinonaktifkan', 'SHOT_CLOCK_OFF');
    } else {
      this.sm.logEvent('Shot Clock diaktifkan', 'SHOT_CLOCK_ON');
    }
    this.sm.broadcast();
    this.sm.notifySubscribers();
  }

  // Game clock adjustments
  adjustGameClock(deltaSeconds) {
    this.sm.state.gameClock.remainingMs = Math.max(
      0,
      this.sm.state.gameClock.remainingMs + (deltaSeconds * 1000)
    );
    this.sm.broadcast();
    this.sm.notifySubscribers();
  }

  setGameClockTime(minutes, seconds) {
    const totalMs = (minutes * 60 + seconds) * 1000;
    this.sm.state.gameClock.totalMs = totalMs;
    this.sm.state.gameClock.remainingMs = totalMs;
    this.sm.state.gameClock.isFinished = false;
    this.sm.broadcast();
    this.sm.notifySubscribers();
  }

  resetGameClock() {
    this.sm.state.gameClock.remainingMs = this.sm.state.gameClock.totalMs;
    this.sm.state.gameClock.running = false;
    this.sm.state.gameClock.isFinished = false;
    this.sm.broadcast();
    this.sm.notifySubscribers();
  }
}

window.scoreboardTimer = new ScoreboardTimer(window.scoreboardState);
