// Quotewave — config.js
// App-wide constants: history limits, storage key, watchlist symbol set.

  const MAX_HISTORY = 200;
  const TAPE_SHOW = 40;
  const STORAGE_KEY = 'quotewave_trade_log_v1';
  const SETTINGS_KEY = 'quotewave_settings_v1';
  const WATCHLIST_SYMBOLS = [
    { label: 'Volatility 10', value: 'R_10' },
    { label: 'Volatility 25', value: 'R_25' },
    { label: 'Volatility 50', value: 'R_50' },
    { label: 'Volatility 75', value: 'R_75' },
    { label: 'Volatility 100', value: 'R_100' },
  ];
  const DEFAULT_ALERT_THRESHOLDS = {
    parityPct: 55,      // even/odd imbalance that triggers an alert
    thresholdPct: 55,   // over/under imbalance that triggers an alert
    hotDigitPct: 13,     // digit frequency considered "hot"
    coldDigitPct: 7,      // digit frequency considered "cold"
    streakWatch: 5,      // rise/fall streak length -> watch alert
    streakCritical: 7,   // rise/fall streak length -> critical alert
    chopPct: 80,         // direction-reversal rate considered choppy
  };
  const DEFAULT_SETTINGS = {
    appId: '1089',
    token: '',
    rememberCredentials: false,
    alertThresholds: { ...DEFAULT_ALERT_THRESHOLDS },
  };
