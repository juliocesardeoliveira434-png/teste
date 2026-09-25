/* ============================================================
   VITRINE PRO — modal.js · diálogos, gavetas e confirmações
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};
  var D = VT.dom;

  var stack = [];

  /**
   * Abre um modal.
   * @param {object} o {
   *   title, sub, body(html|Node), footer(html), size, closable,
   *   onMount(node, close), onClose, wide, noPad
   * }
   * @returns {{ close: Function, node: HTMLElement }}
   */
  function open(o) {
    o = o || {};
    var closable = o.closable !== false;
    var host = D.byId('modalRoot');

    var overlay = document.createElement('div');
    overlay.className = 'overlay';
    var modal = document.createElement('div');
    modal.className = 'modal' + (o.size ? ' modal-' + o.size : '') + (o.wide ? ' modal-xl' : '');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    if (o.label) modal.setAttribute('aria-label', o.label);

    var html = '';
    if (o.title || closable) {
      html += '<div class="modal-head">' +
        '<div style="min-width:0">' +
          (o.title ? '<h3>' + (o.raw ? o.title : D.esc(o.title)) + '</h3>' : '') +
          (o.sub ? '<div class="sub">' + (o.raw ? o.sub : D.esc(o.sub)) + '</div>' : '') +
        '</div>' +
        (closable ? '<button class="modal-close" data-close aria-label="Fechar">✕</button>' : '') +
      '</div>';
    }
    html += '<div class="modal-body"' + (o.noPad ? ' style="padding:0"' : '') + '></div>';
    if (o.footer) html += '<div class="modal-foot"></div>';
    modal.innerHTML = html;

    var body = modal.querySelector('.modal-body');
    if (typeof o.body === 'string') body.innerHTML = o.body;
    else if (o.body) body.appendChild(o.body);

    if (o.footer) {
      var foot = modal.querySelector('.modal-foot');
      if (typeof o.footer === 'string') foot.innerHTML = o.footer;
      else foot.appendChild(o.footer);
    }
    overlay.appendChild(modal);
    host.appendChild(overlay);

    document.body.classList.add('no-scroll');
    var untrap = D.trapFocus(modal);
    stack.push(overlay);

    function close(result) {
      var i = stack.indexOf(overlay);
      if (i !== -1) stack.splice(i, 1);
      untrap();
      overlay.classList.add('closing');
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (!stack.length) document.body.classList.remove('no-scroll');
      }, 200);
      if (o.onClose) o.onClose(result);
    }

    modal.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) close();
    });
    overlay.addEventListener('mousedown', function (e) {
      if (e.target === overlay && closable) close();
    });
    D.on(document, 'keydown', null);
    function onKey(e) {
      if (e.key === 'Escape' && closable && stack[stack.length - 1] === overlay) { e.preventDefault(); close(); }
    }
    document.addEventListener('keydown', onKey);
    var origClose = close;
    close = function (r) { document.removeEventListener('keydown', onKey); origClose(r); };

    /* foco inicial */
    setTimeout(function () { D.focusFirst(body); }, 60);

    if (o.onMount) o.onMount(modal, close);
    return { close: close, node: modal, body: body };
  }

  /** Confirmação rápida. */
  function confirm(o) {
    o = o || {};
    return new Promise(function (resolve) {
      var m = open({
        title: o.title || 'Confirmar',
        sub: o.sub,
        size: 'sm',
        body: '<p style="color:var(--ink-2);line-height:1.6">' + (o.message || 'Tem certeza?') + '</p>',
        footer:
          '<button class="btn btn-ghost" data-act="no">' + (o.cancelText || 'Cancelar') + '</button>' +
          '<button class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-act="yes">' + (o.okText || 'Confirmar') + '</button>',
        onMount: function (node, close) {
          node.querySelector('[data-act="no"]').addEventListener('click', function () { close(false); resolve(false); });
          node.querySelector('[data-act="yes"]').addEventListener('click', function () { close(true); resolve(true); });
        },
        onClose: function (r) { if (r !== true && r !== false) resolve(false); }
      });
      m.node.setAttribute('aria-label', o.title || 'Confirmar');
    });
  }

  /** Alerta informativo. */
  function alert(o) {
    if (typeof o === 'string') o = { message: o };
    return new Promise(function (resolve) {
      open({
        title: o.title || 'Aviso',
        size: 'sm',
        body: '<p style="color:var(--ink-2);line-height:1.6">' + (o.message || '') + '</p>',
        footer: '<button class="btn btn-primary" data-act="ok">Entendi</button>',
        onMount: function (node, close) {
          node.querySelector('[data-act="ok"]').addEventListener('click', function () { close(); resolve(true); });
        }
      });
    });
  }

  /**
   * Abre uma gaveta lateral (drawer).
   * @param {object} o { title, body, footer, side, onMount, onClose, width }
   */
  function drawer(o) {
    o = o || {};
    var host = D.byId('cartRoot');
    var backdrop = document.createElement('div');
    backdrop.className = 'drawer-backdrop';
    var panel = document.createElement('aside');
    panel.className = 'drawer';
    panel.style.width = 'min(' + (o.width || 440) + 'px, 100vw)';
    panel.innerHTML =
      '<div class="drawer-head">' +
        '<h3></h3>' +
        '<button class="iconbtn" data-close aria-label="Fechar">✕</button>' +
      '</div>' +
      '<div class="drawer-body"></div>' +
      (o.footer ? '<div class="drawer-foot"></div>' : '');
    panel.querySelector('h3').innerHTML = o.title || '';
    panel.querySelector('.drawer-body').innerHTML = o.body || '';
    if (o.footer) panel.querySelector('.drawer-foot').innerHTML = o.footer;

    host.appendChild(backdrop);
    host.appendChild(panel);
    document.body.classList.add('no-scroll');
    var untrap = D.trapFocus(panel);

    var closed = false;
    function close(result) {
      if (closed) return;
      closed = true;
      untrap();
      panel.classList.add('closing');
      backdrop.classList.add('closing');
      setTimeout(function () {
        if (panel.parentNode) host.removeChild(panel);
        if (backdrop.parentNode) host.removeChild(backdrop);
        document.body.classList.remove('no-scroll');
        if (o.onClose) o.onClose(result);
      }, 220);
    }
    backdrop.addEventListener('click', function () { close(); });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) close();
    });
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    var prev = close;
    close = function (r) { document.removeEventListener('keydown', onKey); prev(r); };

    if (o.onMount) o.onMount(panel, close);
    return { close: close, node: panel, body: panel.querySelector('.drawer-body') };
  }

  function closeAll() {
    stack.slice().forEach(function (o) { if (o.parentNode) o.parentNode.removeChild(o); });
    stack = [];
    document.body.classList.remove('no-scroll');
  }

  VT.modal = { open: open, confirm: confirm, alert: alert, drawer: drawer, closeAll: closeAll };
})(window);
