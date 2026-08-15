// Quotewave — watchlist.js
// Optional multi-market comparison view. Off by default; opens its own
// lightweight WebSocket connections only when enabled.

  function trendArrow(t){
    if(t === 'up') return '<span class="trend-up">▲</span>';
    if(t === 'down') return '<span class="trend-down">▼</span>';
    return '<span class="trend-flat">—</span>';
  }

  function renderWatchlist(){
    watchlistBody.innerHTML = WATCHLIST_SYMBOLS.map(sym => {
      const st = watchlistState[sym.value] || {};
      return `<tr>
        <td>${sym.label}</td>
        <td>${st.price !== undefined ? st.price : '—'}</td>
        <td>${st.digit !== undefined ? st.digit : '—'}</td>
        <td>${trendArrow(st.trend)}</td>
      </tr>`;
    }).join('');
  }

  function startWatchlist(){
    watchlistState = {};
    WATCHLIST_SYMBOLS.forEach(sym => {
      const socket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${encodeURIComponent($('appIdInput').value || '1089')}`);
      watchlistSockets.push(socket);
      socket.onopen = () => socket.send(JSON.stringify({ ticks: sym.value, subscribe: 1 }));
      socket.onmessage = (msg) => {
        let data;
        try { data = JSON.parse(msg.data); } catch (e) { return; }
        if(data.msg_type === 'tick' && data.tick){
          const p = data.tick.quote;
          const ps = data.tick.pip_size !== undefined ? data.tick.pip_size : 2;
          const priceStr = p.toFixed(ps);
          const digit = parseInt(priceStr[priceStr.length - 1], 10);
          const prev = watchlistState[sym.value];
          let trend = null;
          if(prev && prev.rawPrice !== undefined){
            if(p > prev.rawPrice) trend = 'up';
            else if(p < prev.rawPrice) trend = 'down';
            else trend = prev.trend;
          }
          watchlistState[sym.value] = { price: priceStr, digit, trend, rawPrice: p };
          renderWatchlist();
        }
      };
    });
  }

  function stopWatchlist(){
    watchlistSockets.forEach(s => { try { s.close(); } catch(e){} });
    watchlistSockets = [];
    watchlistState = {};
  }
