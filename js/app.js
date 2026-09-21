/* ============================================================
   TECLATON — colagem: entrada, UI, demo, gravação
   ============================================================ */
(function () {
  'use strict';

  var SND = window.SND, PACKS = window.PACKS;
  if (!SND || !PACKS || !window.Visuals) return;

  /* ---------- estado ---------- */
  var packIdx = 0;
  try {
    var si = parseInt(localStorage.getItem('teclaton.pack'), 10);
    if (!isNaN(si) && si >= 0 && si < PACKS.length) packIdx = si;
  } catch (e) {}
  var started = false, demoTimers = [], demoOn = false, recording = false;
  var rec = null, recChunks = [], recT0 = 0, recTimerIv = null;

  /* ---------- canvas ---------- */
  var canvas = document.getElementById('stage');
  var vis = new Visuals(canvas);
  window.addEventListener('resize', function () { vis.resize(); });

  /* ---------- elementos ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var hint = $('hint'), toast = $('toast'), packname = $('packname');
  var startOv = $('start'), helpOv = $('help'), vol = $('vol');
  var btnDemo = $('btnDemo'), btnRec = $('btnRec');

  /* ---------- teclado visual ---------- */
  var keyEls = {};
  (function buildKb() {
    var rows = [['1234567890', 'kbDigits'], ['qwertyuiop', 'kb1'], ['asdfghjkl', 'kb2'], ['zxcvbnm', 'kb3']];
    rows.forEach(function (r) {
      var box = $(r[1]);
      r[0].split('').forEach(function (ch) {
        var el = document.createElement('div');
        el.className = 'key';
        el.textContent = ch;
        el.dataset.code = /[0-9]/.test(ch) ? 'Digit' + ch : 'Key' + ch.toUpperCase();
        el.addEventListener('mousedown', function (ev) { ev.preventDefault(); userTrigger(el.dataset.code); });
        box.appendChild(el);
        keyEls[el.dataset.code] = el;
      });
    });
  })();

  function lightKey(code) {
    var el = keyEls[code];
    if (!el) return;
    el.classList.add('on');
    setTimeout(function () { el.classList.remove('on'); }, 130);
  }

  /* ---------- pack atual ---------- */
  function pack() { return PACKS[packIdx]; }

  function applyPack(silent) {
    var p = pack();
    document.documentElement.style.setProperty('--ac', p.accent);
    packname.textContent = p.emoji + ' ' + p.nome;
    vis.setPack(p);
    try { localStorage.setItem('teclaton.pack', String(packIdx)); } catch (e) {}
    if (!silent) showToast(p.emoji + '  ' + p.nome.toUpperCase());
  }

  function nextPack() {
    stopDemo();
    packIdx = (packIdx + 1) % PACKS.length;
    applyPack(false);
  }

  var toastT = null;
  function showToast(txt) {
    toast.textContent = txt;
    toast.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove('show'); }, 1400);
  }

  /* ---------- disparo ---------- */
  function codeFromEvent(e) {
    if (/^Key[A-Z]$/.test(e.code)) return e.code;
    if (/^Digit[0-9]$/.test(e.code)) return e.code;
    return null;
  }

  function triggerCode(code) {
    var p = pack();
    var key = code.slice(-1).toLowerCase();           // letra ou dígito
    var spec = p.keys[key];
    if (!spec) return;
    SND.play(spec.snd);
    vis.spawn(spec.vis, /^[0-9]$/.test(key));
    lightKey(code);
  }

  function userTrigger(code) {
    if (!started) begin();
    stopDemo();
    triggerCode(code);
  }

  function begin() {
    if (started) return;
    started = true;
    SND.init();
    SND.resume();
    SND.setVolume(vol.value / 100);
    startOv.classList.add('off');
    hint.classList.add('off');
  }

  /* ---------- teclado físico ---------- */
  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'Escape') { helpOv.classList.add('hidden'); stopDemo(); return; }
    if (e.code === 'Space') {
      e.preventDefault();
      if (!started) begin(); else nextPack();
      return;
    }
    if (e.target === vol && /^Arrow/.test(e.code)) return;
    var code = codeFromEvent(e);
    if (!code) return;
    if (e.repeat) { e.preventDefault(); return; }
    e.preventDefault();
    userTrigger(code);
  });

  /* ---------- mouse / toque ---------- */
  function posToCode(x, digitFallback) {
    var W = window.innerWidth;
    var idx = Math.max(0, Math.min(25, Math.floor((x / W) * 26)));
    return 'Key' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[idx];
  }
  canvas.addEventListener('mousedown', function (e) {
    userTrigger(posToCode(e.clientX));
  });
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    if (e.touches.length >= 2) {
      var digits = '1234567890';
      userTrigger('Digit' + digits[(Math.random() * 10) | 0]);
    } else {
      userTrigger(posToCode(e.touches[0].clientX));
    }
  }, { passive: false });

  /* ---------- demo ---------- */
  function stopDemo() {
    demoTimers.forEach(clearTimeout);
    demoTimers = [];
    if (demoOn) { demoOn = false; btnDemo.textContent = '▶ Demo'; btnDemo.classList.remove('rec'); }
  }

  function runDemo() {
    var steps = pack().demo || [];
    if (!steps.length) return;
    demoOn = true;
    btnDemo.textContent = '■ Parar';
    var t = 0, i = 0;
    steps.concat(steps).forEach(function (st) {   // toca 2 vezes
      t += st[1];
      (function (code, delay) {
        demoTimers.push(setTimeout(function () {
          var realCode = /^D[0-9]$/.test(code) ? 'Digit' + code[1] : 'Key' + code.toUpperCase();
          triggerCode(realCode);
          lightKey(realCode);
        }, delay));
      })(st[0], t);
    });
    demoTimers.push(setTimeout(function () {
      demoOn = false; btnDemo.textContent = '▶ Demo'; btnDemo.classList.remove('rec');
    }, t + 400));
  }

  btnDemo.addEventListener('click', function () {
    if (!started) begin();
    if (demoOn) stopDemo(); else { stopDemo(); runDemo(); }
  });

  /* ---------- troca de pack ---------- */
  ['packname', 'logo'].forEach(function () {});
  $('logo').addEventListener('click', nextPack);
  packname.addEventListener('click', nextPack);

  /* ---------- volume ---------- */
  try {
    var sv = localStorage.getItem('teclaton.vol');
    if (sv !== null) vol.value = sv;
  } catch (e) {}
  vol.addEventListener('input', function () {
    SND.setVolume(vol.value / 100);
    try { localStorage.setItem('teclaton.vol', vol.value); } catch (e) {}
  });
  vol.addEventListener('pointerup', function () { vol.blur(); });

  /* ---------- tela cheia ---------- */
  $('btnFull').addEventListener('click', function () {
    try {
      if (!document.fullscreenElement) {
        var r = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
        if (r && r.catch) r.catch(function () {});
      } else if (document.exitFullscreen) document.exitFullscreen();
    } catch (e) {}
  });

  /* ---------- ajuda ---------- */
  $('btnHelp').addEventListener('click', function () { helpOv.classList.toggle('hidden'); });
  $('btnHelpClose').addEventListener('click', function () { helpOv.classList.add('hidden'); });
  helpOv.addEventListener('click', function (e) { if (e.target === helpOv) helpOv.classList.add('hidden'); });

  /* ---------- gravação (vídeo + áudio, tudo local) ---------- */
  var canRec = !!(canvas.captureStream && window.MediaRecorder);
  if (!canRec) { btnRec.disabled = true; btnRec.title = 'Gravação não suportada neste navegador'; }

  function recPickMime() {
    var cands = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    for (var i = 0; i < cands.length; i++) {
      if (MediaRecorder.isTypeSupported(cands[i])) return cands[i];
    }
    return '';
  }

  function fmtTime(s) {
    var m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return m + ':' + (ss < 10 ? '0' : '') + ss;
  }

  btnRec.addEventListener('click', function () {
    if (!canRec) return;
    if (recording) { stopRecording(); return; }
    if (!started) begin();

    var stream = canvas.captureStream(60);
    var dest = SND.ensureRec();
    dest.stream.getAudioTracks().forEach(function (t) { stream.addTrack(t); });

    var opts = recPickMime();
    rec = new MediaRecorder(stream, opts ? { mimeType: opts, videoBitsPerSecond: 6000000 } : undefined);
    recChunks = [];
    rec.ondataavailable = function (ev) { if (ev.data && ev.data.size) recChunks.push(ev.data); };
    rec.onstop = function () {
      var blob = new Blob(recChunks, { type: opts || 'video/webm' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'teclaton-' + pack().id + '-' + new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-') + '.webm';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
      showToast('🎬 vídeo salvo!');
    };

    rec.start(250);
    recording = true;
    recT0 = Date.now();
    btnRec.classList.add('rec');
    recTimerIv = setInterval(function () { btnRec.textContent = '⏺ ' + fmtTime((Date.now() - recT0) / 1000); }, 500);
    btnRec.textContent = '⏺ 0:00';
    showToast('⏺ gravando — clique de novo p/ parar');
  });

  function stopRecording() {
    if (!recording) return;
    recording = false;
    try { rec.stop(); } catch (e) {}
    clearInterval(recTimerIv);
    btnRec.classList.remove('rec');
    btnRec.textContent = '⏺ Gravar';
  }

  /* ---------- start overlay ---------- */
  $('btnStart').addEventListener('click', function () {
    begin();
    setTimeout(runDemo, 350);
  });
  startOv.addEventListener('mousedown', function (e) {
    if (e.target.id === 'btnStart') return;
    begin();
  });
  startOv.addEventListener('touchstart', function (e) {
    if (e.target.id === 'btnStart') return;
    begin();
  }, { passive: true });

  /* ---------- loop ---------- */
  applyPack(true);
  SND.volume = vol.value / 100;
  (function loop(now) {
    vis.frame(now || performance.now());
    requestAnimationFrame(loop);
  })(performance.now());
})();
