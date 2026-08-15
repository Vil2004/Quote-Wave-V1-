// Quotewave — charts.js
// The digit tape and the live price line chart.

  function addTapeChip(digit){
    const chip = document.createElement('div');
    chip.className = 'chip ' + (digit % 2 === 0 ? 'even' : 'odd');
    chip.textContent = digit;
    digitTape.appendChild(chip);
    while(digitTape.children.length > TAPE_SHOW){
      digitTape.removeChild(digitTape.firstChild);
    }
  }
  // ---------- Live tick chart ----------
  function drawChart(){
    const dpr = window.devicePixelRatio || 1;
    const rect = tickChart.parentElement.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    if(tickChart.width !== Math.round(w * dpr) || tickChart.height !== Math.round(h * dpr)){
      tickChart.width = Math.round(w * dpr);
      tickChart.height = Math.round(h * dpr);
    }
    const ctx = tickChart.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const prices = digitHistory.slice(-60).map(d => d.price);
    if(prices.length < 2){ chartMeta.textContent = '—'; return; }

    const min = Math.min(...prices), max = Math.max(...prices);
    const pad = (max - min) * 0.15 || Math.pow(10, -pipSize);
    const lo = min - pad, hi = max + pad;
    const stepX = w / (prices.length - 1);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for(let i = 1; i < 4; i++){
      const y = (h / 4) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const pts = prices.map((p, i) => ({ x: i * stepX, y: h - ((p - lo) / (hi - lo)) * h }));

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(212,169,78,0.22)');
    grad.addColorStop(1, 'rgba(212,169,78,0)');
    ctx.beginPath();
    ctx.moveTo(pts[0].x, h);
    pts.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(pts[pts.length - 1].x, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    pts.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
    ctx.strokeStyle = '#D4A94E';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#D4A94E';
    ctx.fill();

    chartMeta.textContent = `range ${lo.toFixed(pipSize)} – ${hi.toFixed(pipSize)}`;
  }
  window.addEventListener('resize', () => { if(digitHistory.length > 1) drawChart(); });
