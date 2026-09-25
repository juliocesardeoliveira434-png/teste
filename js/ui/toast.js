/* ============================================================
   VITRINE PRO — toast.js · notificações
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};

  var ICONS = { ok: 'checkCircle', err: 'xCircle', warn: 'alertTri', info: 'info' };
  var MAX = 4;

  function root() {
    var r = VT.dom.byId('toastRoot');
    if (!r) {
      r = document.createElement('div');
      r.id = 'toastRoot';
      r.className = 'toast-root';
      document.body.appendChild(r);
    }
    return r;
  }

  /**
   * @param {object|string} o texto ou { title, desc, type, timeout }
   */
  function show(o) {
    if (typeof o === 'string') o = { title: o };
    var type = o.type || 'ok';
    var host = root();
    while (host.children.length >= MAX) host.removeChild(host.firstChild);

    var node = document.createElement('div');
    node.className = 'toast ' + type;
    node.setAttribute('role', type === 'err' ? 'alert' : 'status');
    node.innerHTML =
      '<span class="ti">' + VT.icons.get(ICONS[type] || 'info', 20) + '</span>' +
      '<div style="flex:1 1 auto;min-width:0">' +
        (o.title ? '<div class="tt">' + VT.dom.esc(o.title) + '</div>' : '') +
        (o.desc ? '<div class="td">' + VT.dom.esc(o.desc) + '</div>' : '') +
      '</div>' +
      '<button class="mini-del" aria-label="Fechar" style="flex:none;width:24px;height:24px;border-radius:6px;display:grid;place-items:center;color:var(--ink-4)">✕</button>';

    var timer = setTimeout(dismiss, o.timeout || (type === 'err' ? 6000 : 3600));

    function dismiss() {
      clearTimeout(timer);
      node.classList.add('out');
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 220);
    }
    node.querySelector('.mini-del').addEventListener('click', dismiss);
    host.appendChild(node);
    return dismiss;
  }

  VT.toast = {
    show: show,
    ok: function (t, d) { return show({ title: t, desc: d, type: 'ok' }); },
    err: function (t, d) { return show({ title: t, desc: d, type: 'err' }); },
    warn: function (t, d) { return show({ title: t, desc: d, type: 'warn' }); },
    info: function (t, d) { return show({ title: t, desc: d, type: 'info' }); }
  };
})(window);
