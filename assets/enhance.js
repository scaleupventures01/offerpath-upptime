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

    /* 1. Stats summary row */
    var totalUp = 0, totalResp = 0, count = articles.length;
    articles.forEach(function(a){
      var spans = a.querySelectorAll('.data');
      if(spans[0]){ var v = parseFloat(spans[0].textContent); if(!isNaN(v)) totalUp += v; }
      if(spans[1]){ var m = parseInt(spans[1].textContent); if(!isNaN(m)) totalResp += m; }
    });
    var avgUp = (totalUp / count).toFixed(2);
    var avgResp = Math.round(totalResp / count);
    var banner = document.querySelector('main article.up:not(.link)');
    if(banner && !document.querySelector('.stats-row')){
      var row = document.createElement('div');
      row.className = 'stats-row';
      row.innerHTML =
        '<div class="stat-card"><div class="stat-label">Overall Uptime</div><div class="stat-value green">' + avgUp + '%</div></div>' +
        '<div class="stat-card"><div class="stat-label">Monitored Services</div><div class="stat-value">' + count + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">Avg Response Time</div><div class="stat-value">' + avgResp + 'ms</div></div>';
      banner.after(row);
    }

    /* 2. Shorten stat labels */
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

    /* 3. Add uptime bars to service cards */
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
