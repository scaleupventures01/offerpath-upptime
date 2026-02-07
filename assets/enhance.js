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

    /* 1. Compute aggregate stats — account for degraded + down */
    var totalUp = 0, totalResp = 0, count = articles.length;
    var downCount = 0, degradedCount = 0;
    articles.forEach(function(a){
      var spans = a.querySelectorAll('.data');
      if(spans[0]){ var v = parseFloat(spans[0].textContent); if(!isNaN(v)) totalUp += v; }
      if(spans[1]){ var m = parseInt(spans[1].textContent); if(!isNaN(m)) totalResp += m; }
      if(a.classList.contains('down')) downCount++;
      if(a.classList.contains('degraded')) degradedCount++;
    });
    var avgUp = totalUp / count;
    var avgResp = Math.round(totalResp / count);

    /* Penalize degraded: cap at 99.98% max when any service is degraded */
    if(degradedCount > 0){
      var penalized = ((count - degradedCount) * 100 + degradedCount * 99.5) / count;
      avgUp = Math.min(avgUp, penalized, 99.98);
    }
    avgUp = Math.max(0, avgUp);
    var avgUpStr = avgUp.toFixed(2);

    /* Status label */
    var statusColor, statusLabel;
    if(downCount > 0){
      statusColor = '#ef4444';
      statusLabel = downCount === 1 ? '1 Service Down' : downCount + ' Services Down';
    } else if(degradedCount > 0){
      statusColor = '#f59e0b';
      statusLabel = degradedCount === 1 ? '1 Service Degraded' : degradedCount + ' Services Degraded';
    } else {
      statusColor = '#10b981';
      statusLabel = 'All Systems Operational';
    }

    var ringDeg = (parseFloat(avgUpStr) * 3.6).toFixed(1);

    /* 2. Hide default page header, intro, and banner — hero replaces all of them */
    var main = document.querySelector('main.container') || document.querySelector('main');
    if(main){
      var h1 = main.querySelector('h1');
      if(h1) h1.style.display = 'none';
      var lead = main.querySelector('.lead');
      if(lead) lead.style.display = 'none';
      var banner = main.querySelector('article.up:not(.link)');
      if(banner) banner.style.display = 'none';
      /* Also hide the old stats-row if present from a prior script version */
      var oldStats = main.querySelector('.stats-row');
      if(oldStats) oldStats.style.display = 'none';
    }

    /* 3. Overall uptime hero — inject at the very top of <main> */
    if(main && !document.querySelector('.ofp-overall-hero')){
      var hero = document.createElement('div');
      hero.className = 'ofp-overall-hero';
      hero.innerHTML =
        '<div class="ofp-hero-title">OfferPath System Status</div>' +
        '<div class="ofp-hero-inner">' +
          '<div class="ofp-hero-ring" style="background:conic-gradient(' + statusColor + ' ' + ringDeg + 'deg, #f3f4f6 0)">' +
            '<div class="ofp-hero-pct">' + avgUpStr + '%</div>' +
          '</div>' +
          '<div class="ofp-hero-meta">' +
            '<div class="ofp-hero-label">Overall Uptime</div>' +
            '<div class="ofp-hero-status" style="color:' + statusColor + '">' + statusLabel + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ofp-hero-chips">' +
          '<div class="ofp-chip"><span class="ofp-chip-num">' + count + '</span> Services Monitored</div>' +
          '<div class="ofp-chip"><span class="ofp-chip-num">' + avgResp + 'ms</span> Avg Response</div>' +
          (downCount > 0 ? '<div class="ofp-chip ofp-chip-alert"><span class="ofp-chip-num">' + downCount + '</span> Down</div>' : '') +
          (degradedCount > 0 ? '<div class="ofp-chip ofp-chip-warn"><span class="ofp-chip-num">' + degradedCount + '</span> Degraded</div>' : '') +
        '</div>' +
        '<div class="ofp-hero-sub" id="ofp-last-check">Real-time monitoring \u00b7 Checks every 5 minutes</div>';
      main.insertBefore(hero, main.firstChild);

      /* Fetch last uptime check time from GitHub Actions */
      fetch('https://api.github.com/repos/scaleupventures01/offerpath-upptime/actions/workflows/uptime.yml/runs?per_page=1&status=completed')
        .then(function(r){ return r.json(); })
        .then(function(d){
          if(d.workflow_runs && d.workflow_runs[0]){
            var dt = new Date(d.workflow_runs[0].updated_at);
            var now = new Date();
            var diffMs = now - dt;
            var diffMin = Math.round(diffMs / 60000);
            var timeAgo;
            if(diffMin < 1) timeAgo = 'just now';
            else if(diffMin === 1) timeAgo = '1 min ago';
            else if(diffMin < 60) timeAgo = diffMin + ' min ago';
            else { var h = Math.round(diffMin / 60); timeAgo = h === 1 ? '1 hour ago' : h + ' hours ago'; }
            var el = document.getElementById('ofp-last-check');
            if(el) el.textContent = 'Last checked ' + timeAgo;
          }
        })
        .catch(function(){});

      /* Inject hero styles */
      var style = document.createElement('style');
      style.textContent =
        '.ofp-overall-hero{background:white;border:1px solid #e5e7eb;border-radius:16px;padding:2rem 2.5rem;margin-bottom:2rem;box-shadow:0 2px 8px rgba(0,0,0,0.06);text-align:center;}' +
        '.ofp-hero-title{font-size:1.5rem;font-weight:700;color:#111827;letter-spacing:-0.025em;margin-bottom:1.25rem;}' +
        '.ofp-hero-inner{display:flex;align-items:center;justify-content:center;gap:1.75rem;margin-bottom:1.25rem;}' +
        '.ofp-hero-ring{width:110px;height:110px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;}' +
        '.ofp-hero-ring::after{content:"";position:absolute;inset:8px;border-radius:50%;background:white;}' +
        '.ofp-hero-pct{position:relative;z-index:1;font-size:1.5rem;font-weight:800;color:#111827;letter-spacing:-0.03em;}' +
        '.ofp-hero-meta{text-align:left;}' +
        '.ofp-hero-label{font-size:0.8rem;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:600;margin-bottom:0.25rem;}' +
        '.ofp-hero-status{font-size:1.35rem;font-weight:700;letter-spacing:-0.02em;}' +
        '.ofp-hero-chips{display:flex;justify-content:center;gap:1rem;flex-wrap:wrap;margin-bottom:0.75rem;}' +
        '.ofp-chip{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:0.5rem 1rem;font-size:0.85rem;color:#6b7280;font-weight:500;}' +
        '.ofp-chip-num{font-weight:700;color:#111827;margin-right:4px;}' +
        '.ofp-chip-alert{background:#fef2f2;border-color:#fecaca;color:#991b1b;}' +
        '.ofp-chip-alert .ofp-chip-num{color:#ef4444;}' +
        '.ofp-chip-warn{background:#fffbeb;border-color:#fde68a;color:#92400e;}' +
        '.ofp-chip-warn .ofp-chip-num{color:#f59e0b;}' +
        '.ofp-hero-sub{font-size:0.8rem;color:#9ca3af;margin-top:0.25rem;}' +
        '@media(max-width:768px){.ofp-overall-hero{padding:1.25rem;}.ofp-hero-inner{flex-direction:column;gap:1rem;}.ofp-hero-meta{text-align:center;}.ofp-hero-ring{width:90px;height:90px;}.ofp-hero-pct{font-size:1.25rem;}.ofp-hero-status{font-size:1.1rem;}.ofp-hero-title{font-size:1.25rem;}}';
      document.head.appendChild(style);
    }

    /* 4. Shorten stat labels on service cards */
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
