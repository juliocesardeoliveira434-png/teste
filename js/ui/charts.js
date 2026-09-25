/* ============================================================
   VITRINE PRO — charts.js
   Gráficos em Canvas 2D puro (sem Chart.js, sem dependências).
   Line/area, barras, donut, funil e sparkline — responsivos e
   com suporte a tema claro/escuro + alta densidade de pixels.
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};

  var instances = [];

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function hsl(h, s, l, a) {
    return 'hsla(' + h + ',' + s + '%,' + l + '%,' + (a == null ? 1 : a) + ')';
  }
  function brandHue() {
    return parseInt(css('--brand-h') || '245', 10) || 245;
  }

  function setup(canvas) {
    var dpr = Math.min(w.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    var w2 = Math.max(1, Math.round(rect.width));
    var h2 = Math.max(1, Math.round(rect.height));
    canvas.width = w2 * dpr;
    canvas.height = h2 * dpr;
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return null;              /* canvas indisponível: ignora */
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w2, h2);
    return { ctx: ctx, w: w2, h: h2 };
  }

  function niceMax(v) {
    if (v <= 0) return 10;
    var exp = Math.pow(10, Math.floor(Math.log10(v)));
    var f = v / exp;
    var nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
    return nice * exp;
  }

  function roundRect(ctx, x, y, w2, h2, r) {
    r = Math.min(r, Math.min(w2, h2) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w2, y, x + w2, y + h2, r);
    ctx.arcTo(x + w2, y + h2, x, y + h2, r);
    ctx.arcTo(x, y + h2, x, y, r);
    ctx.arcTo(x, y, x + w2, y, r);
    ctx.closePath();
  }

  /* ============================ LINE / AREA ============================ */
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} o { labels:[], series:[{data:[], color, label}], format(v) }
   */
  function line(canvas, o) {
    var s = setup(canvas); if (!s) return;
    var ctx = s.ctx, W = s.w, H = s.h;
    var pad = { t: 18, r: 16, b: 28, l: 54 };
    var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    var labels = o.labels || [];
    var series = (o.series || []).filter(Boolean);
    if (!series.length || iw <= 0 || ih <= 0) return;

    var max = 0;
    series.forEach(function (se) {
      se.data.forEach(function (v) { max = Math.max(max, v); });
    });
    max = niceMax(max * 1.12) || 10;
    var fmt = o.format || function (v) { return String(Math.round(v)); };

    /* grid + eixo Y */
    ctx.font = '500 11px ' + (css('--font') || 'system-ui');
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    var lines = 4;
    for (var g = 0; g <= lines; g++) {
      var y = pad.t + (ih / lines) * g;
      ctx.strokeStyle = css('--line') || 'rgba(0,0,0,.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.l, Math.round(y) + .5);
      ctx.lineTo(pad.l + iw, Math.round(y) + .5);
      ctx.stroke();
      ctx.fillStyle = css('--ink-4') || '#94a3b8';
      ctx.fillText(fmt(max - (max / lines) * g), pad.l - 10, y);
    }

    /* eixo X */
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    var step = Math.max(1, Math.ceil(labels.length / 6));
    for (var i = 0; i < labels.length; i += step) {
      var x = pad.l + (iw / Math.max(1, labels.length - 1)) * i;
      ctx.fillStyle = css('--ink-4') || '#94a3b8';
      ctx.fillText(labels[i], x, pad.t + ih + 9);
    }

    function px(i) { return pad.l + (iw / Math.max(1, labels.length - 1)) * i; }
    function py(v) { return pad.t + ih - (v / max) * ih; }

    series.forEach(function (se, si) {
      var hue = se.hue != null ? se.hue : (brandHue() + si * 42);
      var color = se.color || hsl(hue, 78, 55);

      /* área */
      var grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ih);
      grad.addColorStop(0, hsl(hue, 82, 58, .34));
      grad.addColorStop(1, hsl(hue, 82, 58, 0));
      ctx.beginPath();
      ctx.moveTo(px(0), py(se.data[0]));
      for (var i = 1; i < se.data.length; i++) {
        var xc = (px(i - 1) + px(i)) / 2;
        ctx.bezierCurveTo(xc, py(se.data[i - 1]), xc, py(se.data[i]), px(i), py(se.data[i]));
      }
      ctx.lineTo(px(se.data.length - 1), pad.t + ih);
      ctx.lineTo(px(0), pad.t + ih);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      /* linha */
      ctx.beginPath();
      ctx.moveTo(px(0), py(se.data[0]));
      for (var j = 1; j < se.data.length; j++) {
        var xc2 = (px(j - 1) + px(j)) / 2;
        ctx.bezierCurveTo(xc2, py(se.data[j - 1]), xc2, py(se.data[j]), px(j), py(se.data[j]));
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.6;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    });

    /* interação */
    var tip = ensureTip(canvas);
    function onMove(e) {
      var rect = canvas.getBoundingClientRect();
      var mx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      var idx = Math.round(((mx - pad.l) / iw) * (labels.length - 1));
      idx = Math.max(0, Math.min(labels.length - 1, idx));
      var bx = px(idx);
      drawHover(s, canvas, pad, iw, ih, series, labels, idx, bx, max, fmt, tip, px, py);
    }
    function onLeave() { tip.style.opacity = '0'; redraw(); }
    function redraw() { line(canvas, o); }

    canvas._chartMove = onMove;
    canvas._chartLeave = onLeave;
    canvas.onmousemove = onMove;
    canvas.onmouseleave = onLeave;
    canvas.ontouchmove = onMove;
    canvas.ontouchend = onLeave;
    register(canvas, redraw);
  }

  function drawHover(s, canvas, pad, iw, ih, series, labels, idx, bx, max, fmt, tip, px, py) {
    var ctx = s.ctx;
    ctx.clearRect(0, 0, s.w, s.h);
    line.quiet = true;
    /* redesenha tudo (simples e sempre correto) */
    var parent = canvas.parentNode;
    canvas._silent = true;
    line(canvas, { labels: labels, series: series, format: fmt });
    canvas._silent = false;

    ctx.strokeStyle = hsl(brandHue(), 70, 55, .5);
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bx, pad.t);
    ctx.lineTo(bx, pad.t + ih);
    ctx.stroke();
    ctx.setLineDash([]);

    series.forEach(function (se) {
      var hue = se.hue != null ? se.hue : (brandHue() + 0);
      ctx.beginPath();
      ctx.arc(bx, py(se.data[idx]), 5, 0, Math.PI * 2);
      ctx.fillStyle = css('--surface') || '#fff';
      ctx.fill();
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = se.color || hsl(hue, 78, 55);
      ctx.stroke();
    });

    var rows = series.map(function (se) {
      return '<div style="display:flex;align-items:center;gap:8px">' +
        '<i style="width:8px;height:8px;border-radius:2px;background:' + (se.color || hsl(brandHue(), 78, 55)) + '"></i>' +
        '<b style="font-variant-numeric:tabular-nums">' + (se.tipFormat ? se.tipFormat(se.data[idx]) : fmt(se.data[idx])) + '</b>' +
        (se.label ? '<span style="color:var(--ink-3)">' + se.label + '</span>' : '') +
        '</div>';
    }).join('');

    tip.innerHTML = '<div style="font-size:11px;color:var(--ink-4);margin-bottom:4px">' + labels[idx] + '</div>' + rows;
    tip.style.opacity = '1';
    var rect = canvas.getBoundingClientRect();
    var left = Math.min(Math.max(8, bx - 60), rect.width - 130);
    tip.style.transform = 'translate(' + left + 'px,' + Math.max(4, py(series[0].data[idx]) - 54) + 'px)';
    if (parent) {}
  }

  function ensureTip(canvas) {
    var host = canvas.parentNode;
    if (!host) return document.createElement('div');
    host.style.position = 'relative';
    var tip = host.querySelector('.chart-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'chart-tip';
      tip.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;opacity:0;transition:opacity .15s;' +
        'background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:8px 10px;' +
        'box-shadow:0 10px 30px rgba(0,0,0,.12);font-size:12px;z-index:5;min-width:110px';
      host.appendChild(tip);
    }
    return tip;
  }

  /* ============================ BARRAS ============================ */
  function bars(canvas, o) {
    var s = setup(canvas); if (!s) return;
    var ctx = s.ctx, W = s.w, H = s.h;
    var pad = { t: 14, r: 12, b: 34, l: 46 };
    var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    var data = o.data || [];
    if (!data.length) return;
    var max = niceMax(Math.max.apply(null, data.map(function (d) { return d.value; })) * 1.15) || 10;
    var fmt = o.format || function (v) { return String(Math.round(v)); };

    ctx.font = '500 11px ' + (css('--font') || 'system-ui');
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (var g = 0; g <= 4; g++) {
      var y = pad.t + (ih / 4) * g;
      ctx.strokeStyle = css('--line') || 'rgba(0,0,0,.08)';
      ctx.beginPath();
      ctx.moveTo(pad.l, Math.round(y) + .5);
      ctx.lineTo(pad.l + iw, Math.round(y) + .5);
      ctx.stroke();
      ctx.fillStyle = css('--ink-4') || '#94a3b8';
      ctx.fillText(fmt(max - (max / 4) * g), pad.l - 8, y);
    }

    var slot = iw / data.length;
    var bw = Math.min(46, slot * .58);
    data.forEach(function (d, i) {
      var x = pad.l + slot * i + (slot - bw) / 2;
      var h2 = Math.max(2, (d.value / max) * ih);
      var y2 = pad.t + ih - h2;
      var hue = d.hue != null ? d.hue : brandHue();
      var grad = ctx.createLinearGradient(0, y2, 0, y2 + h2);
      grad.addColorStop(0, hsl(hue, 80, 62));
      grad.addColorStop(1, hsl(hue, 74, 46));
      ctx.fillStyle = grad;
      roundRect(ctx, x, y2, bw, h2, Math.min(7, bw / 2));
      ctx.fill();

      ctx.fillStyle = css('--ink-4') || '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = '500 11px ' + (css('--font') || 'system-ui');
      ctx.fillText(d.label, x + bw / 2, pad.t + ih + 8);
    });
    register(canvas, function () { bars(canvas, o); });
  }

  /* ============================ DONUT ============================ */
  function donut(canvas, o) {
    var s = setup(canvas); if (!s) return;
    var ctx = s.ctx, W = s.w, H = s.h;
    var data = (o.data || []).filter(function (d) { return d.value > 0; });
    var cx = W / 2, cy = H / 2;
    var r = Math.min(W, H) / 2 - 12;
    var thick = o.thick || Math.max(18, r * .38);
    var total = data.reduce(function (a, d) { return a + d.value; }, 0);
    if (!total) return;

    var start = -Math.PI / 2;
    data.forEach(function (d) {
      var ang = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, start, start + ang);
      ctx.arc(cx, cy, r - thick, start + ang, start, true);
      ctx.closePath();
      ctx.fillStyle = d.color || hsl(d.hue != null ? d.hue : brandHue(), 74, 55);
      ctx.fill();
      ctx.strokeStyle = css('--surface') || '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      start += ang;
    });

    if (o.center !== false) {
      var big = o.centerTop || (o.centerFormat ? o.centerFormat(total) : VT.format.brlCompact(total));
      ctx.textAlign = 'center';
      ctx.fillStyle = css('--ink') || '#0f172a';
      ctx.font = '800 ' + Math.max(15, Math.round(r * .30)) + 'px ' + (css('--font') || 'system-ui');
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(big, cx, cy + 2);
      ctx.fillStyle = css('--ink-4') || '#94a3b8';
      ctx.font = '600 11px ' + (css('--font') || 'system-ui');
      ctx.fillText(o.centerLabel || 'total', cx, cy + 18);
    }
    register(canvas, function () { donut(canvas, o); });
  }

  /* ============================ FUNIL ============================ */
  function funnel(canvas, o) {
    var s = setup(canvas); if (!s) return;
    var ctx = s.ctx, W = s.w, H = s.h;
    var data = o.data || [];
    if (!data.length) return;
    var pad = { t: 10, b: 10, l: 88, r: 58 };
    var iw = W - pad.l - pad.r;
    var ih = H - pad.t - pad.b;
    var max = data[0].value || 1;
    var slot = ih / data.length;
    var bh = Math.min(34, slot * .62);

    ctx.font = '500 11px ' + (css('--font') || 'system-ui');
    data.forEach(function (d, i) {
      var y = pad.t + slot * i + (slot - bh) / 2;
      var wd = Math.max(24, (d.value / max) * iw);
      var hue = brandHue() + i * 10;
      var grad = ctx.createLinearGradient(pad.l, 0, pad.l + wd, 0);
      grad.addColorStop(0, hsl(hue, 80, 62));
      grad.addColorStop(1, hsl(hue + 22, 78, 52));
      ctx.fillStyle = grad;
      roundRect(ctx, pad.l, y, wd, bh, 8);
      ctx.fill();

      ctx.fillStyle = css('--ink-2') || '#334155';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.label, pad.l - 10, y + bh / 2);

      ctx.fillStyle = css('--ink') || '#0f172a';
      ctx.textAlign = 'left';
      ctx.font = '700 12px ' + (css('--font') || 'system-ui');
      ctx.fillText(VT.format.num(d.value), pad.l + wd + 10, y + bh / 2);
      ctx.font = '500 11px ' + (css('--font') || 'system-ui');
      ctx.fillStyle = css('--ink-4') || '#94a3b8';
      var pctV = Math.round((d.value / max) * 100);
      ctx.fillText(pctV + '%', pad.l + wd + 10, y + bh / 2 + 13);
    });
    register(canvas, function () { funnel(canvas, o); });
  }

  /* ============================ SPARKLINE ============================ */
  function spark(canvas, data, hue) {
    var s = setup(canvas); if (!s) return;
    var ctx = s.ctx, W = s.w, H = s.h;
    if (!data || data.length < 2) return;
    var max = Math.max.apply(null, data), min = Math.min.apply(null, data);
    var range = (max - min) || 1;
    var pts = data.map(function (v, i) {
      return [ (W / (data.length - 1)) * i, H - 4 - ((v - min) / range) * (H - 10) ];
    });
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, hsl(hue == null ? brandHue() : hue, 82, 60, .32));
    grad.addColorStop(1, hsl(hue == null ? brandHue() : hue, 82, 60, 0));
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) {
      var xc = (pts[i - 1][0] + pts[i][0]) / 2;
      ctx.bezierCurveTo(xc, pts[i - 1][1], xc, pts[i][1], pts[i][0], pts[i][1]);
    }
    ctx.strokeStyle = hsl(hue == null ? brandHue() : hue, 78, 55);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineTo(pts[pts.length - 1][0], H);
    ctx.lineTo(pts[0][0], H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    register(canvas, function () { spark(canvas, data, hue); });
  }

  /* ============================ registro / resize ============================ */
  function register(canvas, redraw) {
    canvas._redraw = redraw;
    if (instances.indexOf(canvas) === -1) instances.push(canvas);
  }

  var t = null;
  w.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      instances = instances.filter(function (c) { return document.body.contains(c); });
      instances.forEach(function (c) {
        try { c._redraw && c._redraw(); } catch (e) { /* canvas removido */ }
      });
    }, 140);
  });

  /** Redesenha todos os gráficos (útil ao trocar de tema). */
  function refresh() {
    instances.forEach(function (c) { try { c._redraw && c._redraw(); } catch (e) {} });
  }

  VT.charts = { line: line, bars: bars, donut: donut, funnel: funnel, spark: spark, refresh: refresh };
})(window);
