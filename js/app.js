/**
 * FIBA 3x3 Arena Scoreboard - Main Application Controller
 * Handles user interactions, touch controls, keyboard shortcuts, modals, and reactive rendering.
 */

document.addEventListener('DOMContentLoaded', () => {
  const stateMgr = window.scoreboardState;
  const timer = window.scoreboardTimer;
  const audio = window.scoreboardAudio;

  // DOM Elements Cache
  const dom = {
    // Top Icons & Tools
    btnSettingsIcon: document.getElementById('btnSettingsIcon'),
    btnTimerIcon: document.getElementById('btnTimerIcon'),
    btnHornManual: document.getElementById('btnHornManual'),
    btnUndoMini: document.getElementById('btnUndoMini'),
    btnFullscreenMini: document.getElementById('btnFullscreenMini'),

    // Team 1 Display & Interactive Cards
    teamAName: document.getElementById('teamAName'),
    teamAScoreBox: document.getElementById('teamAScoreBox'),
    teamAScore: document.getElementById('teamAScore'),
    teamAFoulBox: document.getElementById('teamAFoulBox'),
    teamAFoulNum: document.getElementById('teamAFoulNum'),
    btnA_Plus2: document.getElementById('btnA_Plus2'),
    btnA_Plus1: document.getElementById('btnA_Plus1'),
    btnA_Minus1: document.getElementById('btnA_Minus1'),
    btnA_FoulPlus: document.getElementById('btnA_FoulPlus'),
    btnA_FoulMinus: document.getElementById('btnA_FoulMinus'),

    // Team 2 Display & Interactive Cards
    teamBName: document.getElementById('teamBName'),
    teamBScoreBox: document.getElementById('teamBScoreBox'),
    teamBScore: document.getElementById('teamBScore'),
    teamBFoulBox: document.getElementById('teamBFoulBox'),
    teamBFoulNum: document.getElementById('teamBFoulNum'),
    btnB_Plus2: document.getElementById('btnB_Plus2'),
    btnB_Plus1: document.getElementById('btnB_Plus1'),
    btnB_Minus1: document.getElementById('btnB_Minus1'),
    btnB_FoulPlus: document.getElementById('btnB_FoulPlus'),
    btnB_FoulMinus: document.getElementById('btnB_FoulMinus'),

    // Clocks
    gameClockBox: document.getElementById('gameClockBox'),
    gameClockDigits: document.getElementById('gameClockDigits'),
    shotClockBox: document.getElementById('shotClockBox'),
    shotClockDigits: document.getElementById('shotClockDigits'),
    btnToggleShotClock: document.getElementById('btnToggleShotClock'),
    shotToggleText: document.getElementById('shotToggleText'),

    // Modals
    settingsModal: document.getElementById('settingsModal'),
    timerModal: document.getElementById('timerModal'),
    shortcutsModal: document.getElementById('shortcutsModal'),
    winnerModal: document.getElementById('winnerModal'),

    // Settings Inputs
    inputTeamAName: document.getElementById('inputTeamAName'),
    inputTeamBName: document.getElementById('inputTeamBName'),
    inputGameDuration: document.getElementById('inputGameDuration'),
    inputShotClockDuration: document.getElementById('inputShotClockDuration'),
    inputShotClockEnabled: document.getElementById('inputShotClockEnabled'),
    inputTargetScoreEnabled: document.getElementById('inputTargetScoreEnabled'),
    inputSoundEnabled: document.getElementById('inputSoundEnabled'),
    btnSaveSettings: document.getElementById('btnSaveSettings'),
    btnResetMatchSettings: document.getElementById('btnResetMatchSettings'),
    btnShowShortcutsModal: document.getElementById('btnShowShortcutsModal'),

    // Quick Timer Modal Actions
    btnToggleClockModal: document.getElementById('btnToggleClockModal'),
    btnModalClockLabel: document.getElementById('btnModalClockLabel'),
    btnResetShot12Modal: document.getElementById('btnResetShot12Modal'),
    btnResetShot14Modal: document.getElementById('btnResetShot14Modal'),
    btnResetClock10m: document.getElementById('btnResetClock10m'),
    btnPlus1mModal: document.getElementById('btnPlus1mModal'),
    btnMinus1mModal: document.getElementById('btnMinus1mModal'),
    btnPlus1sModal: document.getElementById('btnPlus1sModal'),
    btnMinus1sModal: document.getElementById('btnMinus1sModal'),
    btnStartOvertimeModal: document.getElementById('btnStartOvertimeModal'),
    btnToggleShotBlankModal: document.getElementById('btnToggleShotBlankModal'),

    // Winner Modal
    winnerTeamName: document.getElementById('winnerTeamName'),
    winnerReasonText: document.getElementById('winnerReasonText'),
    winnerScoreA: document.getElementById('winnerScoreA'),
    winnerScoreB: document.getElementById('winnerScoreB'),
    btnWinnerOvertime: document.getElementById('btnWinnerOvertime'),
    btnWinnerReset: document.getElementById('btnWinnerReset'),

    // History Modal & Elements
    btnHistory: document.getElementById('btnHistory'),
    historyModal: document.getElementById('historyModal'),
    tabBtnTimeline: document.getElementById('tabBtnTimeline'),
    tabBtnArchive: document.getElementById('tabBtnArchive'),
    paneTimeline: document.getElementById('paneTimeline'),
    paneArchive: document.getElementById('paneArchive'),
    timelineListContainer: document.getElementById('timelineListContainer'),
    savedMatchesCount: document.getElementById('savedMatchesCount'),
    matchesArchiveList: document.getElementById('matchesArchiveList'),
    btnSaveCurrentMatchManual: document.getElementById('btnSaveCurrentMatchManual'),
    btnClearLiveTimeline: document.getElementById('btnClearLiveTimeline'),
    btnExportAllArchive: document.getElementById('btnExportAllArchive'),
    btnClearAllArchive: document.getElementById('btnClearAllArchive'),
    toastNotice: document.getElementById('toastNotice')
  };

  // ================= RENDER LOGIC =================

  function render(state) {
    if (!state) return;

    // Team 1
    dom.teamAName.textContent = state.teamA.name || 'TEAM1';
    dom.teamAScore.textContent = state.teamA.score;
    dom.teamAFoulNum.textContent = state.teamA.fouls;

    if (state.teamA.fouls >= state.config.teamFoulDoubleBonus) {
      dom.teamAFoulBox.className = 'fouls-box-card double-penalty';
    } else if (state.teamA.fouls >= state.config.teamFoulBonusThreshold) {
      dom.teamAFoulBox.className = 'fouls-box-card penalty';
    } else {
      dom.teamAFoulBox.className = 'fouls-box-card';
    }

    // Team 2
    dom.teamBName.textContent = state.teamB.name || 'TEAM2';
    dom.teamBScore.textContent = state.teamB.score;
    dom.teamBFoulNum.textContent = state.teamB.fouls;

    if (state.teamB.fouls >= state.config.teamFoulDoubleBonus) {
      dom.teamBFoulBox.className = 'fouls-box-card double-penalty';
    } else if (state.teamB.fouls >= state.config.teamFoulBonusThreshold) {
      dom.teamBFoulBox.className = 'fouls-box-card penalty';
    } else {
      dom.teamBFoulBox.className = 'fouls-box-card';
    }

    // Game Clock
    if (state.gameClock.isOvertime) {
      dom.gameClockDigits.textContent = 'OT';
      dom.gameClockBox.title = 'Overtime (Selisih 2 Poin untuk Menang) - Klik untuk Mulai/Jeda Shot Clock [SPACE]';
    } else {
      dom.gameClockBox.title = 'Klik untuk Mulai / Jeda Waktu [SPACE]';
      const ms = state.gameClock.remainingMs;
      const totalSec = Math.ceil(ms / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;

      if (ms < 10000 && ms > 0) {
        const tenths = Math.floor((ms % 1000) / 100);
        dom.gameClockDigits.textContent = `0:${secs < 10 ? '0' : ''}${secs}.${tenths}`;
      } else {
        dom.gameClockDigits.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      }
    }

    // Timer modal button label
    if (dom.btnModalClockLabel) {
      dom.btnModalClockLabel.textContent = state.gameClock.running ? '⏸ Jeda Waktu' : '▶ Mulai Waktu';
    }

    // Shot Clock ("Shoot Lock")
    const isShotClockActive = state.shotClock.enabled !== false && state.shotClock.visible !== false;

    if (!isShotClockActive) {
      dom.shotClockDigits.textContent = 'OFF';
      dom.shotClockDigits.className = 'shot-clock-val disabled';
      if (dom.shotClockBox) dom.shotClockBox.classList.add('disabled');
      if (dom.btnToggleShotClock) {
        dom.btnToggleShotClock.className = 'shot-toggle-btn disabled';
        if (dom.shotToggleText) dom.shotToggleText.textContent = 'SHOT CLOCK: NONAKTIF';
        dom.btnToggleShotClock.title = 'Shot clock sedang nonaktif. Klik untuk aktifkan [C]';
      }
      if (dom.btnToggleShotBlankModal) {
        dom.btnToggleShotBlankModal.textContent = '🟢 Aktifkan Shot Clock [C]';
      }
    } else {
      if (dom.shotClockBox) dom.shotClockBox.classList.remove('disabled');
      if (dom.btnToggleShotClock) {
        dom.btnToggleShotClock.className = 'shot-toggle-btn active';
        if (dom.shotToggleText) dom.shotToggleText.textContent = 'SHOT CLOCK: AKTIF';
        dom.btnToggleShotClock.title = 'Shot clock sedang aktif. Klik untuk matikan [C]';
      }
      if (dom.btnToggleShotBlankModal) {
        dom.btnToggleShotBlankModal.textContent = '🛑 Nonaktifkan Shot Clock [C]';
      }

      const shotMs = state.shotClock.remainingMs;
      const shotSec = Math.ceil(shotMs / 1000);

      // Display with tenths if under 5 seconds (just like the 4.7 in screenshot!)
      if (shotMs <= 5000 && shotMs > 0) {
        const tenths = Math.floor((shotMs % 1000) / 100);
        dom.shotClockDigits.textContent = `${Math.floor(shotMs / 1000)}.${tenths}`;
      } else {
        dom.shotClockDigits.textContent = `${shotSec}`;
      }

      if (shotSec <= 0 || shotMs <= 0) {
        dom.shotClockDigits.className = 'shot-clock-val expired';
      } else {
        dom.shotClockDigits.className = 'shot-clock-val';
      }
    }

    // Winner celebration modal
    if (state.winner && state.winner !== 'tie') {
      dom.winnerTeamName.textContent = `${state[state.winner].name} JUARA!`;
      dom.winnerReasonText.textContent = state.winnerReason || 'Pemenang Pertandingan';
      dom.winnerScoreA.textContent = state.teamA.score;
      dom.winnerScoreB.textContent = state.teamB.score;
      dom.winnerModal.classList.add('active');
    }

    // Update live timeline if history modal is open
    if (dom.historyModal && dom.historyModal.classList.contains('active')) {
      renderTimelineLogs(state.logs);
    }
  }

  // ================= TOAST & HISTORY HELPERS =================

  function showToast(msg) {
    if (!dom.toastNotice) return;
    dom.toastNotice.textContent = msg;
    dom.toastNotice.classList.add('show');
    setTimeout(() => {
      dom.toastNotice.classList.remove('show');
    }, 2400);
  }

  function renderTimelineLogs(logs) {
    if (!dom.timelineListContainer) return;
    dom.timelineListContainer.innerHTML = '';
    if (!logs || logs.length === 0) {
      dom.timelineListContainer.innerHTML = '<div style="color: #64748b; padding: 28px; text-align: center;">Belum ada riwayat aktivitas pada pertandingan ini.</div>';
      return;
    }
    logs.forEach(log => {
      const item = document.createElement('div');
      let typeClass = '';
      if (log.type === 'SCORE') typeClass = 'score';
      else if (log.type && log.type.includes('FOUL')) typeClass = 'foul';
      else if (log.type === 'GAME_END' || log.type === 'OVERTIME') typeClass = 'game-end';

      item.className = `timeline-entry ${typeClass}`;
      item.innerHTML = `
        <div>
          <span class="timeline-entry-time">[${log.gameTime}]</span>
          <strong>${escapeHtml(log.detail)}</strong>
        </div>
        <span style="color: #64748b; font-size: 0.75rem;">${log.time}</span>
      `;
      dom.timelineListContainer.appendChild(item);
    });
  }

  function renderSavedMatchesArchive() {
    if (!dom.matchesArchiveList) return;
    const matches = stateMgr.getSavedMatches();

    if (dom.savedMatchesCount) {
      dom.savedMatchesCount.textContent = matches.length;
    }

    dom.matchesArchiveList.innerHTML = '';
    if (!matches || matches.length === 0) {
      dom.matchesArchiveList.innerHTML = '<div style="color: #64748b; padding: 32px; text-align: center;">Belum ada arsip pertandingan selesai.<br><small style="color: #475569;">Pertandingan akan otomatis tersimpan saat game berakhir atau dapat disimpan manual.</small></div>';
      return;
    }

    matches.forEach(m => {
      const card = document.createElement('div');
      card.className = 'archive-card';

      const isWinnerA = m.winner === 'teamA';
      const isWinnerB = m.winner === 'teamB';

      card.innerHTML = `
        <div class="archive-card-header">
          <span>📅 ${escapeHtml(m.date)} • ${escapeHtml(m.time)} | ${escapeHtml(m.court)}</span>
          <span class="archive-winner-badge">🏆 ${escapeHtml(m.winnerName)}</span>
        </div>
        <div class="archive-match-score">
          <div class="archive-team">
            <span class="archive-team-name ${isWinnerA ? 'winner' : ''}">${escapeHtml(m.teamA.name)}</span>
            <span class="archive-team-foul">Fouls: ${m.teamA.fouls}</span>
          </div>
          <div class="archive-score-digits">
            <span class="${isWinnerA ? 'winner' : ''}">${m.teamA.score}</span>
            <span style="color: #475569; margin: 0 8px;">:</span>
            <span class="${isWinnerB ? 'winner' : ''}">${m.teamB.score}</span>
          </div>
          <div class="archive-team right">
            <span class="archive-team-name ${isWinnerB ? 'winner' : ''}">${escapeHtml(m.teamB.name)}</span>
            <span class="archive-team-foul">Fouls: ${m.teamB.fouls}</span>
          </div>
        </div>
        <div class="archive-card-footer">
          <span class="archive-reason-txt">ℹ️ ${escapeHtml(m.winnerReason)} ${m.isOvertime ? '(Overtime)' : ''}</span>
          <div class="archive-btn-group">
            <button class="btn-mini-action btn-copy-match" data-id="${m.id}" title="Salin Ringkasan">📋 Salin</button>
            <button class="btn-mini-action danger btn-del-match" data-id="${m.id}" title="Hapus Arsip">🗑️ Hapus</button>
          </div>
        </div>
      `;
      dom.matchesArchiveList.appendChild(card);
    });

    // Wire copy buttons
    dom.matchesArchiveList.querySelectorAll('.btn-copy-match').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const match = matches.find(m => m.id === id);
        if (match) {
          const text = stateMgr.formatMatchSummaryText(match);
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
              showToast('Ringkasan pertandingan disalin ke clipboard!');
            }).catch(() => {
              prompt('Salin ringkasan berikut:', text);
            });
          } else {
            prompt('Salin ringkasan berikut:', text);
          }
        }
      });
    });

    // Wire delete buttons
    dom.matchesArchiveList.querySelectorAll('.btn-del-match').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Hapus arsip pertandingan ini?')) {
          stateMgr.deleteSavedMatch(id);
          renderSavedMatchesArchive();
          showToast('Arsip pertandingan berhasil dihapus.');
        }
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ================= EVENT LISTENERS =================

  // Tap Clock -> Toggle Run/Pause
  dom.gameClockBox.addEventListener('click', () => {
    audio.init();
    timer.toggleMasterClock();
  });

  // Tap Shot Clock -> Reset to 12s (Official 3x3 rule) / Re-enable if disabled
  dom.shotClockBox.addEventListener('click', () => {
    audio.init();
    const isShotActive = stateMgr.state.shotClock.enabled !== false && stateMgr.state.shotClock.visible !== false;
    if (!isShotActive) {
      timer.resetShotClock(stateMgr.state.gameClock.running, 12, true);
      showToast('Shot Clock diaktifkan kembali (12 Detik)');
    } else {
      timer.resetShotClock(stateMgr.state.gameClock.running, 12);
    }
  });

  // Tap Toggle Shot Clock Button (Quick Enable/Disable Pill)
  if (dom.btnToggleShotClock) {
    dom.btnToggleShotClock.addEventListener('click', () => {
      audio.init();
      timer.toggleShotClockEnabled();
      const nextActive = stateMgr.state.shotClock.enabled !== false && stateMgr.state.shotClock.visible !== false;
      showToast(nextActive ? 'Shot Clock Diaktifkan' : 'Shot Clock Dinonaktifkan');
    });
  }

  // Tap Score Boxes directly -> +1 point
  dom.teamAScoreBox.addEventListener('click', () => {
    audio.init();
    stateMgr.addPoints('teamA', 1);
  });

  dom.teamBScoreBox.addEventListener('click', () => {
    audio.init();
    stateMgr.addPoints('teamB', 1);
  });

  // Tap Foul Boxes directly -> +1 foul
  dom.teamAFoulBox.addEventListener('click', () => {
    audio.init();
    stateMgr.addFoul('teamA');
  });

  dom.teamBFoulBox.addEventListener('click', () => {
    audio.init();
    stateMgr.addFoul('teamB');
  });

  // Tap Team Names -> Rename inline
  dom.teamAName.addEventListener('click', () => {
    const current = stateMgr.state.teamA.name || 'TEAM1';
    const newName = prompt('Ubah Nama Tim 1:', current);
    if (newName && newName.trim()) {
      stateMgr.updateSettings({ teamA: { name: newName.trim().toUpperCase() } });
    }
  });

  dom.teamBName.addEventListener('click', () => {
    const current = stateMgr.state.teamB.name || 'TEAM2';
    const newName = prompt('Ubah Nama Tim 2:', current);
    if (newName && newName.trim()) {
      stateMgr.updateSettings({ teamB: { name: newName.trim().toUpperCase() } });
    }
  });

  // Team 1 Action Strip Buttons
  dom.btnA_Plus2.addEventListener('click', () => { audio.init(); stateMgr.addPoints('teamA', 2); });
  dom.btnA_Plus1.addEventListener('click', () => { audio.init(); stateMgr.addPoints('teamA', 1); });
  dom.btnA_Minus1.addEventListener('click', () => stateMgr.subtractPoints('teamA', 1));
  dom.btnA_FoulPlus.addEventListener('click', () => { audio.init(); stateMgr.addFoul('teamA'); });
  dom.btnA_FoulMinus.addEventListener('click', () => stateMgr.subtractFoul('teamA'));

  // Team 2 Action Strip Buttons
  dom.btnB_Plus2.addEventListener('click', () => { audio.init(); stateMgr.addPoints('teamB', 2); });
  dom.btnB_Plus1.addEventListener('click', () => { audio.init(); stateMgr.addPoints('teamB', 1); });
  dom.btnB_Minus1.addEventListener('click', () => stateMgr.subtractPoints('teamB', 1));
  dom.btnB_FoulPlus.addEventListener('click', () => { audio.init(); stateMgr.addFoul('teamB'); });
  dom.btnB_FoulMinus.addEventListener('click', () => stateMgr.subtractFoul('teamB'));

  // Floating Tools
  dom.btnHornManual.addEventListener('click', () => {
    audio.init();
    audio.playHorn(1.2);
    stateMgr.broadcast('horn');
  });

  dom.btnUndoMini.addEventListener('click', () => stateMgr.undo());

  dom.btnFullscreenMini.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Open Settings Modal (⚙️)
  dom.btnSettingsIcon.addEventListener('click', () => {
    const s = stateMgr.state;
    dom.inputTeamAName.value = s.teamA.name || 'TEAM1';
    dom.inputTeamBName.value = s.teamB.name || 'TEAM2';
    dom.inputGameDuration.value = s.config.gameDurationMinutes;
    dom.inputShotClockDuration.value = s.config.shotClockSeconds;
    if (dom.inputShotClockEnabled) {
      dom.inputShotClockEnabled.checked = s.shotClock.enabled !== false && s.shotClock.visible !== false;
    }
    dom.inputTargetScoreEnabled.checked = s.config.targetScoreEnabled;
    dom.inputSoundEnabled.checked = s.config.soundEnabled;
    dom.settingsModal.classList.add('active');
  });

  // Open Quick Timer Modal (⏱)
  dom.btnTimerIcon.addEventListener('click', () => {
    dom.timerModal.classList.add('active');
  });

  // Close modals on X
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-backdrop');
      if (modal) modal.classList.remove('active');
    });
  });

  // Settings Save
  dom.btnSaveSettings.addEventListener('click', () => {
    const newGameDuration = parseInt(dom.inputGameDuration.value, 10) || 10;
    const newShotDuration = parseInt(dom.inputShotClockDuration.value, 10) || 12;
    const isShotClockActive = dom.inputShotClockEnabled ? dom.inputShotClockEnabled.checked : true;

    stateMgr.updateSettings({
      teamA: { name: dom.inputTeamAName.value.trim().toUpperCase() || 'TEAM1' },
      teamB: { name: dom.inputTeamBName.value.trim().toUpperCase() || 'TEAM2' },
      shotClock: {
        enabled: isShotClockActive,
        visible: isShotClockActive
      },
      config: {
        gameDurationMinutes: newGameDuration,
        shotClockSeconds: newShotDuration,
        targetScoreEnabled: dom.inputTargetScoreEnabled.checked,
        soundEnabled: dom.inputSoundEnabled.checked
      }
    });

    dom.settingsModal.classList.remove('active');
  });

  dom.btnResetMatchSettings.addEventListener('click', () => {
    if (confirm('Yakin ingin mereset pertandingan ke skor 0 - 0?')) {
      stateMgr.resetMatch();
      dom.settingsModal.classList.remove('active');
      dom.winnerModal.classList.remove('active');
    }
  });

  dom.btnShowShortcutsModal.addEventListener('click', () => {
    dom.settingsModal.classList.remove('active');
    dom.shortcutsModal.classList.add('active');
  });

  // Quick Timer Actions
  dom.btnToggleClockModal.addEventListener('click', () => {
    audio.init();
    timer.toggleMasterClock();
  });

  dom.btnResetShot12Modal.addEventListener('click', () => {
    audio.init();
    timer.resetShotClock(stateMgr.state.gameClock.running, 12);
  });

  dom.btnResetShot14Modal.addEventListener('click', () => {
    audio.init();
    timer.resetShotClock(stateMgr.state.gameClock.running, 14);
  });

  dom.btnResetClock10m.addEventListener('click', () => {
    if (confirm('Reset waktu ke 10:00?')) {
      timer.resetGameClock();
    }
  });

  dom.btnPlus1mModal.addEventListener('click', () => timer.adjustGameClock(60));
  dom.btnMinus1mModal.addEventListener('click', () => timer.adjustGameClock(-60));
  dom.btnPlus1sModal.addEventListener('click', () => timer.adjustGameClock(1));
  dom.btnMinus1sModal.addEventListener('click', () => timer.adjustGameClock(-1));

  dom.btnStartOvertimeModal.addEventListener('click', () => {
    dom.timerModal.classList.remove('active');
    stateMgr.startOvertime();
  });

  dom.btnToggleShotBlankModal.addEventListener('click', () => {
    timer.toggleShotClockEnabled();
    const isNowActive = stateMgr.state.shotClock.enabled !== false && stateMgr.state.shotClock.visible !== false;
    showToast(isNowActive ? 'Shot Clock Diaktifkan' : 'Shot Clock Dinonaktifkan');
  });

  // Winner Modal buttons
  dom.btnWinnerOvertime.addEventListener('click', () => {
    dom.winnerModal.classList.remove('active');
    stateMgr.startOvertime();
  });

  dom.btnWinnerReset.addEventListener('click', () => {
    dom.winnerModal.classList.remove('active');
    stateMgr.resetMatch();
  });

  // ================= MATCH HISTORY LISTENERS =================

  // Open History Modal (📋)
  if (dom.btnHistory) {
    dom.btnHistory.addEventListener('click', () => {
      dom.historyModal.classList.add('active');
      renderTimelineLogs(stateMgr.state.logs);
      renderSavedMatchesArchive();
    });
  }

  // History Tabs Switching
  if (dom.tabBtnTimeline && dom.tabBtnArchive) {
    dom.tabBtnTimeline.addEventListener('click', () => {
      dom.tabBtnTimeline.classList.add('active');
      dom.tabBtnArchive.classList.remove('active');
      dom.paneTimeline.classList.add('active');
      dom.paneArchive.classList.remove('active');
      renderTimelineLogs(stateMgr.state.logs);
    });

    dom.tabBtnArchive.addEventListener('click', () => {
      dom.tabBtnArchive.classList.add('active');
      dom.tabBtnTimeline.classList.remove('active');
      dom.paneArchive.classList.add('active');
      dom.paneTimeline.classList.remove('active');
      renderSavedMatchesArchive();
    });
  }

  // Save current match manually to archive
  if (dom.btnSaveCurrentMatchManual) {
    dom.btnSaveCurrentMatchManual.addEventListener('click', () => {
      const saved = stateMgr.saveMatchToArchive('Disimpan Manual');
      if (saved) {
        showToast('Hasil pertandingan berhasil disimpan ke arsip!');
        renderSavedMatchesArchive();
      }
    });
  }

  // Clear live timeline logs
  if (dom.btnClearLiveTimeline) {
    dom.btnClearLiveTimeline.addEventListener('click', () => {
      if (confirm('Bersihkan catatan riwayat pertandingan yang sedang berjalan?')) {
        stateMgr.state.logs = [];
        renderTimelineLogs(stateMgr.state.logs);
        stateMgr.broadcast();
        showToast('Catatan live timeline dibersihkan.');
      }
    });
  }

  // Export all archive to clipboard
  if (dom.btnExportAllArchive) {
    dom.btnExportAllArchive.addEventListener('click', () => {
      const matches = stateMgr.getSavedMatches();
      if (!matches || matches.length === 0) {
        alert('Belum ada arsip pertandingan untuk disalin.');
        return;
      }
      const fullReport = matches.map(m => stateMgr.formatMatchSummaryText(m)).join('\n\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullReport).then(() => {
          showToast('Semua rekap pertandingan disalin ke clipboard!');
        }).catch(() => {
          prompt('Salin semua rekap berikut:', fullReport);
        });
      } else {
        prompt('Salin semua rekap berikut:', fullReport);
      }
    });
  }

  // Clear all archive
  if (dom.btnClearAllArchive) {
    dom.btnClearAllArchive.addEventListener('click', () => {
      if (confirm('Yakin ingin menghapus seluruh arsip pertandingan yang telah selesai?')) {
        stateMgr.clearAllSavedMatches();
        renderSavedMatchesArchive();
        showToast('Seluruh arsip pertandingan dihapus.');
      }
    });
  }

  // ================= KEYBOARD SHORTCUTS =================

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    audio.init();

    switch (e.code) {
      // Space: Start/Pause Game & Shot Clock
      case 'Space':
        e.preventDefault();
        timer.toggleMasterClock();
        break;

      // Shot Clock Resets ("Shoot Lock")
      case 'KeyF':
      case 'KeyS':
        e.preventDefault();
        timer.resetShotClock(stateMgr.state.gameClock.running, 12);
        break;

      case 'KeyD':
        e.preventDefault();
        timer.resetShotClock(stateMgr.state.gameClock.running, 14);
        break;

      // Toggle Shot Clock Enabled / Disabled ("Shoot Lock")
      case 'KeyC':
        e.preventDefault();
        timer.toggleShotClockEnabled();
        const isNowActive = stateMgr.state.shotClock.enabled !== false && stateMgr.state.shotClock.visible !== false;
        showToast(isNowActive ? 'Shot Clock Diaktifkan' : 'Shot Clock Dinonaktifkan');
        break;

      // Team 1 Controls
      case 'Digit1':
      case 'Numpad1':
        e.preventDefault();
        stateMgr.addPoints('teamA', 1);
        break;

      case 'Digit2':
      case 'Numpad2':
        e.preventDefault();
        stateMgr.addPoints('teamA', 2);
        break;

      case 'KeyQ':
        e.preventDefault();
        stateMgr.subtractPoints('teamA', 1);
        break;

      case 'KeyW':
        e.preventDefault();
        stateMgr.addFoul('teamA');
        break;

      // Team 2 Controls
      case 'Digit8':
      case 'Numpad8':
        e.preventDefault();
        stateMgr.addPoints('teamB', 1);
        break;

      case 'Digit9':
      case 'Numpad9':
        e.preventDefault();
        stateMgr.addPoints('teamB', 2);
        break;

      case 'KeyI':
        e.preventDefault();
        stateMgr.subtractPoints('teamB', 1);
        break;

      case 'KeyO':
        e.preventDefault();
        stateMgr.addFoul('teamB');
        break;

      // Horn & Whistle
      case 'KeyH':
      case 'KeyB':
        e.preventDefault();
        audio.playHorn(1.2);
        stateMgr.broadcast('horn');
        break;

      case 'KeyJ':
        e.preventDefault();
        audio.playWhistle();
        stateMgr.broadcast('whistle');
        break;

      // Undo
      case 'KeyZ':
        if (e.ctrlKey || e.metaKey || !e.shiftKey) {
          e.preventDefault();
          stateMgr.undo();
        }
        break;

      // Close modals
      case 'Escape':
        document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
        break;

      default:
        break;
    }
  });

  // Subscribe to state updates
  stateMgr.subscribe((state) => {
    render(state);
  });

  // Set initial default names if not customized yet
  if (!stateMgr.state.teamA.name || stateMgr.state.teamA.name === 'TIM A') {
    stateMgr.state.teamA.name = 'TEAM1';
  }
  if (!stateMgr.state.teamB.name || stateMgr.state.teamB.name === 'TIM B') {
    stateMgr.state.teamB.name = 'TEAM2';
  }

  // Initial render
  render(stateMgr.state);
});
