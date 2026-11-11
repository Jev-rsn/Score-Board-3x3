/**
 * Central State Management for FIBA 3x3 Scoreboard
 * Handles persistence, undo history, and multi-window/dual-screen synchronization.
 */

const STORAGE_KEY = 'fiba_3x3_scoreboard_state_v1';
const MATCHES_STORAGE_KEY = 'fiba_3x3_saved_matches_v1';
const CHANNEL_NAME = 'fiba_3x3_scoreboard_sync';

const DEFAULT_STATE = {
  // Teams
  teamA: {
    name: 'TIM A',
    shortName: 'TMA',
    score: 0,
    fouls: 0,
    timeouts: 1, // 1 timeout allowed per team in 3x3
    color: '#ef4444', // Red
    textColor: '#ffffff'
  },
  teamB: {
    name: 'TIM B',
    shortName: 'TMB',
    score: 0,
    fouls: 0,
    timeouts: 1,
    color: '#3b82f6', // Blue
    textColor: '#ffffff'
  },

  // Game Clock
  gameClock: {
    totalMs: 10 * 60 * 1000, // 10 minutes default for 3x3
    remainingMs: 10 * 60 * 1000,
    running: false,
    period: 1, // 1: Regular, 2: Overtime
    isOvertime: false,
    isFinished: false
  },

  // Shot Clock ("Shoot Lock") - 12 Seconds standard for FIBA 3x3
  shotClock: {
    totalMs: 12 * 1000,
    remainingMs: 12 * 1000,
    running: false,
    visible: true,
    enabled: true
  },

  // Timeout Countdown (30s official in 3x3)
  timeout: {
    active: false,
    remainingMs: 30 * 1000,
    callingTeam: null
  },

  // Possession indicator: 'A', 'B', or null
  possession: null,

  // Rules & Configuration
  config: {
    targetScore: 21,              // First to 21 points wins in 3x3
    targetScoreEnabled: true,
    gameDurationMinutes: 10,
    shotClockSeconds: 12,
    overtimeTargetPoints: 2,      // In 3x3 overtime, first to 2 pts wins
    autoBuzzerShotClock: true,
    autoBuzzerGameClock: true,
    countdownBeepEnabled: true,
    soundEnabled: true,
    soundVolume: 0.8,
    teamFoulBonusThreshold: 7,    // 7th, 8th, 9th = 2 free throws
    teamFoulDoubleBonus: 10       // 10th+ = 2 FT + ball possession
  },

  // Match Information
  matchInfo: {
    title: 'TURNAMEN BASKET 3x3',
    subTitle: 'BABAK PENYISIHAN',
    court: 'LAPANGAN 1'
  },

  // Event Logs for stats & undo
  logs: []
};

