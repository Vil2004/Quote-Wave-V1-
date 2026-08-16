// Quotewave — state.js
// All mutable session state and cached DOM element references.
// Loaded after utils.js and config.js, before every other module.

  let ws = null;
  let authorized = false;
  let lastPrice = null;
  let pipSize = 2;
  let digitHistory = []; // {digit, price, epoch}
  let directionHistory = []; // 'up' | 'down'
  let currentStreakDir = null;
  let currentStreakLen = 0;
  let longestRise = 0, longestFall = 0;
  let riseCount = 0, fallCount = 0;
  let threshold = 5;
  let targetDigit = 4;
  let alertsLog = [];
  let lastAlertVal = {};
  // data quality tracking
  let lastTickAt = null;
  let tickIntervals = [];
  let delayedTickCount = 0;
  let sessionTickCount = 0;
  let lastLatency = null;
  let watchlistOn = false;
  let watchlistSockets = [];
  let watchlistState = {};

  const connMark = $('connMark');
  const statusLine = $('statusLine');
  const connectBtn = $('connectBtn');
  const disconnectBtn = $('disconnectBtn');
  const symbolSelect = $('symbolSelect');
  const symbolLabel = $('symbolLabel');
  const priceSymbolSub = $('priceSymbolSub');
  const priceValue = $('priceValue');
  const priceDir = $('priceDir');
  const digitTape = $('digitTape');
  const tickCountMeta = $('tickCountMeta');
  const tickChart = $('tickChart');
  const chartMeta = $('chartMeta');
  const alertsList = $('alertsList');
  const alertCounts = $('alertCounts');
  const statsBody = $('statsBody');
  const statsSessionMeta = $('statsSessionMeta');
  const tickGrid = $('tickGrid');
  const enginePanel = $('enginePanel');
  const engineBias = $('engineBias');
  const engineAsOf = $('engineAsOf');
  const pulseDot = $('pulseDot');
  const engineReport = $('engineReport');
  const meterParityVal = $('meterParityVal');
  const meterParityFill = $('meterParityFill');
  const meterThreshVal = $('meterThreshVal');
  const meterThreshFill = $('meterThreshFill');
  const meterMomVal = $('meterMomVal');
  const meterMomFill = $('meterMomFill');
  const meterChopVal = $('meterChopVal');
  const meterChopFill = $('meterChopFill');

  const signalStatus = $('signalStatus');
  const signalDigit = $('signalDigit');
  const signalConfidence = $('signalConfidence');
  const signalAgreement = $('signalAgreement');
  const signalCondition = $('signalCondition');
  const agreementMeta = $('agreementMeta');
  const strategyBody = $('strategyBody');

  const dqBadge = $('dqBadge');
  const dqLatency = $('dqLatency');
  const dqInterval = $('dqInterval');
  const dqDelayed = $('dqDelayed');
  const dqTotal = $('dqTotal');

  const watchlistToggle = $('watchlistToggle');
  const watchlistNote = $('watchlistNote');
  const watchlistTable = $('watchlistTable');
  const watchlistBody = $('watchlistBody');

  const riseCountEl = $('riseCount');
  const fallCountEl = $('fallCount');
  const riseFallTotal = $('riseFallTotal');
  const currentStreakEl = $('currentStreak');
  const longestRiseEl = $('longestRise');
  const longestFallEl = $('longestFall');
  const streakTrack = $('streakTrack');

  const evenPct = $('evenPct');
  const oddPct = $('oddPct');
  const overPct = $('overPct');
  const underPct = $('underPct');
  const matchPct = $('matchPct');
  const differPct = $('differPct');
  const thresholdSlider = $('thresholdSlider');
  const thresholdLabel = $('thresholdLabel');
  const targetDigitSel = $('targetDigit');
  const freqBars = $('freqBars');

  const authBadge = $('authBadge');
  const syncBtn = $('syncBtn');
  const tradeTableBody = $('tradeTableBody');
  const tradeEmptyState = $('tradeEmptyState');
  const plCount = $('plCount');
  const plWinRate = $('plWinRate');
  const plNet = $('plNet');
