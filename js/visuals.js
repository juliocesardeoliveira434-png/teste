/* ============================================================
   TECLATON — motor visual (canvas 2D, 20 formas, glow aditivo)
   ============================================================ */
(function () {
  'use strict';

  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function lerpC(a, b, t) {
    var A = hex2rgb(a), B = hex2rgb(b);
    return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' +
      Math.round(A[1] + (B[1] - A[1]) * t) + ',' +
      Math.round(A[2] + (B[2] - A[2]) * t) + ')';
  }
  function hsla(h, s, l, a) { return 'hsla(' + h + ',' + s + '%,' + l + '%,' + a + ')'; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ---------- desenho de cada forma ----------
     ctx já transladado/rotacionado; al = alpha; e = easing 0..1; s = tamanho  */
  var SHAPES = {
    ring: function (c, s, e, al, a) {
      c.globalAlpha = al; c.lineWidth = 3 + 12 * (1 - e);
      c.strokeStyle = hsla(a.hue, 90, 62, 1);
      c.beginPath(); c.arc(0, 0, s * (0.25 + 2.3 * e), 0, 6.2832); c.stroke();
    },
    disc: function (c, s, e, al, a) {
      c.globalAlpha = al * 0.9; c.fillStyle = hsla(a.hue, 85, 60, 1);
      c.beginPath(); c.arc(0, 0, s * (0.35 + 1.25 * e), 0, 6.2832); c.fill();
    },
    circle: function (c, s, e, al, a) {
      c.globalAlpha = al; c.fillStyle = hsla(a.hue, 85, 62, 0.9);
      c.beginPath(); c.arc(0, 0, s * (1 - 0.45 * e), 0, 6.2832); c.fill();
      c.globalAlpha = al * 0.5; c.lineWidth = 3;
      c.strokeStyle = hsla(a.hue, 90, 75, 1);
      c.beginPath(); c.arc(0, 0, s * (1.05 + 0.8 * e), 0, 6.2832); c.stroke();
    },
    square: function (c, s, e, al, a) {
      var r = s * (0.4 + 1.1 * e);
      c.globalAlpha = al; c.rotate(a.rot + e * a.vr);
      c.fillStyle = hsla(a.hue, 85, 60, 0.85);
      c.fillRect(-r / 2, -r / 2, r, r);
    },
    tri: function (c, s, e, al, a) {
      var r = s * (0.5 + 1.2 * e);
      c.globalAlpha = al; c.rotate(a.rot + e * a.vr);
      c.fillStyle = hsla(a.hue, 85, 60, 0.85);
      c.beginPath();
      for (var i = 0; i < 3; i++) {
        var an = -Math.PI / 2 + i * 2.0944;
        i ? c.lineTo(Math.cos(an) * r, Math.sin(an) * r) : c.moveTo(Math.cos(an) * r, Math.sin(an) * r);
      }
      c.closePath(); c.fill();
    },
    diamond: function (c, s, e, al, a) {
      var r = s * (0.45 + 1.15 * e);
      c.globalAlpha = al; c.rotate(Math.PI / 4 + a.rot + e * a.vr);
      c.fillStyle = hsla(a.hue, 88, 62, 0.88);
      c.fillRect(-r / 2, -r / 2, r, r);
    },
    star: function (c, s, e, al, a) {
      var R = s * (0.5 + 1.1 * e), r = R * 0.45;
      c.globalAlpha = al; c.rotate(a.rot + e * a.vr);
      c.fillStyle = hsla(a.hue, 90, 65, 0.95);
      c.beginPath();
      for (var i = 0; i < 10; i++) {
        var rad = i % 2 ? r : R, an = -Math.PI / 2 + i * Math.PI / 5;
        i ? c.lineTo(Math.cos(an) * rad, Math.sin(an) * rad) : c.moveTo(Math.cos(an) * rad, Math.sin(an) * rad);
      }
      c.closePath(); c.fill();
    },
    cross: function (c, s, e, al, a) {
      var r = s * (0.4 + 1.2 * e), w = r * 0.32;
      c.globalAlpha = al; c.rotate(a.rot * 0.3 + e * a.vr * 0.3);
      c.fillStyle = hsla(a.hue, 85, 62, 0.9);
      c.fillRect(-w / 2, -r / 2, w, r); c.fillRect(-r / 2, -w / 2, r, w);
    },
    bars: function (c, s, e, al, a) {
      c.globalAlpha = al;
      c.fillStyle = hsla(a.hue, 85, 62, 0.9);
      var n = 5, w = s * 0.16, gap = s * 0.28;
      for (var i = 0; i < n; i++) {
        var ph = 0.35 + 0.65 * Math.abs(Math.sin(e * 5 - i * 0.9));
        var h = s * 1.6 * e * ph + s * 0.15;
        c.fillRect((i - (n - 1) / 2) * gap - w / 2, -h / 2, w, h);
      }
    },
    burst: function (c, s, e, al, a) {
      c.globalAlpha = al; c.lineWidth = 2 + 4 * (1 - e);
      c.strokeStyle = hsla(a.hue, 90, 63, 1);
      var n = 12;
      c.beginPath();
      for (var i = 0; i < n; i++) {
        var an = i / n * 6.2832 + a.rot;
        var r1 = s * (0.15 + 0.5 * e), r2 = r1 + s * (0.25 + 1.1 * e);
        c.moveTo(Math.cos(an) * r1, Math.sin(an) * r1);
        c.lineTo(Math.cos(an) * r2, Math.sin(an) * r2);
      }
      c.stroke();
    },
    wave: function (c, s, e, al, a) {
      c.globalAlpha = al; c.lineWidth = 3 + 5 * (1 - e);
      c.strokeStyle = hsla(a.hue, 88, 62, 1);
      c.beginPath();
      var L = s * 4 * e + s * 0.5;
      for (var x = -L / 2; x <= L / 2; x += 6) {
        var y = Math.sin(x / s * 2.2 + a.rot) * s * 0.42;
        x <= -L / 2 + 0.01 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
    },
    zig: function (c, s, e, al, a) {
      c.globalAlpha = al; c.lineWidth = 3 + 5 * (1 - e);
      c.strokeStyle = hsla(a.hue, 88, 62, 1);
      c.beginPath();
      var L = s * 3.4 * e + s * 0.4, n = 7;
      for (var i = 0; i <= n; i++) {
        var x = -L / 2 + L * i / n, y = (i % 2 ? 1 : -1) * s * 0.5;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    },
    spiral: function (c, s, e, al, a) {
      c.globalAlpha = al; c.lineWidth = 2 + 4 * (1 - e);
      c.strokeStyle = hsla(a.hue, 88, 62, 1);
      c.beginPath();
      var turns = 3, R = s * (0.3 + 1.5 * e);
      for (var t = 0; t <= 1; t += 0.04) {
        var an = a.rot + t * turns * 6.2832, r = R * t;
        t ? c.lineTo(Math.cos(an) * r, Math.sin(an) * r) : c.moveTo(Math.cos(an) * r, Math.sin(an) * r);
      }
      c.stroke();
    },
    petal: function (c, s, e, al, a) {
      var R = s * (0.45 + 1.1 * e);
      c.globalAlpha = al * 0.85; c.rotate(e * a.vr);
      c.fillStyle = hsla(a.hue, 85, 63, 1);
      for (var i = 0; i < 6; i++) {
        var an = a.rot + i * 1.0472;
        c.beginPath();
        c.ellipse(Math.cos(an) * R * 0.55, Math.sin(an) * R * 0.55, R * 0.42, R * 0.2, an, 0, 6.2832);
        c.fill();
      }
    },
    ripple: function (c, s, e, al, a) {
      c.lineWidth = 3 + 5 * (1 - e);
      for (var i = 0; i < 3; i++) {
        var p2 = Math.max(0, Math.min(1, e * 1.25 - i * 0.22));
        c.globalAlpha = al * (1 - p2 * 0.55);
        c.strokeStyle = hsla(a.hue, 90, 62, 1);
        c.beginPath(); c.arc(0, 0, s * (0.2 + 2.1 * p2) + i * s * 0.12, 0, 6.2832); c.stroke();
      }
    },
    bolt: function (c, s, e, al, a) {
      c.globalAlpha = al; c.lineWidth = 3 + 4 * (1 - e);
      c.strokeStyle = hsla(a.hue, 92, 65, 1);
      c.beginPath();
      var pts = a.pts, n = pts.length;
      for (var i = 0; i < n; i++) {
        var x = pts[i][0] * s * (0.4 + 1.2 * e), y = pts[i][1] * s * (0.4 + 1.2 * e);
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    },
    orbit: function (c, s, e, al, a) {
      var R = s * (0.4 + 1.3 * e);
      c.globalAlpha = al * 0.8; c.lineWidth = 2;
      c.strokeStyle = hsla(a.hue, 88, 62, 1);
      c.beginPath(); c.arc(0, 0, R, 0, 6.2832); c.stroke();
      var an = a.rot + e * a.vr * 6;
      c.globalAlpha = al;
      c.fillStyle = hsla(a.hue, 92, 70, 1);
      c.beginPath(); c.arc(Math.cos(an) * R, Math.sin(an) * R, s * 0.16, 0, 6.2832); c.fill();
    },
    beam: function (c, s, e, al, a) {
      c.globalAlpha = al * 0.75;
      var w = s * (0.25 + 0.75 * (1 - e));
      var g = c.createLinearGradient(0, -s * 2.4, 0, s * 2.4);
      g.addColorStop(0, hsla(a.hue, 90, 65, 0));
      g.addColorStop(0.5, hsla(a.hue, 90, 65, 1));
      g.addColorStop(1, hsla(a.hue, 90, 65, 0));
      c.fillStyle = g;
      c.fillRect(-w / 2, -s * 2.4, w, s * 4.8);
    },
    grid: function (c, s, e, al, a) {
      c.fillStyle = hsla(a.hue, 88, 64, 1);
      var n = 3, gap = s * 0.85;
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
        var d = Math.hypot(i - 1, j - 1) / 1.414;
        var p2 = Math.max(0, Math.min(1, e * 1.4 - d * 0.4));
        var r = s * 0.16 * p2;
        if (r > 0.3) { c.globalAlpha = al * (1 - d * 0.25); c.beginPath(); c.arc((i - 1) * gap, (j - 1) * gap, r, 0, 6.2832); c.fill(); }
      }
    },
    arrow: function (c, s, e, al, a) {
      var r = s * (0.45 + 1.2 * e);
      c.globalAlpha = al; c.rotate(a.rot + e * a.vr * 0.5);
      c.lineWidth = 3 + 4 * (1 - e);
      c.strokeStyle = hsla(a.hue, 90, 63, 1);
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(-r * 0.7, -r * 0.45); c.lineTo(r * 0.35, 0); c.lineTo(-r * 0.7, r * 0.45);
      c.stroke();
      c.beginPath();
      c.moveTo(-r * 0.25, 0); c.lineTo(r * 0.85, 0);
      c.stroke();
    }
  };

  var MAX_ANIMS = 150;

  function Visuals(canvas) {
    this.cv = canvas;
    this.cx = canvas.getContext('2d');
    this.anims = [];
    this.parts = [];
    this.W = 0; this.H = 0;
    this.bgFrom = ['#05070d', '#101828'];
    this.bgTo = this.bgFrom.slice();
    this.bgMix = 1;
    this.bgCur = this.bgFrom.slice();
    this.flash = 0; this.flashHue = 200;
    this.accent = '#ffd166';
    this.resize();
    for (var i = 0; i < 42; i++) {
      this.parts.push({ x: Math.random(), y: Math.random(), r: rnd(0.6, 2.2), v: rnd(0.004, 0.02), h: rnd(0, 360) });
    }
  }

  Visuals.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    this.W = window.innerWidth; this.H = window.innerHeight;
    this.cv.width = this.W * dpr;
    this.cv.height = this.H * dpr;
    this.cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  Visuals.prototype.setPack = function (pack) {
    this.bgFrom = this.bgCur.slice();
    this.bgTo = pack.bg.slice();
    this.bgMix = 0;
    this.accent = pack.accent;
  };

  Visuals.prototype.spawn = function (vis, special) {
    if (this.anims.length >= MAX_ANIMS) this.anims.shift();
    var W = this.W, H = this.H;
    var x = rnd(W * 0.14, W * 0.86), y = rnd(H * 0.16, H * 0.72);
    var size = special ? rnd(80, 130) : rnd(32, 78);
    var boltPts = null;
    if (vis.s === 'bolt') {
      boltPts = [[0, -1]];
      var px = 0;
      for (var i = 1; i <= 6; i++) { px += rnd(-0.32, 0.32); boltPts.push([px, -1 + 2 * i / 6]); }
    }
    this.anims.push({
      shape: vis.s, hue: vis.h,
      x: vis.s === 'beam' ? rnd(W * 0.2, W * 0.8) : x,
      y: vis.s === 'beam' ? H * 0.45 : y,
      size: size, rot: rnd(0, 6.28), vr: rnd(1.5, 5) * (Math.random() < 0.5 ? -1 : 1),
      t0: performance.now(), life: special ? 1400 : rnd(750, 1050),
      pts: boltPts
    });
    this.flashHue = vis.h; this.flash = Math.min(1, this.flash + 0.5);
  };

  Visuals.prototype.frame = function (now) {
    var c = this.cx, W = this.W, H = this.H;

    // fundo com transição suave entre packs
    if (this.bgMix < 1) this.bgMix = Math.min(1, this.bgMix + 0.022);
    this.bgCur[0] = lerpC(this.bgFrom[0], this.bgTo[0], this.bgMix);
    this.bgCur[1] = lerpC(this.bgFrom[1], this.bgTo[1], this.bgMix);
    var g = c.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, Math.max(W, H) * 0.75);
    g.addColorStop(0, this.bgCur[1]);
    g.addColorStop(1, this.bgCur[0]);
    c.fillStyle = g;
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.fillRect(0, 0, W, H);

    // partículas de poeira
    c.globalCompositeOperation = 'lighter';
    for (var i = 0; i < this.parts.length; i++) {
      var p = this.parts[i];
      p.y -= p.v / 60; if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
      c.globalAlpha = 0.07;
      c.fillStyle = hsla(p.h, 60, 80, 1);
      c.beginPath(); c.arc(p.x * W, p.y * H, p.r, 0, 6.2832); c.fill();
    }

    // flash do hit
    if (this.flash > 0.01) {
      c.globalAlpha = this.flash * 0.055;
      c.fillStyle = hsla(this.flashHue, 85, 60, 1);
      c.fillRect(0, 0, W, H);
      this.flash *= 0.9;
    }

    // animações
    for (var k = this.anims.length - 1; k >= 0; k--) {
      var a = this.anims[k];
      var pr = (now - a.t0) / a.life;
      if (pr >= 1) { this.anims.splice(k, 1); continue; }
      var e = 1 - Math.pow(1 - pr, 3);          // easeOutCubic
      var al = pr < 0.12 ? pr / 0.12 : 1 - (pr - 0.12) / 0.88;
      c.save();
      c.translate(a.x, a.y);
      var fn = SHAPES[a.shape];
      if (fn) fn(c, a.size, e, al, a);
      c.restore();
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  };

  window.Visuals = Visuals;
})();
