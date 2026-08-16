// Quotewave — history.js
// Tick history grid, data quality monitor, and the trade log.

  // ---------- Tick history grid ----------
  function addTickGridCell(priceStr, digit){
    if(tickGrid.querySelector('.empty-state')) tickGrid.innerHTML = '';
    const cell = document.createElement('div');
    cell.className = 'tick-cell';
    cell.innerHTML = `<div class="p">${priceStr}</div><div class="d ${digit % 2 === 0 ? 'even' : 'odd'}">${digit}</div>`;
    tickGrid.prepend(cell);
    while(tickGrid.children.length > 20){
      tickGrid.removeChild(tickGrid.lastChild);
    }
  }

  // ---------- Data quality monitor ----------
  function renderDataQuality(){
    dqTotal.textContent = sessionTickCount;
    dqDelayed.textContent = delayedTickCount;
    dqLatency.textContent = lastLatency !== null ? `~${lastLatency} ms` : '—';

    if(tickIntervals.length >= 2){
      const avg = Math.round(tickIntervals.reduce((a, b) => a + b, 0) / tickIntervals.length);
      dqInterval.textContent = avg + ' ms';
    } else {
      dqInterval.textContent = '—';
    }

    if(sessionTickCount === 0){
      dqBadge.textContent = 'Idle';
      dqBadge.className = 'badge';
    } else if(delayedTickCount > sessionTickCount * 0.15){
      dqBadge.textContent = 'Fair';
      dqBadge.className = 'badge';
    } else {
      dqBadge.textContent = 'Good';
      dqBadge.className = 'badge on';
    }
  }

  // ---------- Trade log ----------
  function loadTrades(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }
  function saveTrades(trades){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(trades)); }catch(e){}
  }

  let trades = loadTrades();

  $('addTradeBtn').addEventListener('click', () => {
    const type = $('tradeType').value;
    const symbol = $('tradeSymbol').value.trim() || symbolSelect.value;
    const stake = parseFloat($('tradeStake').value) || 0;
    const payout = parseFloat($('tradePayout').value) || 0;
    const result = $('tradeResult').value;
    const pl = result === 'win' ? (payout - stake) : -stake;

    trades.unshift({
      time: new Date().toISOString(),
      type, symbol, stake, payout, result, pl, source: 'manual'
    });
    saveTrades(trades);
    renderTrades();

    $('tradeStake').value = '';
    $('tradePayout').value = '';
  });

  function renderTrades(){
    tradeTableBody.innerHTML = '';
    tradeEmptyState.style.display = trades.length ? 'none' : 'block';

    let net = 0, wins = 0;
    trades.forEach((t, i) => {
      net += t.pl;
      if(t.result === 'win') wins++;

      const tr = document.createElement('tr');
      const time = new Date(t.time);
      const timeStr = isNaN(time) ? t.time : time.toLocaleString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
      tr.innerHTML = `
        <td>${timeStr}</td>
        <td>${t.type}</td>
        <td>${t.symbol}</td>
        <td>${t.stake.toFixed(2)}</td>
        <td class="${t.result === 'win' ? 'win' : 'loss'}">${t.result}</td>
        <td class="${t.pl >= 0 ? 'win' : 'loss'}">${t.pl >= 0 ? '+' : ''}${t.pl.toFixed(2)}</td>
        <td><button class="ghost" data-idx="${i}" style="padding:3px 8px; font-size:11px;">Remove</button></td>
      `;
      tradeTableBody.appendChild(tr);
    });

    tradeTableBody.querySelectorAll('button[data-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        trades.splice(parseInt(btn.dataset.idx, 10), 1);
        saveTrades(trades);
        renderTrades();
      });
    });

    plCount.textContent = trades.length;
    plWinRate.textContent = trades.length ? Math.round((wins / trades.length) * 100) + '%' : '—';
    plNet.textContent = (net >= 0 ? '+' : '') + net.toFixed(2);
    plNet.className = net >= 0 ? 'pos' : 'neg';
  }

  syncBtn.addEventListener('click', () => {
    if(!ws || !authorized) return;
    syncBtn.textContent = 'Syncing…';
    ws.send(JSON.stringify({ profit_table: 1, description: 1, limit: 50, sort: 'DESC' }));
  });

  function handleProfitTable(profitTable){
    syncBtn.textContent = 'Sync from Deriv';
    const transactions = profitTable.transactions || [];
    let added = 0;
    transactions.forEach(t => {
      const exists = trades.some(existing => existing.source === 'deriv' && existing.contract_id === t.contract_id);
      if(exists) return;
      const pl = parseFloat(t.sell_price) - parseFloat(t.buy_price);
      trades.unshift({
        time: new Date(t.purchase_time * 1000).toISOString(),
        type: t.shortcode ? t.shortcode.split('_')[0] : 'Contract',
        symbol: t.symbol || '',
        stake: parseFloat(t.buy_price),
        payout: parseFloat(t.sell_price),
        result: pl >= 0 ? 'win' : 'loss',
        pl,
        source: 'deriv',
        contract_id: t.contract_id
      });
      added++;
    });
    saveTrades(trades);
    renderTrades();
    statusLine.textContent = added ? `Synced ${added} trade(s) from your Deriv history.` : 'No new trades to sync.';
                                                                      }
