// Quotewave — settings.js
// Loads/saves user preferences: remembered App ID/token, and
// configurable alert thresholds used by signals.js. Loaded after
// config.js (needs DEFAULT_SETTINGS) and after state.js (needs DOM refs).

  function loadSettings(){
    try{
      const raw = localStorage.getItem(SETTINGS_KEY);
      if(!raw) return { ...DEFAULT_SETTINGS, alertThresholds: { ...DEFAULT_ALERT_THRESHOLDS } };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        alertThresholds: { ...DEFAULT_ALERT_THRESHOLDS, ...(parsed.alertThresholds || {}) },
      };
    }catch(e){
      return { ...DEFAULT_SETTINGS, alertThresholds: { ...DEFAULT_ALERT_THRESHOLDS } };
    }
  }

  function saveSettings(next){
    currentSettings = next;
    alertThresholds = next.alertThresholds;
    try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); }catch(e){ /* ignore */ }
  }

  let currentSettings = loadSettings();
  let alertThresholds = currentSettings.alertThresholds;

  // Apply remembered credentials to the connect form on load.
  if(currentSettings.rememberCredentials){
    if(currentSettings.appId) $('appIdInput').value = currentSettings.appId;
    if(currentSettings.token) $('tokenInput').value = currentSettings.token;
  }
  $('rememberCredentials').checked = currentSettings.rememberCredentials;

  function persistCredentialsIfEnabled(){
    if(!$('rememberCredentials').checked){
      // remembering turned off — clear anything previously stored
      saveSettings({ ...currentSettings, appId: '', token: '', rememberCredentials: false });
      return;
    }
    saveSettings({
      ...currentSettings,
      appId: $('appIdInput').value.trim(),
      token: $('tokenInput').value.trim(),
      rememberCredentials: true,
    });
  }

  // ---------- Settings panel wiring ----------
  function fillThresholdInputs(){
    $('setParityPct').value = alertThresholds.parityPct;
    $('setThresholdPct').value = alertThresholds.thresholdPct;
    $('setHotDigitPct').value = alertThresholds.hotDigitPct;
    $('setColdDigitPct').value = alertThresholds.coldDigitPct;
    $('setStreakWatch').value = alertThresholds.streakWatch;
    $('setStreakCritical').value = alertThresholds.streakCritical;
    $('setChopPct').value = alertThresholds.chopPct;
  }
  fillThresholdInputs();

  $('saveSettingsBtn').addEventListener('click', () => {
    const next = {
      ...currentSettings,
      alertThresholds: {
        parityPct: clampPct($('setParityPct').value, DEFAULT_ALERT_THRESHOLDS.parityPct),
        thresholdPct: clampPct($('setThresholdPct').value, DEFAULT_ALERT_THRESHOLDS.thresholdPct),
        hotDigitPct: clampPct($('setHotDigitPct').value, DEFAULT_ALERT_THRESHOLDS.hotDigitPct),
        coldDigitPct: clampPct($('setColdDigitPct').value, DEFAULT_ALERT_THRESHOLDS.coldDigitPct),
        streakWatch: clampInt($('setStreakWatch').value, DEFAULT_ALERT_THRESHOLDS.streakWatch),
        streakCritical: clampInt($('setStreakCritical').value, DEFAULT_ALERT_THRESHOLDS.streakCritical),
        chopPct: clampPct($('setChopPct').value, DEFAULT_ALERT_THRESHOLDS.chopPct),
      },
    };
    saveSettings(next);
    $('settingsStatus').textContent = 'Saved.';
    setTimeout(() => { $('settingsStatus').textContent = ''; }, 2000);
  });

  $('resetSettingsBtn').addEventListener('click', () => {
    alertThresholds = { ...DEFAULT_ALERT_THRESHOLDS };
    fillThresholdInputs();
    saveSettings({ ...currentSettings, alertThresholds: { ...DEFAULT_ALERT_THRESHOLDS } });
    $('settingsStatus').textContent = 'Reset to defaults.';
    setTimeout(() => { $('settingsStatus').textContent = ''; }, 2000);
  });

  function clampPct(v, fallback){
    const n = parseInt(v, 10);
    if(isNaN(n)) return fallback;
    return Math.max(0, Math.min(100, n));
  }
  function clampInt(v, fallback){
    const n = parseInt(v, 10);
    if(isNaN(n) || n < 1) return fallback;
    return n;
        }
