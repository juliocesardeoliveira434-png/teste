/* ============================================================
   VITRINE PRO — dom.js
   Micro-helper de DOM: seleção, eventos, templates e escape.
   Sem dependências. Exposto em window.VT.dom
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};

  /* ---------- seleção ---------- */
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function byId(id) { return document.getElementById(id); }

  /* ---------- criação ---------- */
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') n.className = v;
        else if (k === 'html') n.innerHTML = v;
        else if (k === 'text') n.textContent = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
        else if (k.indexOf('on') === 0 && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'dataset') Object.keys(v).forEach(function (d) { n.dataset[d] = v[d]; });
        else n.setAttribute(k, v === true ? '' : v);
      });
    }
    (children || []).forEach(function (c) {
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  /* ---------- eventos ---------- */
  function on(target, type, handler, opts) {
    if (typeof target === 'string') {
      document.addEventListener(type, function (e) {
        var m = e.target && e.target.closest && e.target.closest(target);
        if (m) handler.call(m, e, m);
      }, opts);
      return;
    }
    target.addEventListener(type, handler, opts);
  }

  /** Delegação de eventos com seletor. */
  function delegate(root, type, selector, handler) {
    root.addEventListener(type, function (e) {
      var t = e.target;
      while (t && t !== root) {
        if (t.matches && t.matches(selector)) { handler.call(t, e, t); return; }
        t = t.parentNode;
      }
    });
  }

  /* ---------- html ---------- */
  /** Escapa texto para interpolação segura em templates. */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  /** Escape explícito para atributos (alias legível). */
  var attr = esc;

  /** Junta itens de array ignorando vazios. */
  function join(arr, sep) {
    return (arr || []).filter(function (x) { return x != null && x !== '' && x !== false; }).join(sep || '');
  }

  /* ---------- utilidades de classe ---------- */
  function addClass(n, c) { if (n) n.classList.add(c); }
  function removeClass(n, c) { if (n) n.classList.remove(c); }
  function toggleClass(n, c, f) { if (n) n.classList.toggle(c, f); }

  /* ---------- misc ---------- */
  function debounce(fn, ms) {
    var t;
    return function () {
      var a = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, a); }, ms || 200);
    };
  }
  function throttle(fn, ms) {
    var last = 0, timer;
    return function () {
      var now = Date.now(), a = arguments, self = this;
      if (now - last >= (ms || 100)) { last = now; fn.apply(self, a); }
      else {
        clearTimeout(timer);
        timer = setTimeout(function () { last = Date.now(); fn.apply(self, a); }, (ms || 100) - (now - last));
      }
    };
  }
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function uid(prefix) {
    return (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 9);
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /** Observa elementos com [data-reveal] e aplica .in ao entrar na viewport. */
  var revealObserver = null;
  function observeReveal(root) {
    if (!('IntersectionObserver' in w)) {
      qsa('[data-reveal]', root || document).forEach(function (n) { n.classList.add('in'); });
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -60px 0px', threshold: .06 });
    }
    qsa('[data-reveal]', root || document).forEach(function (n, i) {
      n.style.transitionDelay = Math.min(i % 8, 7) * 45 + 'ms';
      revealObserver.observe(n);
    });
  }

  /** Copia texto para a área de transferência (com fallback). */
  function copy(text) {
    if (navigator.clipboard && w.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('copy falhou'));
      } catch (e) { reject(e); }
    });
  }

  /** Foca o primeiro elemento focável dentro de um container. */
  function focusFirst(root) {
    var n = qs('input,select,textarea,button,[tabindex]:not([tabindex="-1"])', root);
    if (n) { try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); } }
    return n;
  }

  /** Prende o foco (Tab) dentro de um container — acessibilidade de modais. */
  function trapFocus(container) {
    function keydown(e) {
      if (e.key !== 'Tab') return;
      var items = qsa('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])', container)
        .filter(function (n) { return n.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', keydown);
    return function () { container.removeEventListener('keydown', keydown); };
  }

  /** Roda depois do paint (garante transições). */
  function raf(fn) { requestAnimationFrame(function () { requestAnimationFrame(fn); }); }

  VT.dom = {
    qs: qs, qsa: qsa, byId: byId, el: el, on: on, delegate: delegate,
    esc: esc, attr: attr, join: join, addClass: addClass, removeClass: removeClass,
    toggleClass: toggleClass, debounce: debounce, throttle: throttle, clamp: clamp,
    uid: uid, sleep: sleep, observeReveal: observeReveal, copy: copy,
    focusFirst: focusFirst, trapFocus: trapFocus, raf: raf
  };
})(window);
