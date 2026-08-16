// Quotewave — analysis.js
// Market Engine report, signal panel, strategy agreement, and the
// core stat panels (rise/fall, parity, threshold, match/differ, frequency).

  // ---------- Market engine report ----------
  function computeMarketEngine(){
    const total = digitHistory.length;
    if(total < 10){
      engineBias.textContent = 'Gathering data…';
      engineAsOf.textContent = `${total} tick${total === 1 ? '' : 's'} so far`;
      pulseDot.className = 'pulse-dot' + (connMark.className.includes('live') ? ' live' : '');
      return;
    }
    pulseDot.className = 'pulse-dot live';

    const evenCount = digitHistory.filter(d => d.digit % 2 === 0).length;
    const parityScore = Math.round((evenCount / total) * 100) - 50; // + = even-leaning

    const overCount = digitHistory.filter(d => d.digit > threshold).length;
    const threshScore = Math.round((overCount / total) * 100) - 50; // + = over-leaning

    const moveTotal = riseCount + fallCount;
    const momScore = moveTotal ? Math.round(((riseCount - fallCount) / moveTotal) * 100) : 0; // + = rise-leaning

    let chopScore = 0;
    if(directionHistory.length >= 6){
      const recent = directionHistory.slice(-30);
      let flips = 0;
      for(let i = 1; i < recent.length; i++){ if(recent[i] !== recent[i - 1]) flips++; }
      chopScore = Math.round((flips / (recent.length - 1)) * 100);
    }

    const setMeter = (fillEl, valEl, score, labelPos, labelNeg) => {
      const clamped = Math.max(-50, Math.min(50, score));
      fillEl.style.width = Math.abs(clamped) + '%';
      fillEl.style.left = clamped >= 0 ? '50%' : (50 + clamped) + '%';
      valEl.textContent = score === 0 ? 'even' : `${Math.abs(score)}% ${score > 0 ? labelPos : labelNeg}`;
    };
    setMeter(meterParityFill, meterParityVal, parityScore, 'even', 'odd');
    setMeter(meterThreshFill, meterThreshVal, threshScore, 'over', 'under');
    setMeter(meterMomFill, meterMomVal, momScore, 'rise', 'fall');
    meterChopFill.style.width = chopScore + '%';
    meterChopVal.textContent = chopScore + '%';

    // headline bias
    const mag = [
      { label: 'parity', score: Math.abs(parityScore), dir: parityScore >= 0 ? 'even' : 'odd' },
      { label: 'threshold', score: Math.abs(threshScore), dir: threshScore >= 0 ? 'over' : 'under' },
      { label: 'momentum', score: Math.abs(momScore), dir: momScore >= 0 ? 'rise' : 'fall' },
    ].sort((a, b) => b.score - a.score);
    const lead = mag[0];
    const strength = lead.score >= 15 ? 'Strong' : lead.score >= 7 ? 'Moderate' : 'Slight';
    const chopWord = chopScore >= 70 ? 'choppy' : chopScore <= 30 ? 'trending' : 'mixed';
    engineBias.textContent = lead.score < 4
      ? `Balanced session · ${chopWord}`
      : `${strength} lean toward ${lead.dir} · ${chopWord}`;

    engineAsOf.textContent = `${total} ticks analyzed`;

    // narrative
    const parts = [];
    parts.push(`Over the last ${total} ticks on ${symbolSelect.value}, digits have leaned ${Math.abs(parityScore)}% toward ${parityScore >= 0 ? 'even' : 'odd'}${Math.abs(parityScore) < 4 ? ' (essentially balanced)' : ''}.`);
    parts.push(`Against a threshold of ${threshold}, the split favors ${threshScore >= 0 ? 'over' : 'under'} by ${Math.abs(threshScore)}%.`);
    if(moveTotal > 5){
      parts.push(`Price direction has favored ${momScore >= 0 ? 'rises' : 'falls'} by ${Math.abs(momScore)}%, with the current streak at ${currentStreakLen || 0} ${currentStreakDir === 'up' ? 'rises' : currentStreakDir === 'down' ? 'falls' : 'ticks'} in a row.`);
    }
    parts.push(`Direction reversals are running ${chopWord} (${chopScore}% of recent moves flipped).`);
    engineReport.textContent = parts.join(' ');
  }

  // ---------- Signal panel + strategy agreement ----------
  function computeSignalAndStrategy(){
    const total = digitHistory.length;
    if(total < 10){
      signalStatus.textContent = 'Gathering';
      signalStatus.className = 'badge';
      signalDigit.textContent = '—';
      signalConfidence.textContent = '—';
      signalAgreement.textContent = '—';
      signalCondition.textContent = '—';
      agreementMeta.textContent = '0 / 4';
      strategyBody.innerHTML = '<tr><td colspan="3" class="empty-cell">Connect to populate.</td></tr>';
      return;
    }

    const counts = new Array(10).fill(0);
    digitHistory.forEach(d => counts[d.digit]++);
    const hotDigit = counts.indexOf(Math.max(...counts));
    const hotPct = Math.round((counts[hotDigit] / total) * 100);

    const matchCount = digitHistory.filter(d => d.digit === targetDigit).length;
    const matchPctVal = Math.round((matchCount / total) * 100);
    const overCount = digitHistory.filter(d => d.digit > threshold).length;
    const overPctVal = Math.round((overCount / total) * 100);
    const evenCount = digitHistory.filter(d => d.digit % 2 === 0).length;
    const evenPctVal = Math.round((evenCount / total) * 100);
    const moveTotal = riseCount + fallCount;
    const risePctVal = moveTotal ? Math.round((riseCount / moveTotal) * 100) : 50;

    const rows = [
      { metric: 'Match / Differ', a: 'Match', b: 'Differ', pct: matchPctVal },
      { metric: 'Over / Under', a: 'Over', b: 'Under', pct: overPctVal },
      { metric: 'Even / Odd', a: 'Even', b: 'Odd', pct: evenPctVal },
      { metric: 'Rise / Fall', a: 'Rise', b: 'Fall', pct: risePctVal },
    ];

    let aCount = 0;
    strategyBody.innerHTML = rows.map(r => {
      const isA = r.pct >= 50;
      if(isA) aCount++;
      const read = isA ? r.a : r.b;
      const pctShown = isA ? r.pct : (100 - r.pct);
      return `<tr>
        <td>${r.metric}</td>
        <td><span class="read-pill ${isA ? 'a' : 'b'}">${read}</span></td>
        <td>${pctShown}%</td>
      </tr>`;
    }).join('');

    const agreementCount = Math.max(aCount, rows.length - aCount);
    agreementMeta.textContent = `${agreementCount} / ${rows.length}`;

    let chopScore = 0;
    if(directionHistory.length >= 6){
      const recent = directionHistory.slice(-30);
      let flips = 0;
      for(let i = 1; i < recent.length; i++){ if(recent[i] !== recent[i - 1]) flips++; }
      chopScore = Math.round((flips / (recent.length - 1)) * 100);
    }
    const condition = chopScore >= 70 ? 'Choppy' : chopScore <= 30 ? 'Trending' : 'Mixed';

    signalStatus.textContent = 'Active';
    signalStatus.className = 'badge on';
    signalDigit.textContent = hotDigit;
    const confidence = Math.min(99, Math.round((hotPct / 10 * 50) + (agreementCount / rows.length * 50)));
    signalConfidence.textContent = confidence + '%';
    signalAgreement.textContent = `${agreementCount} of ${rows.length} metrics align`;
    signalCondition.textContent = condition;
  }

  // ---------- Rendering ----------
  thresholdSlider.addEventListener('input', () => {
    threshold = parseInt(thresholdSlider.value, 10);
    thresholdLabel.textContent = threshold;
    renderAll();
  });
  targetDigitSel.addEventListener('change', () => {
    targetDigit = parseInt(targetDigitSel.value, 10);
    renderAll();
  });


  function renderAll(){
    renderRiseFall();
    renderParity();
    renderThreshold();
    renderMatchDiffer();
    renderFrequency();
    computeMarketEngine();
    computeSignalAndStrategy();
    renderStatistics();
  }

  // ---------- Consolidated statistics panel ----------
  function renderStatistics(){
    const total = digitHistory.length;
    if(total === 0){
      statsBody.innerHTML = '<tr><td colspan="2" class="empty-cell">Connect to populate.</td></tr>';
      statsSessionMeta.textContent = '0 ticks';
      return;
    }
    statsSessionMeta.textContent = `${total} ticks · ${symbolSelect.value}`;

    const counts = new Array(10).fill(0);
    digitHistory.forEach(d => counts[d.digit]++);
    const hotD = counts.indexOf(Math.max(...counts));
    const coldD = counts.indexOf(Math.min(...counts));
    const evenCount = digitHistory.filter(d => d.digit % 2 === 0).length;
    const overCount = digitHistory.filter(d => d.digit > threshold).length;
    const matchCount = digitHistory.filter(d => d.digit === targetDigit).length;
    const moveTotal = riseCount + fallCount;
    const pctOf = (n) => Math.round((n / total) * 100);

    const rows = [
      ['Ticks this session', total],
      ['Hottest digit', `${hotD} (${pctOf(counts[hotD])}%)`],
      ['Coldest digit', `${coldD} (${pctOf(counts[coldD])}%)`],
      ['Even / Odd split', `${pctOf(evenCount)}% / ${100 - pctOf(evenCount)}%`],
      [`Over / Under ${threshold}`, `${pctOf(overCount)}% / ${100 - pctOf(overCount)}%`],
      [`Match / Differ (${targetDigit})`, `${pctOf(matchCount)}% / ${100 - pctOf(matchCount)}%`],
      ['Rise / Fall', moveTotal ? `${Math.round(riseCount/moveTotal*100)}% / ${Math.round(fallCount/moveTotal*100)}%` : '—'],
      ['Longest rise streak', longestRise],
      ['Longest fall streak', longestFall],
      ['Current streak', currentStreakDir ? `${currentStreakLen} × ${currentStreakDir === 'up' ? 'rise' : 'fall'}` : '—'],
    ];

    statsBody.innerHTML = rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  }

  function renderRiseFall(){
    riseCountEl.textContent = riseCount;
    fallCountEl.textContent = fallCount;
    riseFallTotal.textContent = (riseCount + fallCount) + ' moves';
    currentStreakEl.textContent = currentStreakDir ? `${currentStreakLen} × ${currentStreakDir === 'up' ? 'rise' : 'fall'}` : '—';
    longestRiseEl.textContent = longestRise;
    longestFallEl.textContent = longestFall;

    streakTrack.innerHTML = '';
    directionHistory.slice(-30).forEach(d => {
      const dot = document.createElement('div');
      dot.className = 'streak-dot ' + d;
      streakTrack.appendChild(dot);
    });
  }

  function renderParity(){
    if(digitHistory.length === 0){ evenPct.textContent = '—'; oddPct.textContent = '—'; return; }
    const even = digitHistory.filter(d => d.digit % 2 === 0).length;
    const pct = Math.round((even / digitHistory.length) * 100);
    evenPct.textContent = pct + '%';
    oddPct.textContent = (100 - pct) + '%';
  }

  function renderThreshold(){
    if(digitHistory.length === 0){ overPct.textContent = '—'; underPct.textContent = '—'; return; }
    const over = digitHistory.filter(d => d.digit > threshold).length;
    const pct = Math.round((over / digitHistory.length) * 100);
    overPct.textContent = pct + '%';
    underPct.textContent = (100 - pct) + '%';
  }

  function renderMatchDiffer(){
    if(digitHistory.length === 0){ matchPct.textContent = '—'; differPct.textContent = '—'; return; }
    const match = digitHistory.filter(d => d.digit === targetDigit).length;
    const pct = Math.round((match / digitHistory.length) * 100);
    matchPct.textContent = pct + '%';
    differPct.textContent = (100 - pct) + '%';
  }

  function renderFrequency(){
    const counts = new Array(10).fill(0);
    digitHistory.forEach(d => counts[d.digit]++);
    const total = digitHistory.length || 1;
    const max = Math.max(...counts, 1);
    for(let d=0; d<10; d++){
      const pct = Math.round((counts[d] / total) * 100);
      const bar = $('freqBar' + d);
      const lbl = $('freqPct' + d);
      bar.style.width = (counts[d] / max * 100) + '%';
      bar.className = 'bar-fill' + (counts[d] === max && total > 5 ? ' hot' : '');
      lbl.textContent = pct + '%';
    }
  }