class ScoreboardState {
  constructor() {
    this.state = this.loadState();
    this.subscribers = [];
    this.history = []; // For Undo functionality
    this.channel = null;

    this.initSyncChannel();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all fields exist
        return {
          ...DEFAULT_STATE,
          ...parsed,
          teamA: { ...DEFAULT_STATE.teamA, ...parsed.teamA },
          teamB: { ...DEFAULT_STATE.teamB, ...parsed.teamB },
          gameClock: { ...DEFAULT_STATE.gameClock, ...parsed.gameClock, running: false }, // Never resume auto-running on load
          shotClock: {
            ...DEFAULT_STATE.shotClock,
            ...parsed.shotClock,
            running: false,
            enabled: parsed.shotClock && parsed.shotClock.enabled !== undefined
              ? Boolean(parsed.shotClock.enabled)
              : (parsed.shotClock ? parsed.shotClock.visible !== false : true),
            visible: parsed.shotClock && parsed.shotClock.enabled !== undefined
              ? Boolean(parsed.shotClock.enabled)
              : (parsed.shotClock ? parsed.shotClock.visible !== false : true)
          },
          timeout: { ...DEFAULT_STATE.timeout, ...parsed.timeout, active: false },
          config: { ...DEFAULT_STATE.config, ...parsed.config },
          matchInfo: { ...DEFAULT_STATE.matchInfo, ...parsed.matchInfo }
        };
      }
    } catch (e) {
      console.warn('Could not load saved state from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save state to localStorage:', e);
    }
  }

  initSyncChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        if (event.data && event.data.type === 'SYNC_STATE') {
          this.state = event.data.payload;
          this.notifySubscribers({ isRemote: true });
        } else if (event.data && event.data.type === 'TRIGGER_SOUND') {
          if (window.scoreboardAudio && this.state.config.soundEnabled) {
            if (event.data.sound === 'horn') window.scoreboardAudio.playHorn();
            else if (event.data.sound === 'shotClock') window.scoreboardAudio.playShotClockBuzzer();
            else if (event.data.sound === 'whistle') window.scoreboardAudio.playWhistle();
            else if (event.data.sound === 'ding') window.scoreboardAudio.playScoreDing();
            else if (event.data.sound === 'countdown') {
              if (this.state.config.countdownBeepEnabled !== false) {
                window.scoreboardAudio.playCountdownBeep(event.data.pitch || 800, event.data.duration || 0.12);
              }
            }
          }
        }
      };
    }

    // Fallback: window storage event
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          this.state = JSON.parse(e.newValue);
          this.notifySubscribers({ isRemote: true });
        } catch (err) {
          console.error(err);
        }
      }
    });
  }

  broadcast(triggerSound = null, extraData = {}) {
    this.saveState();
    if (this.channel) {
      this.channel.postMessage({
        type: 'SYNC_STATE',
        payload: this.state
      });
      if (triggerSound) {
        this.channel.postMessage({
          type: 'TRIGGER_SOUND',
          sound: triggerSound,
          ...extraData
        });
      }
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(fn => fn !== callback);
    };
  }

  notifySubscribers(options = {}) {
    this.subscribers.forEach(cb => {
      try {
        cb(this.state, options);
      } catch (err) {
        console.error('Subscriber callback error:', err);
      }
    });
  }

  pushHistory(description) {
    // Keep last 25 states for undo
    if (this.history.length >= 25) {
      this.history.shift();
    }
    this.history.push({
      description,
      state: JSON.parse(JSON.stringify(this.state))
    });
  }

  undo() {
    if (this.history.length === 0) return false;
    const prev = this.history.pop();
    if (prev && prev.state) {
      // Keep clocks current run status or restore safely
      const wasGameRunning = this.state.gameClock.running;
      const wasShotRunning = this.state.shotClock.running;
      this.state = prev.state;
      this.state.gameClock.running = wasGameRunning;
      this.state.shotClock.running = wasShotRunning;
      this.logEvent(`Undo: ${prev.description}`, 'UNDO');
      this.broadcast();
      this.notifySubscribers();
      return true;
    }
    return false;
  }

  logEvent(detail, type = 'EVENT') {
    const timeFormatted = this.formatClock(this.state.gameClock.remainingMs);
    const entry = {
      id: Date.now() + Math.random().toString(36).substr(2, 4),
      time: new Date().toLocaleTimeString(),
      gameTime: timeFormatted,
      type,
      detail
    };
    this.state.logs.unshift(entry);
    if (this.state.logs.length > 50) {
      this.state.logs.pop();
    }
  }

  formatClock(ms) {
    const totalSecs = Math.max(0, Math.ceil(ms / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // ================= ACTION METHODS =================

  // Scoring
  addPoints(teamKey, points) {
    const team = this.state[teamKey];
    if (!team) return;

    this.pushHistory(`${team.name} +${points} pts`);
    team.score = Math.max(0, team.score + points);

    this.logEvent(`${team.name} mendapatkan +${points} poin (Skor: ${team.score})`, 'SCORE');

    // Check 3x3 Target Win condition (First to 21 points)
    this.checkWinCondition(teamKey);

    this.broadcast();
    this.notifySubscribers();
  }

  subtractPoints(teamKey, points = 1) {
    const team = this.state[teamKey];
    if (!team || team.score <= 0) return;

    this.pushHistory(`${team.name} -${points} pts`);
    team.score = Math.max(0, team.score - points);
    this.logEvent(`Koreksi skor ${team.name}: -${points} (Skor: ${team.score})`, 'SCORE_CORRECTION');

    // Jika pertandingan sebelumnya selesai namun terjadi koreksi skor:
    if (this.state.gameClock.isFinished) {
      if (this.state.gameClock.isOvertime) {
        const diff = Math.abs(this.state.teamA.score - this.state.teamB.score);
        if (diff < 2) {
          this.state.gameClock.isFinished = false;
          this.state.winner = null;
          this.state.winnerReason = null;
        }
      } else if (this.state.config.targetScoreEnabled) {
        if (this.state.teamA.score < this.state.config.targetScore && this.state.teamB.score < this.state.config.targetScore) {
          this.state.gameClock.isFinished = false;
          this.state.winner = null;
          this.state.winnerReason = null;
        }
      }
    }

    this.broadcast();
    this.notifySubscribers();
  }

  checkWinCondition(scoringTeamKey) {
    const team = this.state[scoringTeamKey];
    if (!this.state.config.targetScoreEnabled) return;

    // Normal play: first to 21
    if (!this.state.gameClock.isOvertime) {
      if (team.score >= this.state.config.targetScore) {
        this.triggerGameEnd(`${team.name} Menang! Mencapai target ${this.state.config.targetScore} poin!`);
      }
    } else {
      // Overtime play: aturan selisih skor harus minimal 2 poin (lead by 2 points)!
      const diff = this.state.teamA.score - this.state.teamB.score;

      if (diff >= 2) {
        this.triggerGameEnd(`${this.state.teamA.name} Menang di Overtime! Unggul selisih ${diff} poin (${this.state.teamA.score} - ${this.state.teamB.score})`);
      } else if (diff <= -2) {
        this.triggerGameEnd(`${this.state.teamB.name} Menang di Overtime! Unggul selisih ${Math.abs(diff)} poin (${this.state.teamB.score} - ${this.state.teamA.score})`);
      }
    }
  }

  triggerGameEnd(reason) {
    this.state.gameClock.running = false;
    this.state.shotClock.running = false;
    this.state.gameClock.isFinished = true;
    this.state.winnerReason = reason;

    if (this.state.teamA.score > this.state.teamB.score) {
      this.state.winner = 'teamA';
    } else if (this.state.teamB.score > this.state.teamA.score) {
      this.state.winner = 'teamB';
    } else {
      this.state.winner = 'tie';
    }

    this.logEvent(`GAME SELESAI: ${reason}`, 'GAME_END');
    this.saveMatchToArchive();

    if (window.scoreboardAudio && this.state.config.soundEnabled) {
      window.scoreboardAudio.playHorn(2.0);
    }
    this.broadcast('horn');
  }

  // Fouls
  addFoul(teamKey) {
    const team = this.state[teamKey];
    if (!team) return;

    this.pushHistory(`${team.name} Foul`);
    team.fouls += 1;

    let foulType = 'FOUL';
    if (team.fouls >= this.state.config.teamFoulDoubleBonus) {
      foulType = 'DOUBLE_BONUS_FOUL';
      this.logEvent(`${team.name} Foul ke-${team.fouls} (PENALTI: 2 Free Throw + Penguasaan Bola!)`, 'FOUL_PENALTY');
    } else if (team.fouls >= this.state.config.teamFoulBonusThreshold) {
      foulType = 'BONUS_FOUL';
      this.logEvent(`${team.name} Foul ke-${team.fouls} (PENALTI: 2 Free Throw!)`, 'FOUL_PENALTY');
    } else {
      this.logEvent(`${team.name} Foul ke-${team.fouls}`, 'FOUL');
    }

    this.broadcast();
    this.notifySubscribers();
  }

  subtractFoul(teamKey) {
    const team = this.state[teamKey];
    if (!team || team.fouls <= 0) return;

    this.pushHistory(`Koreksi Foul ${team.name}`);
    team.fouls -= 1;
    this.logEvent(`Koreksi foul ${team.name}: total sekarang ${team.fouls}`, 'FOUL_CORRECTION');

    this.broadcast();
    this.notifySubscribers();
  }

  // Timeouts
  callTimeout(teamKey) {
    const team = this.state[teamKey];
    if (!team || team.timeouts <= 0) return;

    this.pushHistory(`Timeout ${team.name}`);
    team.timeouts -= 1;
    this.state.gameClock.running = false;
    this.state.shotClock.running = false;
    this.state.timeout.active = true;
    this.state.timeout.remainingMs = 30 * 1000;
    this.state.timeout.callingTeam = teamKey;

    this.logEvent(`TIMEOUT dipanggil oleh ${team.name} (30 Detik)`, 'TIMEOUT');

    if (window.scoreboardAudio && this.state.config.soundEnabled) {
      window.scoreboardAudio.playWhistle();
    }

    this.broadcast('whistle');
    this.notifySubscribers();
  }

  stopTimeout() {
    this.state.timeout.active = false;
    this.state.timeout.callingTeam = null;
    this.broadcast();
    this.notifySubscribers();
  }

  resetTimeouts() {
    this.state.teamA.timeouts = 1;
    this.state.teamB.timeouts = 1;
    this.broadcast();
    this.notifySubscribers();
  }

  // Possession
  togglePossession(target = null) {
    if (target) {
      this.state.possession = target;
    } else {
      if (this.state.possession === 'A') {
        this.state.possession = 'B';
      } else if (this.state.possession === 'B') {
        this.state.possession = null;
      } else {
        this.state.possession = 'A';
      }
    }
    this.broadcast();
    this.notifySubscribers();
  }

  // Sides swap
  swapSides() {
    this.pushHistory('Tukar Sisi Lapangan');
    const temp = JSON.parse(JSON.stringify(this.state.teamA));
    this.state.teamA = JSON.parse(JSON.stringify(this.state.teamB));
    this.state.teamB = temp;

    if (this.state.possession === 'A') this.state.possession = 'B';
    else if (this.state.possession === 'B') this.state.possession = 'A';

    this.logEvent('Tim bertukar posisi sisi lapangan (Kiri / Kanan)', 'SWAP_SIDES');
    this.broadcast();
    this.notifySubscribers();
  }

  // Overtime
  startOvertime() {
    this.pushHistory('Mulai Overtime');
    this.state.gameClock.isOvertime = true;
    this.state.gameClock.period = 2;
    this.state.gameClock.isFinished = false;
    this.state.winner = null;
    this.state.winnerReason = null;
    this.state.gameClock.remainingMs = 0; // Overtime in 3x3 has no game clock!
    this.state.shotClock.totalMs = (this.state.config.shotClockSeconds || 12) * 1000;
    this.state.shotClock.remainingMs = this.state.shotClock.totalMs;
    this.state.shotClock.running = false;
    this.state.gameClock.running = false;

    this.logEvent(`OVERTIME DIMULAI! Aturan 3x3: Pemenang ditentukan oleh tim yang unggul selisih minimal 2 poin!`, 'OVERTIME');

    if (window.scoreboardAudio && this.state.config.soundEnabled) {
      window.scoreboardAudio.playHorn(1.0);
    }

    this.broadcast('horn');
    this.notifySubscribers();
  }

  // Reset Match
  resetMatch() {
    this.pushHistory('Reset Pertandingan');
    const prevConfig = this.state.config;
    const prevInfo = this.state.matchInfo;
    const teamAName = this.state.teamA.name;
    const teamBName = this.state.teamB.name;
    const teamAColor = this.state.teamA.color;
    const teamBColor = this.state.teamB.color;

    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.state.config = prevConfig;
    this.state.matchInfo = prevInfo;
    this.state.teamA.name = teamAName;
    this.state.teamB.name = teamBName;
    this.state.teamA.color = teamAColor;
    this.state.teamB.color = teamBColor;

    this.state.gameClock.totalMs = prevConfig.gameDurationMinutes * 60 * 1000;
    this.state.gameClock.remainingMs = this.state.gameClock.totalMs;
    this.state.shotClock.totalMs = prevConfig.shotClockSeconds * 1000;
    this.state.shotClock.remainingMs = this.state.shotClock.totalMs;

    this.logEvent('Pertandingan baru direset (Skor 0-0, Waktu 10:00, Shot Clock 12s)', 'RESET_MATCH');
    this.broadcast();
    this.notifySubscribers();
  }

  // Shot Clock Enable / Disable ("Shoot Lock")
  isShotClockActive() {
    return this.state.shotClock.enabled !== false && this.state.shotClock.visible !== false;
  }

  toggleShotClockEnabled() {
    const nextState = !this.isShotClockActive();
    this.setShotClockEnabled(nextState);
  }

  setShotClockEnabled(enabled) {
    const isActive = Boolean(enabled);
    this.state.shotClock.enabled = isActive;
    this.state.shotClock.visible = isActive;
    if (!isActive) {
      this.state.shotClock.running = false;
      this.logEvent('Shot Clock ("Shoot Lock") dinonaktifkan', 'SHOT_CLOCK_OFF');
    } else {
      this.logEvent('Shot Clock ("Shoot Lock") diaktifkan', 'SHOT_CLOCK_ON');
    }
    this.broadcast();
    this.notifySubscribers();
  }

  updateSettings(newSettings) {
    if (newSettings.config) {
      this.state.config = { ...this.state.config, ...newSettings.config };
      if (window.scoreboardAudio) {
        window.scoreboardAudio.setEnabled(this.state.config.soundEnabled);
        window.scoreboardAudio.setVolume(this.state.config.soundVolume);
      }
    }
    if (newSettings.shotClock) {
      this.state.shotClock = { ...this.state.shotClock, ...newSettings.shotClock };
      if (newSettings.shotClock.enabled !== undefined) {
        this.state.shotClock.visible = Boolean(newSettings.shotClock.enabled);
        if (!this.state.shotClock.enabled) {
          this.state.shotClock.running = false;
        }
      }
    }
    if (newSettings.teamA) {
      this.state.teamA = { ...this.state.teamA, ...newSettings.teamA };
    }
    if (newSettings.teamB) {
      this.state.teamB = { ...this.state.teamB, ...newSettings.teamB };
    }
    if (newSettings.matchInfo) {
      this.state.matchInfo = { ...this.state.matchInfo, ...newSettings.matchInfo };
    }

    this.broadcast();
    this.notifySubscribers();
  }

  // ================= MATCH ARCHIVE METHODS =================
  getSavedMatches() {
    try {
      const saved = localStorage.getItem(MATCHES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Error reading saved matches:', e);
      return [];
    }
  }

  saveMatchToArchive(customNote = '') {
    try {
      const matches = this.getSavedMatches();
      const now = new Date();

      let winner = this.state.winner;
      if (!winner || winner === 'tie') {
        if (this.state.teamA.score > this.state.teamB.score) winner = 'teamA';
        else if (this.state.teamB.score > this.state.teamA.score) winner = 'teamB';
        else winner = 'tie';
      }

      const winnerName = winner === 'teamA' ? this.state.teamA.name :
                         winner === 'teamB' ? this.state.teamB.name : 'Imbang';

      const record = {
        id: 'match_' + Date.now(),
        date: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        tournament: this.state.matchInfo.title || 'Turnamen Basket 3x3',
        court: this.state.matchInfo.court || 'Lapangan 1',
        teamA: {
          name: this.state.teamA.name,
          score: this.state.teamA.score,
          fouls: this.state.teamA.fouls
        },
        teamB: {
          name: this.state.teamB.name,
          score: this.state.teamB.score,
          fouls: this.state.teamB.fouls
        },
        winner,
        winnerName,
        winnerReason: this.state.winnerReason || (winner !== 'tie' ? `${winnerName} Menang` : 'Skor Imbang'),
        isOvertime: Boolean(this.state.gameClock.isOvertime),
        note: customNote,
        logs: JSON.parse(JSON.stringify(this.state.logs || []))
      };

      matches.unshift(record);
      if (matches.length > 50) matches.pop();

      localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
      this.logEvent(`Pertandingan disimpan ke arsip: ${record.teamA.name} (${record.teamA.score}) vs ${record.teamB.name} (${record.teamB.score})`, 'ARCHIVE');
      return record;
    } catch (e) {
      console.error('Error saving match to archive:', e);
      return null;
    }
  }

  deleteSavedMatch(id) {
    try {
      const matches = this.getSavedMatches().filter(m => m.id !== id);
      localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
      return true;
    } catch (e) {
      console.error('Error deleting match:', e);
      return false;
    }
  }

  clearAllSavedMatches() {
    try {
      localStorage.removeItem(MATCHES_STORAGE_KEY);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  formatMatchSummaryText(match) {
    return `🏀 *HASIL PERTANDINGAN BASKET 3x3*
━━━━━━━━━━━━━━━━━━━━━━
📅 Tanggal: ${match.date} (${match.time})
📍 Lokasi: ${match.court} - ${match.tournament}

🏆 *PEMENANG:* ${match.winnerName}
ℹ️ Keterangan: ${match.winnerReason} ${match.isOvertime ? '(Overtime)' : ''}

📊 *SKOR AKHIR:*
🔴 ${match.teamA.name}: ${match.teamA.score} Poin (Fouls: ${match.teamA.fouls})
🔵 ${match.teamB.name}: ${match.teamB.score} Poin (Fouls: ${match.teamB.fouls})
━━━━━━━━━━━━━━━━━━━━━━`;
  }
}

window.scoreboardState = new ScoreboardState();
