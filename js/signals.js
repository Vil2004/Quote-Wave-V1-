// Quotewave — signals.js
// Severity-tiered alert engine, driven by live digit/direction history.

  // ---------- Alerts engine ----------
  function pushAlert(id, text, level, severity){
    if(lastAlertVal[id] === text) return;
    lastAlertVal[id] = text;
    alertsLog.unshift({ text, level, severity: severity || 'watch', time: new Date() });
    if(alertsLog.length > 10) alertsLog.pop();
    renderAlerts();
  }

  function renderAlerts(){
    const crit = alertsLog.filter(a => a.severity === 'critical').length;
    const watch = alertsLog.filter(a => a.severity === 'watch').length;
    alertCounts.innerHTML = alertsLog.length
      ? (crit ? `<span class="acount crit">${crit} critical</span>` : '') + (watch ? `<span class="acount watch">${watch} watch</span>` : '')
      : '';

    if(alertsLog.length === 0) return;
    const iconFor = (lvl) => lvl === 'up' ? '▲' : lvl === 'down' ? '▼' : lvl === 'info' ? 'i' : '●';
    alertsList.innerHTML = alertsLog.map(a => `
      <div class="alert-item sev-${a.severity}">
        <div class="alert-icon ${a.level}">${iconFor(a.level)}</div>
        <div class="alert-text">${a.text}</div>
        <div class="alert-time">${a.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    `).join('');
  }

  function checkAlerts(){
    const total = digitHistory.length;
    if(total < 15) return;

    const evenCount = digitHistory.filter(d => d.digit % 2 === 0).length;
    const evenPctVal = Math.round((evenCount / total) * 100);
    if(evenPctVal >= alertThresholds.parityPct) pushAlert('parity', `Even percentage is above ${alertThresholds.parityPct}% <span class="cur">Current: ${evenPctVal}%</span>`, 'info', 'watch');
    else if(evenPctVal <= (100 - alertThresholds.parityPct)) pushAlert('parity', `Odd percentage is above ${alertThresholds.parityPct}% <span class="cur">Current: ${100 - evenPctVal}%</span>`, 'note', 'watch');

    const overCount = digitHistory.filter(d => d.digit > threshold).length;
    const overPctVal = Math.round((overCount / total) * 100);
    if(overPctVal >= alertThresholds.thresholdPct) pushAlert('overunder', `Over percentage is above ${alertThresholds.thresholdPct}% <span class="cur">Current: ${overPctVal}%</span>`, 'up', 'watch');
    else if(overPctVal <= (100 - alertThresholds.thresholdPct)) pushAlert('overunder', `Under percentage is above ${alertThresholds.thresholdPct}% <span class="cur">Current: ${100 - overPctVal}%</span>`, 'down', 'watch');

    const counts = new Array(10).fill(0);
    digitHistory.forEach(d => counts[d.digit]++);
    const maxD = counts.indexOf(Math.max(...counts));
    const minD = counts.indexOf(Math.min(...counts));
    const maxPctVal = Math.round((counts[maxD] / total) * 100);
    const minPctVal = Math.round((counts[minD] / total) * 100);
    if(maxPctVal >= alertThresholds.hotDigitPct) pushAlert('hotdigit', `Digit ${maxD} percentage is above ${alertThresholds.hotDigitPct}% <span class="cur">Current: ${maxPctVal}%</span>`, 'note', 'watch');
    if(minPctVal <= alertThresholds.coldDigitPct) pushAlert('colddigit', `Digit ${minD} percentage is below ${alertThresholds.coldDigitPct}% <span class="cur">Current: ${minPctVal}%</span>`, 'down', 'watch');

    if(currentStreakLen >= alertThresholds.streakWatch){
      const sev = currentStreakLen >= alertThresholds.streakCritical ? 'critical' : 'watch';
      pushAlert('streak', `${currentStreakDir === 'up' ? 'Rise' : 'Fall'} streak reached ${currentStreakLen}`, currentStreakDir === 'up' ? 'up' : 'down', sev);
    }

    const moveTotal = riseCount + fallCount;
    if(moveTotal > 20){
      const diffPct = Math.abs(riseCount - fallCount) / moveTotal * 100;
      if(diffPct < 1) pushAlert('balance', `Rise/Fall difference is below 1%`, 'info', 'info');
    }

    // digit repeat run — same digit 3+ times in a row
    const lastThree = digitHistory.slice(-3).map(d => d.digit);
    if(lastThree.length === 3 && lastThree[0] === lastThree[1] && lastThree[1] === lastThree[2]){
      pushAlertOnce('repeat-' + Date.now(), `Digit ${lastThree[0]} repeated 3 times in a row`, 'note', 'critical');
    }

    // consecutive over/under threshold run
    const lastFour = digitHistory.slice(-4);
    if(lastFour.length === 4){
      if(lastFour.every(d => d.digit > threshold)) pushAlertOnce('run-over-' + Date.now(), `4 consecutive digits above threshold ${threshold}`, 'up', 'watch');
      else if(lastFour.every(d => d.digit <= threshold)) pushAlertOnce('run-under-' + Date.now(), `4 consecutive digits at or below threshold ${threshold}`, 'down', 'watch');
    }

    // choppiness / volatility spike
    if(directionHistory.length >= 20){
      const recent = directionHistory.slice(-20);
      let flips = 0;
      for(let i = 1; i < recent.length; i++){ if(recent[i] !== recent[i - 1]) flips++; }
      const chopPct = Math.round((flips / (recent.length - 1)) * 100);
      if(chopPct >= alertThresholds.chopPct) pushAlert('chop', `High choppiness detected <span class="cur">${chopPct}% of recent moves reversed direction</span>`, 'note', 'watch');
    }
  }

  // one-off alerts (unique id each time, but still capped/deduped by very-recent-same-text check)
  function pushAlertOnce(id, text, level, severity){
    const already = alertsLog.slice(0, 3).some(a => a.text === text);
    if(already) return;
    alertsLog.unshift({ text, level, severity: severity || 'watch', time: new Date() });
    if(alertsLog.length > 10) alertsLog.pop();
    renderAlerts();
  }
