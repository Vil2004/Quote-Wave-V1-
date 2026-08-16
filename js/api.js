// Quotewave — api.js
// Deriv WebSocket connection lifecycle: connect, subscribe, tick handling.

  function connect(){
    const appId = ($('appIdInput').value || '1089').trim();
    const token = $('tokenInput').value.trim();
    persistCredentialsIfEnabled();

    connectBtn.disabled = true;
    statusLine.textContent = 'Connecting…';
    connMark.className = 'mark';

    try{
      ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${encodeURIComponent(appId)}`);
    }catch(e){
      statusLine.textContent = 'Could not open a connection — check the App ID.';
      connMark.className = 'mark err';
      connectBtn.disabled = false;
      return;
    }

    ws.onopen = () => {
      connMark.className = 'mark live';
      statusLine.textContent = 'Connected. Subscribing to ticks…';
      connectBtn.style.display = 'none';
      disconnectBtn.style.display = 'inline-block';
      connectBtn.disabled = false;

      if(token){
        ws.send(JSON.stringify({ authorize: token }));
      } else {
        subscribeTicks();
      }
    };

    ws.onmessage = (msg) => {
      let data;
      try{ data = JSON.parse(msg.data); } catch(e){ return; }

      if(data.error){
        statusLine.textContent = 'Error: ' + data.error.message;
        if(data.msg_type === 'authorize'){
          statusLine.textContent += ' — continuing without authorization.';
          subscribeTicks();
        }
        return;
      }

      if(data.msg_type === 'authorize'){
        authorized = true;
        authBadge.textContent = 'Authorized · ' + (data.authorize.loginid || '');
        authBadge.classList.add('on');
        syncBtn.style.display = 'inline-block';
        statusLine.textContent = 'Authorized. Subscribing to ticks…';
        subscribeTicks();
      }

      if(data.msg_type === 'tick'){
        handleTick(data.tick);
      }

      if(data.msg_type === 'profit_table'){
        handleProfitTable(data.profit_table);
      }
    };

    ws.onerror = () => {
      connMark.className = 'mark err';
      statusLine.textContent = 'Connection error. Double-check your App ID and network.';
    };

    ws.onclose = () => {
      connMark.className = 'mark';
      statusLine.textContent = 'Disconnected.';
      connectBtn.style.display = 'inline-block';
      disconnectBtn.style.display = 'none';
      connectBtn.disabled = false;
    };
  }

  function disconnect(){
    if(ws){ ws.close(); }
  }

  function subscribeTicks(){
    resetStats();
    const symbol = symbolSelect.value;
    priceSymbolSub.textContent = symbol;
    ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
    statusLine.textContent = 'Streaming live ticks for ' + symbol + '.';
  }

  function resetStats(){
    digitHistory = [];
    directionHistory = [];
    currentStreakDir = null;
    currentStreakLen = 0;
    longestRise = 0; longestFall = 0;
    riseCount = 0; fallCount = 0;
    lastPrice = null;
    digitTape.innerHTML = '';
    tickGrid.innerHTML = '<div class="empty-state">Ticks will appear here once connected.</div>';
    alertsLog = [];
    lastAlertVal = {};
    alertsList.innerHTML = '<div class="empty-state">No alerts yet — they\'ll appear as patterns emerge in the live data.</div>';
    alertCounts.innerHTML = '';
    chartMeta.textContent = '—';
    const ctx = tickChart.getContext('2d');
    ctx.clearRect(0, 0, tickChart.width, tickChart.height);
    pulseDot.className = 'pulse-dot';
    lastTickAt = null;
    tickIntervals = [];
    delayedTickCount = 0;
    sessionTickCount = 0;
    lastLatency = null;
    renderDataQuality();
    renderAll();
  }

  // ---------- Tick handling ----------
  function handleTick(tick){
    const price = tick.quote;
    pipSize = tick.pip_size !== undefined ? tick.pip_size : pipSize;
    const priceStr = price.toFixed(pipSize);
    const lastDigit = parseInt(priceStr[priceStr.length - 1], 10);

    // data quality tracking
    const now = Date.now();
    if(tick.epoch) lastLatency = Math.max(0, now - tick.epoch * 1000);
    if(lastTickAt !== null){
      const interval = now - lastTickAt;
      tickIntervals.push(interval);
      if(tickIntervals.length > 60) tickIntervals.shift();
      const avgSoFar = tickIntervals.slice(0, -1).reduce((a, b) => a + b, 0) / Math.max(1, tickIntervals.length - 1);
      if(tickIntervals.length > 5 && interval > avgSoFar * 2.5) delayedTickCount++;
    }
    lastTickAt = now;
    sessionTickCount++;
    renderDataQuality();

    // direction
    let dir = null;
    if(lastPrice !== null){
      if(price > lastPrice) dir = 'up';
      else if(price < lastPrice) dir = 'down';
    }

    if(dir){
      directionHistory.push(dir);
      if(directionHistory.length > MAX_HISTORY) directionHistory.shift();
      if(dir === 'up') riseCount++; else fallCount++;

      if(dir === currentStreakDir){
        currentStreakLen++;
      } else {
        currentStreakDir = dir;
        currentStreakLen = 1;
      }
      if(currentStreakDir === 'up') longestRise = Math.max(longestRise, currentStreakLen);
      if(currentStreakDir === 'down') longestFall = Math.max(longestFall, currentStreakLen);
    }

    digitHistory.push({ digit: lastDigit, price, dir });
    if(digitHistory.length > MAX_HISTORY) digitHistory.shift();

    lastPrice = price;

    priceValue.innerHTML = priceStr.slice(0, -1) + `<span class="price-digit-highlight">${priceStr.slice(-1)}</span>`;
    priceValue.className = 'price-value' + (dir === 'up' ? ' up' : dir === 'down' ? ' down' : '');
    priceDir.textContent = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '';
    priceDir.style.color = dir === 'up' ? 'var(--green)' : dir === 'down' ? 'var(--red)' : 'var(--muted)';
    tickCountMeta.textContent = digitHistory.length + ' ticks';

    addTapeChip(lastDigit);
    addTickGridCell(priceStr, lastDigit);
    drawChart();
    renderAll();
    checkAlerts();
  }
