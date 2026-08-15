// Quotewave — app.js
// Entry point. Builds the frequency bar rows, wires the remaining
// top-level UI listeners, and kicks off the first render.
// Loaded LAST — every other module must already be defined.

  // ---------- Init frequency bars ----------
  for(let d=0; d<10; d++){
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `<div class="bar-label">${d}</div><div class="bar-track"><div class="bar-fill" id="freqBar${d}" style="width:0%"></div></div><div class="bar-pct" id="freqPct${d}">0%</div>`;
    freqBars.appendChild(row);
  }

  // ---------- Connection ----------
  connectBtn.addEventListener('click', connect);
  disconnectBtn.addEventListener('click', disconnect);
  symbolSelect.addEventListener('change', () => {
    symbolLabel.textContent = symbolSelect.options[symbolSelect.selectedIndex].text;
    if(ws && ws.readyState === WebSocket.OPEN){
      resetStats();
      subscribeTicks();
    }
  });

  watchlistToggle.addEventListener('click', () => {
    watchlistOn = !watchlistOn;
    if(watchlistOn){
      watchlistToggle.textContent = 'Disable watchlist';
      watchlistNote.style.display = 'none';
      watchlistTable.style.display = 'table';
      startWatchlist();
    } else {
      watchlistToggle.textContent = 'Enable watchlist';
      watchlistNote.style.display = 'block';
      watchlistTable.style.display = 'none';
      stopWatchlist();
    }
  });

  // ---------- Initial render ----------
  renderAll();
  renderDataQuality();
  renderTrades();
