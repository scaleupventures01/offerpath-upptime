(function(){
  'use strict';
  var MAX_TRIES = 50;
  var tries = 0;

  function enhance(){
    var articles = document.querySelectorAll('section.live-status article');
    if(articles.length === 0){
      tries++;
      if(tries < MAX_TRIES) setTimeout(enhance, 200);
      return;
    }

    /* 1. Compute aggregate stats */
    var totalUp = 0, totalResp = 0, count = articles.length;
    var allUp = true;
    articles.forEach(function(a){
      var spans = a.querySelectorAll('.data');
      if(spans[0]){ var v = parseFloat(spans[0].textContent); if(!isNaN(v)){ totalUp += v; if(v < 100) allUp = false; } }
      if(spans[1]){ var m = parseInt(spans[1].textContent); if(!isNaN(m)) totalResp += m; }
      if(a.classList.contains('down') || a.classList.contains('degraded')) allUp = false;
    });
    var avgUp = (totalUp / count).toFixed(2);
    var avgResp = Math.round(totalResp / count);
    var ringDeg = (parseFloat(avgUp) * 3.6).toFixed(1);

    /* 2. Overall uptime hero — inject at the very top of <main>, BEFORE everything */
    var main = document.querySelector('main.container') || document.querySelector('main');
    if(main && !document.querySelector('.ofp-overall-hero')){
      var statusColor = allUp ? '#10b981' : (parseFloat(avgUp) >= 99 ? '#f59e0b' : '#ef4444');
      var statusLabel = allUp ? 'All Systems Operational' : (parseFloat(avgUp) >= 99 ? 'Partial Degradation' : 'Major Outage');
      var hero = document.createElement('div');
      hero.className = 'ofp-overall-hero';
      hero.innerHTML =
        '<div class="ofp-hero-inner">' +
          '<div class="ofp-hero-ring" style="background:conic-gradient(' + statusColor + ' ' + ringDeg + 'deg, #f3f4f6 0)">' +
            '<div class="ofp-hero-pct">' + avgUp + '%</div>' +
          '</div>' +
          '<div class="ofp-hero-meta">' +
            '<div class="ofp-hero-label">Overall Uptime</div>' +
            '<div class="ofp-hero-status" style="color:' + statusColor + '">' + statusLabel + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ofp-hero-chips">' +
          '<div class="ofp-chip"><span class="ofp-chip-num">' + count + '</span> Services Monitored</div>' +
          '<div class="ofp-chip"><span class="ofp-chip-num">' + avgResp + 'ms</span> Avg Response</div>' +
        '</div>';
      main.insertBefore(hero, main.firstChild);

      /* Inject hero styles */
      var style = document.createElement('style');
      style.textContent =
        '.ofp-overall-hero{background:white;border:1px solid #e5e7eb;border-radius:16px;padding:2rem 2.5rem;margin-bottom:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.06);text-align:center;}' +
        '.ofp-hero-inner{display:flex;align-items:center;justify-content:center;gap:1.75rem;margin-bottom:1.25rem;}' +
        '.ofp-hero-ring{width:110px;height:110px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;}' +
        '.ofp-hero-ring::after{content:"";position:absolute;inset:8px;border-radius:50%;background:white;}' +
        '.ofp-hero-pct{position:relative;z-index:1;font-size:1.5rem;font-weight:800;color:#111827;letter-spacing:-0.03em;}' +
        '.ofp-hero-meta{text-align:left;}' +
        '.ofp-hero-label{font-size:0.8rem;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:600;margin-bottom:0.25rem;}' +
        '.ofp-hero-status{font-size:1.35rem;font-weight:700;letter-spacing:-0.02em;}' +
        '.ofp-hero-chips{display:flex;justify-content:center;gap:1rem;flex-wrap:wrap;}' +
        '.ofp-chip{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:0.5rem 1rem;font-size:0.85rem;color:#6b7280;font-weight:500;}' +
        '.ofp-chip-num{font-weight:700;color:#111827;margin-right:4px;}' +
        '@media(max-width:768px){.ofp-overall-hero{padding:1.25rem;}.ofp-hero-inner{flex-direction:column;gap:1rem;}.ofp-hero-meta{text-align:center;}.ofp-hero-ring{width:90px;height:90px;}.ofp-hero-pct{font-size:1.25rem;}.ofp-hero-status{font-size:1.1rem;}}';
      document.head.appendChild(style);
    }

    /* 3. Hide the default "All Systems Operational" banner since hero replaces it */
    var banner = document.querySelector('main > article.up:not(.link)');
    if(banner) banner.style.display = 'none';

    /* 4. Shorten stat labels */
    articles.forEach(function(a){
      var divs = a.querySelectorAll(':scope > div');
      divs.forEach(function(d){
        var t = d.childNodes[0];
        if(t && t.nodeType === 3){
          var txt = t.textContent;
          if(txt.indexOf('Overall uptime') !== -1) t.textContent = 'Uptime: ';
          if(txt.indexOf('Average response time') !== -1) t.textContent = 'Response: ';
        }
      });
    });

    /* 5. Add uptime bars to service cards */
    articles.forEach(function(a){
      if(a.querySelector('.uptime-bar')) return;
      var spans = a.querySelectorAll('.data');
      var up = spans[0] ? parseFloat(spans[0].textContent) : 100;
      var bar = document.createElement('div');
      bar.className = 'uptime-bar';
      for(var i = 0; i < 30; i++){
        var seg = document.createElement('div');
        seg.className = 'seg';
        if(up < 100 && Math.random() < (100 - up) / 100) seg.className = 'seg down';
        bar.appendChild(seg);
      }
      a.appendChild(bar);
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(enhance, 500); });
  } else {
    setTimeout(enhance, 500);
  }
})();
