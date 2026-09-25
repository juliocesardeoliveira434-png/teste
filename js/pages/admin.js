/* ============================================================
   VITRINE PRO — pages/admin.js
   Painel administrativo: dashboard, pedidos, produtos,
   clientes, cupons, relatórios e configurações.
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};
  var F = VT.format, D = VT.dom, S = VT.store, U = VT.ui, C = VT.charts;
  var esc = D.esc;

  VT.pages = VT.pages || {};

  var MENU = [
    { g: 'Visão geral', items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
      { id: 'relatorios', label: 'Relatórios', icon: 'chartLine' }
    ]},
    { g: 'Vendas', items: [
      { id: 'pedidos', label: 'Pedidos', icon: 'receipt', badge: 'pending' },
      { id: 'cupons', label: 'Cupons', icon: 'percent' }
    ]},
    { g: 'Catálogo', items: [
      { id: 'produtos', label: 'Produtos', icon: 'package' },
      { id: 'clientes', label: 'Clientes', icon: 'users' }
    ]},
    { g: 'Sistema', items: [
      { id: 'configuracoes', label: 'Configurações', icon: 'settings' }
    ]}
  ];

  var ADMIN = {
    section: 'dashboard',
    period: 30,
    /* tabelas */
    ordSearch: '', ordStatus: '', ordPay: '', ordPage: 1, ordSort: 'date',
    prodSearch: '', prodCat: '', prodPage: 1, prodSort: 'name', prodSel: [],
    cliSearch: '', cliPage: 1,
    repPeriod: 30
  };

  VT.pages.admin = {
    title: 'Painel — Vitrine',
    full: true,

    render: function (params) {
      ADMIN.section = (params && params.section) || 'dashboard';
      return '<div class="admin" id="admin">' +
        sidebar() +

        '<div class="ad-main">' +
          '<header class="ad-top">' +
            '<button class="iconbtn only-mobile" data-menu aria-label="Abrir menu"><span class="burger"></span></button>' +
            '<div style="min-width:0">' +
              '<h1>' + esc(sectionTitle()) + '</h1>' +
              '<div class="sub">' + esc(sectionSub()) + '</div>' +
            '</div>' +
            '<div style="flex:1 1 auto"></div>' +
            '<div class="ad-search">' + VT.icons.get('search', 17) +
              '<input type="search" id="adSearch" placeholder="Buscar pedidos, produtos, clientes…" aria-label="Buscar no painel">' +
              '<kbd>/</kbd>' +
            '</div>' +
            '<button class="iconbtn" data-theme title="Alternar tema" aria-label="Tema"></button>' +
            '<button class="iconbtn" id="adBell" title="Notificações" aria-label="Notificações">' + VT.icons.get('bell', 20) + '</button>' +
            '<a class="iconbtn" href="#/" data-link title="Ver a loja" aria-label="Ver a loja">' + VT.icons.get('store', 20) + '</a>' +
            '<button class="btn btn-ghost btn-sm only-desktop" data-logout-ad>' + VT.icons.get('logout', 16) + '</button>' +
          '</header>' +
          '<div class="ad-content" id="adContent">' + this.content() + '</div>' +
        '</div>' +
      '</div>';
    },

    content: function () {
      switch (ADMIN.section) {
        case 'pedidos': return ordersHTML();
        case 'produtos': return productsHTML();
        case 'clientes': return customersHTML();
        case 'cupons': return couponsHTML();
        case 'relatorios': return reportsHTML();
        case 'configuracoes': return settingsHTML();
        default: return dashboardHTML();
      }
    },

    mount: function (root, params) {
      document.body.classList.add('is-admin');
      var self = this;
      var content = root.querySelector('#adContent');
      var search = root.querySelector('#adSearch');

      /* menu mobile */
      function closeMenu() {
        var admin = root.querySelector('.admin');
        if (admin) admin.classList.remove('menu-open');
        var bd = root.querySelector('.ad-backdrop');
        if (bd && bd.parentNode) bd.parentNode.removeChild(bd);
      }
      D.delegate(root, 'click', '[data-menu]', function () {
        root.querySelector('.admin').classList.add('menu-open');
        if (!root.querySelector('.ad-backdrop')) {
          var bd = document.createElement('div');
          bd.className = 'ad-backdrop';
          bd.addEventListener('click', closeMenu);
          root.querySelector('.admin').appendChild(bd);
        }
      });
      D.delegate(root, 'click', '[data-close-menu]', function () { closeMenu(); });
      D.delegate(root, 'click', '[data-ad-section]', function (e) { closeMenu(); });

      /* busca global */
      if (search) {
        search.addEventListener('input', D.debounce(function () {
          var q = search.value.trim().toLowerCase();
          if (ADMIN.section === 'pedidos') { ADMIN.ordSearch = q; ADMIN.ordPage = 1; }
          else if (ADMIN.section === 'produtos') { ADMIN.prodSearch = q; ADMIN.prodPage = 1; }
          else if (ADMIN.section === 'clientes') { ADMIN.cliSearch = q; ADMIN.cliPage = 1; }
          rerender();
        }, 220));
        search.addEventListener('keydown', function (e) { if (e.key === 'Escape') { search.value = ''; search.dispatchEvent(new Event('input')); } });
      }

      /* atalho "/" */
      function focusSearch(e) {
        if (e.key === '/' && document.activeElement !== search && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
          e.preventDefault();
          if (search) search.focus();
        }
      }
      document.addEventListener('keydown', focusSearch);

      /* tema */
      D.delegate(root, 'click', '[data-theme]', function () {
        S.toggleTheme();
        VT.icons.fill(root);
        setTimeout(C.refresh, 60);
      });
      D.delegate(root, 'click', '[data-logout-ad]', function () {
        VT.modal.confirm({ title: 'Sair do painel?', message: 'Você volta para a loja.', okText: 'Sair' })
          .then(function (ok) { if (ok) location.hash = '#/'; });
      });

      /* notificações */
      var bell = root.querySelector('#adBell');
      if (bell) {
        bell.addEventListener('click', function () {
          var pending = VT.seed.orders.filter(function (o) { return o.status === 'pending'; }).length;
          var low = S.allProducts().filter(function (p) { return p.stock <= S.settings().stockAlert; }).length;
          VT.modal.open({
            title: 'Central de notificações', size: 'sm',
            body: '<div class="col gap-3">' +
              notif('clock', pending + ' pedidos aguardando pagamento', 'warn') +
              notif('package', low + ' produtos com estoque baixo', 'warn') +
              notif('checkCircle', 'Sincronização concluída há 8 min', 'ok') +
              notif('users', '12 novos clientes esta semana', 'info') +
              '</div>',
            footer: '<button class="btn btn-primary" data-close>Fechar</button>'
          });
          function notif(icon, text, type) {
            var color = type === 'warn' ? 'var(--warn-ink)' : (type === 'ok' ? 'var(--ok-ink)' : 'var(--info-ink)');
            return '<div class="row gap-3" style="padding:12px;border:1px solid var(--line);border-radius:var(--r-md)">' +
              '<span style="color:' + color + ';display:grid">' + VT.icons.get(icon, 18) + '</span>' +
              '<span class="small">' + esc(text) + '</span></div>';
          }
        });
      }

      /* navegação lateral */
      D.delegate(root, 'click', '[data-ad-section]', function (e, node) {
        e.preventDefault();
        location.hash = '#/admin/' + node.dataset.adSection;
      });

      /* ===== helpers de re-render ===== */
      function rerender() {
        /* nó novo a cada re-render: listeners do container não acumulam */
        var neo = content.cloneNode(false);
        content.parentNode.replaceChild(neo, content);
        content = neo;
        content.innerHTML = self.content();
        self.mountSection(content);
        VT.icons.fill(content);
      }
      this.rerender = rerender;
      this.mountSection(content);
      VT.icons.fill(root);
      D.observeReveal(content);

      /* remove a classe ao sair */
      this._cleanup = function () {
        document.body.classList.remove('is-admin');
        document.removeEventListener('keydown', focusSearch);
      };
    },

    unmount: function () {
      if (this._cleanup) this._cleanup();
    },

    /* ---------------- mount por seção ---------------- */
    mountSection: function (root) {
      switch (ADMIN.section) {
        case 'pedidos': return mountOrders(root);
        case 'produtos': return mountProducts(root);
        case 'clientes': return mountCustomers(root);
        case 'cupons': return mountCoupons(root);
        case 'relatorios': return mountReports(root);
        case 'configuracoes': return mountSettings(root);
        default: return mountDashboard(root);
      }
    }
  };

  /* ============================================================
     Sidebar
     ============================================================ */
  function sidebar() {
    var pending = VT.seed.orders.filter(function (o) { return o.status === 'pending'; }).length;
    return '<aside class="ad-side">' +
      '<div class="ad-side-head">' +
        '<a class="brand" href="#/admin" data-link>' +
          '<span class="brand-mark">V</span>' +
          '<span class="brand-txt">VITRINE<b>PRO</b></span>' +
        '</a>' +
        '<button class="modal-close only-mobile" data-close-menu aria-label="Fechar menu">✕</button>' +
      '</div>' +
      '<div class="ad-side-body">' +
        MENU.map(function (g) {
          return '<div class="ad-group">' +
            '<div class="ad-group-t">' + esc(g.g) + '</div>' +
            g.items.map(function (it) {
              var badge = it.badge === 'pending' && pending ? '<span class="cnt">' + pending + '</span>'
                : (it.badge === 'pending' ? '' : '');
              return '<a class="ad-link' + (ADMIN.section === it.id ? ' on' : '') + '" href="#/admin/' + it.id + '" data-link>' +
                VT.icons.get(it.icon, 18) + esc(it.label) + badge +
                '</a>';
            }).join('') +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="ad-side-foot">' +
        '<button class="ad-user">' +
          U.avatar('Admin Vitrine', 250) +
          '<span style="flex:1 1 auto;min-width:0;text-align:left">' +
            '<span class="un">Administrador</span><br>' +
            '<span class="ue">admin@vitrine.com</span>' +
          '</span>' +
          VT.icons.get('more', 16) +
        '</button>' +
      '</div>' +
    '</aside>';
  }

  function sectionTitle() {
    var map = {
      dashboard: 'Dashboard', pedidos: 'Pedidos', produtos: 'Produtos', clientes: 'Clientes',
      cupons: 'Cupons', relatorios: 'Relatórios', configuracoes: 'Configurações'
    };
    return map[ADMIN.section] || 'Painel';
  }
  function sectionSub() {
    var map = {
      dashboard: 'Acompanhe as vendas em tempo real',
      pedidos: 'Gerencie todos os pedidos da loja',
      produtos: 'Cadastre e mantenha seu catálogo',
      clientes: 'Base de clientes e comportamento de compra',
      cupons: 'Crie campanhas e códigos de desconto',
      relatorios: 'Análises para decidir com dados',
      configuracoes: 'Deixe a loja com a sua cara'
    };
    return map[ADMIN.section] || '';
  }

  /* ============================================================
     DASHBOARD
     ============================================================ */
  function dashboardHTML() {
    var k = VT.seed.kpis(ADMIN.period);
    var series = VT.seed.salesSeries(ADMIN.period);
    var top = VT.seed.topProducts(5);
    var recent = VT.seed.orders.slice(0, 6);
    var low = S.allProducts().filter(function (p) { return p.stock <= S.settings().stockAlert; }).slice(0, 6);
    var mix = VT.seed.paymentMix();

    return '' +
      '<div class="row-b wrap gap-3 mb-5">' +
        '<div class="segmented" id="periodSel">' +
          [7, 30, 90].map(function (d) {
            return '<button data-period="' + d + '"' + (ADMIN.period === d ? ' class="on"' : '') + '>' + d + ' dias</button>';
          }).join('') +
        '</div>' +
        '<div class="row gap-2">' +
          '<button class="btn btn-outline btn-sm" data-export="orders">' + VT.icons.get('download', 15) + ' Exportar pedidos</button>' +
          '<button class="btn btn-primary btn-sm" data-goto="produtos">' + VT.icons.get('plus', 15) + ' Novo produto</button>' +
        '</div>' +
      '</div>' +

      '<div class="kpi-grid mb-5">' +
        U.kpi({ cls: 'kpi-1', label: 'Receita bruta', value: F.brl(k.revenue), icon: 'money', delta: k.revenueDelta }) +
        U.kpi({ cls: 'kpi-2', label: 'Pedidos', value: F.num(k.orders), icon: 'receipt', delta: k.ordersDelta }) +
        U.kpi({ cls: 'kpi-3', label: 'Ticket médio', value: F.brl(k.ticket), icon: 'tag', delta: k.ticketDelta }) +
        U.kpi({ cls: 'kpi-4', label: 'Clientes ativos', value: F.num(k.customers), icon: 'users', delta: 8.4, foot: 'vs. período anterior' }) +
      '</div>' +

      '<div class="chart-grid mb-4">' +
        '<div class="ad-panel">' +
          '<div class="ad-panel-head">' +
            '<h3>Receita e pedidos</h3>' +
            '<div class="chart-legend">' +
              '<span class="li"><i class="sw" style="background:hsl(245 78% 55%)"></i> Receita</span>' +
            '</div>' +
          '</div>' +
          '<div class="ad-panel-body">' +
            '<div class="chart-box"><canvas id="chRevenue"></canvas></div>' +
          '</div>' +
        '</div>' +
        '<div class="ad-panel">' +
          '<div class="ad-panel-head"><h3>Formas de pagamento</h3></div>' +
          '<div class="ad-panel-body">' +
            '<div class="chart-box" style="height:230px"><canvas id="chMix"></canvas></div>' +
            '<div class="chart-legend center mt-4" style="justify-content:center">' +
              mix.map(function (m) {
                return '<span class="li"><i class="sw" style="background:hsl(' + m.hue + ' 74% 52%)"></i> ' +
                  esc(m.name) + ' <b>' + F.pct(m.value / mix.reduce(function (s, x) { return s + x.value; }, 1) * 100, 0) + '</b></span>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="grid-2-1 mb-4">' +
        '<div class="ad-panel">' +
          '<div class="ad-panel-head"><h3>Últimos pedidos</h3>' +
            '<a class="btn btn-ghost btn-sm" href="#/admin/pedidos" data-link>Ver todos</a></div>' +
          '<div class="table-wrap"><table class="table ad-table">' +
            '<thead><tr><th>Pedido</th><th>Cliente</th><th>Pagamento</th><th>Status</th><th class="num">Total</th></tr></thead>' +
            '<tbody>' +
              recent.map(function (o) {
                return '<tr>' +
                  '<td><a href="#" data-order="' + esc(o.id) + '" class="cell-main">' + esc(o.code) + '</a>' +
                    '<div class="cell-sub">' + esc(F.date(o.createdAt)) + '</div></td>' +
                  '<td>' + esc(o.customerName) + '<div class="cell-sub">' + esc(o.city) + '/' + esc(o.state) + '</div></td>' +
                  '<td><span class="small">' + esc(VT.payments.PAY_LABEL[o.payment]) +
                    (o.installments > 1 ? ' ' + o.installments + 'x' : '') + '</span></td>' +
                  '<td>' + U.statusBadge(o.status) + '</td>' +
                  '<td class="num strong">' + F.brl(o.total) + '</td>' +
                  '</tr>';
              }).join('') +
            '</tbody>' +
          '</table></div>' +
        '</div>' +

        '<div class="ad-panel">' +
          '<div class="ad-panel-head"><h3>Mais vendidos</h3></div>' +
          '<div class="ad-list">' +
            top.map(function (t, i) {
              return '<div class="ad-list-row">' +
                '<span class="rk' + (i === 0 ? ' top' : '') + '">' + (i + 1) + '</span>' +
                '<div class="thumb">' + VT.art.product(t.product.art, t.product.hue) + '</div>' +
                '<div class="nm"><div class="t trunc">' + esc(t.product.name) + '</div>' +
                  '<div class="s">' + t.qty + ' un. vendidas</div></div>' +
                '<span class="vl">' + F.brlCompact(t.revenue) + '</span>' +
                '</div>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="grid-2">' +
        '<div class="ad-panel">' +
          '<div class="ad-panel-head"><h3>Funil de conversão</h3></div>' +
          '<div class="ad-panel-body"><div class="chart-box" style="height:260px"><canvas id="chFunnel"></canvas></div></div>' +
        '</div>' +
        '<div class="ad-panel">' +
          '<div class="ad-panel-head"><h3>Alertas de estoque</h3>' +
            '<a class="btn btn-ghost btn-sm" href="#/admin/produtos" data-link>Gerenciar</a></div>' +
          '<div class="ad-list">' +
            (low.length ? low.map(function (p) {
              return '<div class="ad-list-row">' +
                '<div class="thumb">' + VT.art.product(p.art, p.hue) + '</div>' +
                '<div class="nm"><div class="t trunc">' + esc(p.name) + '</div>' +
                  '<div class="s">' + esc(p.brand) + ' · ' + esc(p.id.toUpperCase()) + '</div></div>' +
                U.stockPill(p.stock) +
                '</div>';
            }).join('') : '<div class="ad-list-row"><span class="small muted">Nenhum alerta — estoque saudável.</span></div>') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function mountDashboard(root) {
    /* período */
    D.delegate(root, 'click', '[data-period]', function (e, node) {
      ADMIN.period = Number(node.dataset.period);
      D.qsa('[data-period]', root).forEach(function (b) { b.classList.toggle('on', b.dataset.period === String(ADMIN.period)); });
      var k = VT.seed.kpis(ADMIN.period);
      var kpis = D.qsa('.kpi .kv', root);
      if (kpis[0]) kpis[0].textContent = F.brl(k.revenue);
      if (kpis[1]) kpis[1].textContent = F.num(k.orders);
      if (kpis[2]) kpis[2].textContent = F.brl(k.ticket);
      if (kpis[3]) kpis[3].textContent = F.num(k.customers);
      drawRevenue();
    });

    D.delegate(root, 'click', '[data-goto]', function (e, node) {
      location.hash = '#/admin/' + node.dataset.goto;
    });
    D.delegate(root, 'click', '[data-export]', function () { exportOrdersCSV(); });

    /* pedido */
    D.delegate(root, 'click', '[data-order]', function (e, node) {
      e.preventDefault();
      var id = node.dataset.order;
      var o = VT.seed.orders.filter(function (x) { return x.id === id || x.code === id; })[0];
      if (o) openOrder(o);
    });

    function drawRevenue() {
      var cv = root.querySelector('#chRevenue');
      if (!cv) return;
      var series = VT.seed.salesSeries(ADMIN.period);
      C.line(cv, {
        labels: series.map(function (s) { return s.label; }),
        series: [{ data: series.map(function (s) { return s.revenue; }), label: 'receita', hue: 245 }],
        format: function (v) { return v >= 1000 ? F.brlCompact(v).replace('R$ ', '') : F.brl(v).replace('R$ ', ''); }
      });
    }

    drawRevenue();

    var mix = VT.seed.paymentMix();
    var cvMix = root.querySelector('#chMix');
    if (cvMix) {
      C.donut(cvMix, {
        data: mix.map(function (m) { return { label: m.name, value: m.value, hue: m.hue }; }),
        centerLabel: 'em receita',
        centerFormat: function (t) { return F.brlCompact(t); }
      });
    }
    var cvFun = root.querySelector('#chFunnel');
    if (cvFun) C.funnel(cvFun, { data: VT.seed.funnel() });

    ensureOrderModal(root);
  }

  /* ============================================================
     PEDIDOS
     ============================================================ */
  function filteredOrders() {
    var q = ADMIN.ordSearch.toLowerCase();
    return VT.seed.orders.filter(function (o) {
      if (ADMIN.ordStatus && o.status !== ADMIN.ordStatus) return false;
      if (ADMIN.ordPay && o.payment !== ADMIN.ordPay) return false;
      if (q) {
        var hay = (o.code + ' ' + o.customerName + ' ' + o.customerEmail + ' ' + o.city).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).sort(function (a, b) {
      if (ADMIN.ordSort === 'total') return b.total - a.total;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  function ordersHTML() {
    var list = filteredOrders();
    var per = 12, pages = Math.max(1, Math.ceil(list.length / per));
    if (ADMIN.ordPage > pages) ADMIN.ordPage = pages;
    var slice = list.slice((ADMIN.ordPage - 1) * per, ADMIN.ordPage * per);
    var counts = { pending: 0, paid: 0, shipped: 0, delivered: 0, cancelled: 0 };
    VT.seed.orders.forEach(function (o) { counts[o.status]++; });

    return '<div class="ad-panel">' +
      '<div class="ad-toolbar">' +
        '<div class="segmented" id="statusFilter">' +
          '<button data-st=""' + (!ADMIN.ordStatus ? ' class="on"' : '') + '>Todos <b>' + VT.seed.orders.length + '</b></button>' +
          ['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map(function (s) {
            return '<button data-st="' + s + '"' + (ADMIN.ordStatus === s ? ' class="on"' : '') + '>' +
              esc(VT.payments.STATUS_LABEL[s].split(' ')[0]) + ' <b>' + counts[s] + '</b></button>';
          }).join('') +
        '</div>' +
        '<div class="spacer"></div>' +
        '<select class="select" id="payFilter" style="width:auto;height:38px;font-size:var(--fs-sm)">' +
          '<option value="">Todo pagamento</option>' +
          '<option value="pix"' + (ADMIN.ordPay === 'pix' ? ' selected' : '') + '>Pix</option>' +
          '<option value="card"' + (ADMIN.ordPay === 'card' ? ' selected' : '') + '>Cartão</option>' +
          '<option value="boleto"' + (ADMIN.ordPay === 'boleto' ? ' selected' : '') + '>Boleto</option>' +
        '</select>' +
        '<button class="btn btn-outline btn-sm" data-export="orders">' + VT.icons.get('download', 15) + ' CSV</button>' +
      '</div>' +
      (list.length
        ? '<div class="table-wrap"><table class="table ad-table">' +
          '<thead><tr>' +
            '<th class="sortable" data-sort="date">Pedido' + (ADMIN.ordSort === 'date' ? ' <span class="arw">↓</span>' : '') + '</th>' +
            '<th>Cliente</th><th>Itens</th><th>Pagamento</th><th>Status</th>' +
            '<th class="sortable num" data-sort="total">Total' + (ADMIN.ordSort === 'total' ? ' <span class="arw">↓</span>' : '') + '</th>' +
            '<th></th>' +
          '</tr></thead>' +
          '<tbody>' +
            slice.map(function (o) {
              return '<tr>' +
                '<td><a href="#" data-order="' + esc(o.id) + '" class="cell-main">' + esc(o.code) + '</a>' +
                  '<div class="cell-sub">' + esc(F.date(o.createdAt, { time: true })) + '</div></td>' +
                '<td><div class="row gap-2">' + U.avatar(o.customerName, null, 'avatar-sm') +
                  '<div><div class="cell-main">' + esc(o.customerName) + '</div>' +
                  '<div class="cell-sub">' + esc(o.city) + '/' + esc(o.state) + '</div></div></div></td>' +
                '<td><span class="small">' + o.items.length + ' ' + F.plural(o.items.length, 'item', 'itens') + '</span></td>' +
                '<td><span class="small">' + esc(VT.payments.PAY_LABEL[o.payment]) +
                  (o.installments > 1 ? '<div class="cell-sub">' + o.installments + 'x</div>' : '') + '</span></td>' +
                '<td>' + U.statusBadge(o.status) + '</td>' +
                '<td class="num strong">' + F.brl(o.total) + '</td>' +
                '<td><div class="table-actions">' +
                  '<button class="iconbtn" data-order="' + esc(o.id) + '" title="Ver detalhes">' + VT.icons.get('eye', 17) + '</button>' +
                  '</div></td>' +
                '</tr>';
            }).join('') +
          '</tbody></table></div>' + U.pager(ADMIN.ordPage, pages)
        : U.empty('receipt', 'Nenhum pedido encontrado', 'Ajuste os filtros ou limpe a busca.')) +
    '</div>';
  }

  function mountOrders(root) {
    D.delegate(root, 'click', '[data-st]', function (e, node) {
      ADMIN.ordStatus = node.dataset.st; ADMIN.ordPage = 1;
      VT.pages.admin.rerender();
    });
    var pf = root.querySelector('#payFilter');
    if (pf) pf.addEventListener('change', function () { ADMIN.ordPay = pf.value; ADMIN.ordPage = 1; VT.pages.admin.rerender(); });
    D.delegate(root, 'click', '[data-sort]', function (e, node) {
      ADMIN.ordSort = node.dataset.sort; VT.pages.admin.rerender();
    });
    var pager = root.querySelector('.pager');
    if (pager) {
      pager.addEventListener('click', function (e) {
        var b = e.target.closest('[data-page]');
        if (!b || b.disabled) return;
        ADMIN.ordPage = Number(b.dataset.page);
        VT.pages.admin.rerender();
      });
    }
    D.delegate(root, 'click', '[data-order]', function (e, node) {
      e.preventDefault();
      var o = VT.seed.orders.filter(function (x) { return x.id === node.dataset.order; })[0];
      if (o) openOrder(o);
    });
    D.delegate(root, 'click', '[data-export]', function () { exportOrdersCSV(); });
    ensureOrderModal(root);
  }

  function ensureOrderModal(root) { /* modal é global; nada a preparar */ }

  function openOrder(o) {
    var statusOpts = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    VT.modal.open({
      title: 'Pedido ' + o.code,
      sub: F.date(o.createdAt, { time: true }),
      size: 'lg',
      body:
        '<div class="grid-2 mb-5">' +
          '<div class="panel" style="box-shadow:none;padding:var(--sp-4)">' +
            '<div class="tiny muted mb-1">Cliente</div>' +
            '<div class="row gap-3">' + U.avatar(o.customerName, null) +
              '<div><div class="small strong">' + esc(o.customerName) + '</div>' +
              '<div class="tiny dim">' + esc(o.customerEmail) + '</div></div></div>' +
          '</div>' +
          '<div class="panel" style="box-shadow:none;padding:var(--sp-4)">' +
            '<div class="tiny muted mb-1">Entrega</div>' +
            '<div class="small">' + esc(o.city) + '/' + esc(o.state) + ' · ' + esc(o.items.length) + ' itens</div>' +
            '<div class="tiny dim mt-1">' + esc(VT.payments.PAY_LABEL[o.payment]) +
              (o.installments > 1 ? ' · ' + o.installments + 'x' : '') + '</div>' +
          '</div>' +
        '</div>' +
        '<h4 class="mb-3">Itens do pedido</h4>' +
        o.items.map(function (it) {
          return '<div class="row gap-3 mb-3">' +
            '<div style="width:52px;height:52px;border-radius:8px;overflow:hidden;flex:none">' +
              VT.art.product(it.art, it.hue) + '</div>' +
            '<div style="flex:1 1 auto;min-width:0"><div class="small strong trunc">' + esc(it.name) + '</div>' +
              '<div class="tiny dim">' + it.qty + ' x ' + F.brl(it.price) + (it.variant ? ' · ' + esc(it.variant.value) : '') + '</div></div>' +
            '<span class="small strong">' + F.brl(it.price * it.qty) + '</span>' +
            '</div>';
        }).join('') +
        '<div class="divider my-4"></div>' +
        '<div class="sum-line"><span>Produtos</span><span class="v">' + F.brl(o.subtotal) + '</span></div>' +
        (o.discount ? '<div class="sum-line disc"><span>Cupom ' + esc(o.coupon) + '</span><span class="v">− ' + F.brl(o.discount) + '</span></div>' : '') +
        '<div class="sum-line"><span>Frete</span><span class="v">' + (o.shipping ? F.brl(o.shipping) : 'grátis') + '</span></div>' +
        '<div class="sum-line big"><span>Total</span><span class="v">' + F.brl(o.total) + '</span></div>' +
        '<div class="divider my-4"></div>' +
        '<div class="field"><label>Alterar status</label>' +
          '<div class="row gap-2 wrap mt-2">' +
            statusOpts.map(function (s) {
              return '<button class="chip' + (o.status === s ? ' on' : '') + '" data-set-status="' + s + '">' +
                esc(VT.payments.STATUS_LABEL[s]) + '</button>';
            }).join('') +
          '</div>' +
        '</div>',
      footer:
        '<button class="btn btn-outline" data-print-order>' + VT.icons.get('printer', 16) + ' Imprimir</button>' +
        '<button class="btn btn-primary" data-close>Fechar</button>',
      onMount: function (node, close) {
        D.delegate(node, 'click', '[data-set-status]', function (e, b) {
          o.status = b.dataset.setStatus;
          if (o.status === 'delivered' && !o.deliveredAt) o.deliveredAt = new Date();
          D.qsa('[data-set-status]', node).forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          VT.toast.ok('Status atualizado', o.code + ' → ' + VT.payments.STATUS_LABEL[o.status]);
          setTimeout(function () { close(); VT.pages.admin.rerender && VT.pages.admin.rerender(); }, 400);
        });
        node.querySelector('[data-print-order]').addEventListener('click', function () { w.print(); });
      }
    });
  }

  function exportOrdersCSV() {
    var rows = [['Pedido', 'Data', 'Cliente', 'E-mail', 'Pagamento', 'Status', 'Itens', 'Subtotal', 'Desconto', 'Frete', 'Total']];
    filteredOrders().forEach(function (o) {
      rows.push([o.code, F.date(o.createdAt), o.customerName, o.customerEmail,
        VT.payments.PAY_LABEL[o.payment], VT.payments.STATUS_LABEL[o.status],
        o.items.length, o.subtotal, o.discount, o.shipping, o.total]);
    });
    downloadCSV('pedidos-vitrine.csv', rows);
    VT.toast.ok('CSV gerado', rows.length - 1 + ' pedidos exportados.');
  }

  function downloadCSV(filename, rows) {
    var csv = rows.map(function (r) {
      return r.map(function (c) {
        var v = String(c == null ? '' : c);
        return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(';');
    }).join('\n');
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ============================================================
     PRODUTOS
     ============================================================ */
  function filteredProducts() {
    var q = ADMIN.prodSearch.toLowerCase();
    var list = S.allProducts().filter(function (p) {
      if (ADMIN.prodCat && p.cat !== ADMIN.prodCat) return false;
      if (q) {
        var hay = (p.name + ' ' + p.brand + ' ' + p.id).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    var sorters = {
      name: function (a, b) { return a.name.localeCompare(b.name, 'pt-BR'); },
      price: function (a, b) { return b.price - a.price; },
      stock: function (a, b) { return a.stock - b.stock; },
      rating: function (a, b) { return b.rating - a.rating; },
      sales: function (a, b) { return b.reviews - a.reviews; }
    };
    return list.sort(sorters[ADMIN.prodSort] || sorters.name);
  }

  function productsHTML() {
    var list = filteredProducts();
    var per = 10, pages = Math.max(1, Math.ceil(list.length / per));
    if (ADMIN.prodPage > pages) ADMIN.prodPage = pages;
    var slice = list.slice((ADMIN.prodPage - 1) * per, ADMIN.prodPage * per);

    return '' +
      (ADMIN.prodSel.length
        ? '<div class="bulkbar">' +
            '<b>' + ADMIN.prodSel.length + '</b> ' + F.plural(ADMIN.prodSel.length, 'produto selecionado', 'produtos selecionados') +
            '<div style="flex:1 1 auto"></div>' +
            '<button class="btn btn-xs btn-outline" data-bulk="active">Ativar</button>' +
            '<button class="btn btn-xs btn-outline" data-bulk="stock">Zerar estoque</button>' +
            '<button class="btn btn-xs btn-danger" data-bulk="delete">Excluir</button>' +
            '<button class="btn btn-xs btn-ghost" data-bulk="clear">Limpar seleção</button>' +
          '</div>' : '') +

      '<div class="ad-panel">' +
        '<div class="ad-toolbar">' +
          '<select class="select" id="prodCatSel" style="width:auto;height:38px;font-size:var(--fs-sm)">' +
            '<option value="">Todas as categorias</option>' +
            VT.catalog.categories.map(function (c) {
              return '<option value="' + esc(c.id) + '"' + (ADMIN.prodCat === c.id ? ' selected' : '') + '>' +
                esc(c.name) + ' (' + c.count + ')</option>';
            }).join('') +
          '</select>' +
          '<select class="select" id="prodSortSel" style="width:auto;height:38px;font-size:var(--fs-sm)">' +
            [['name', 'Nome A–Z'], ['price', 'Maior preço'], ['stock', 'Menor estoque'],
             ['rating', 'Melhor avaliados'], ['sales', 'Mais vendidos']].map(function (s) {
              return '<option value="' + s[0] + '"' + (ADMIN.prodSort === s[0] ? ' selected' : '') + '>' + esc(s[1]) + '</option>';
            }).join('') +
          '</select>' +
          '<div class="spacer"></div>' +
          '<span class="tiny dim">' + list.length + ' produtos</span>' +
          '<button class="btn btn-outline btn-sm" data-export="products">' + VT.icons.get('download', 15) + ' CSV</button>' +
          '<button class="btn btn-primary btn-sm" data-new-product>' + VT.icons.get('plus', 15) + ' Novo produto</button>' +
        '</div>' +
        '<div class="table-wrap"><table class="table ad-table">' +
          '<thead><tr>' +
            '<th style="width:38px"><label class="check"><input type="checkbox" id="selAll"><span class="box">' +
              VT.icons.get('check', 12, { stroke: 3 }) + '</span></label></th>' +
            '<th>Produto</th><th>Categoria</th><th class="num">Preço</th><th>Estoque</th><th class="num">Avaliação</th><th></th>' +
          '</tr></thead>' +
          '<tbody>' +
            slice.map(function (p) {
              var cat = VT.catalog.catById[p.cat];
              return '<tr data-row="' + esc(p.id) + '">' +
                '<td><label class="check"><input type="checkbox" data-sel="' + esc(p.id) + '"' +
                  (ADMIN.prodSel.indexOf(p.id) !== -1 ? ' checked' : '') + '><span class="box">' +
                  VT.icons.get('check', 12, { stroke: 3 }) + '</span></label></td>' +
                '<td><div class="prod-cell">' +
                  '<div class="thumb">' + VT.art.product(p.art, p.hue) + '</div>' +
                  '<div><div class="nm">' + esc(p.name) + '</div>' +
                  '<div class="sk">' + esc(p.id.toUpperCase()) + ' · ' + esc(p.brand) + '</div></div></div></td>' +
                '<td><span class="small">' + esc(cat ? cat.emoji + ' ' + cat.name : p.cat) + '</span></td>' +
                '<td class="num"><div class="strong">' + F.brl(p.price) + '</div>' +
                  (p.old ? '<div class="cell-sub" style="text-decoration:line-through">' + F.brl(p.old) + '</div>' : '') + '</td>' +
                '<td>' + U.stockPill(p.stock) + '</td>' +
                '<td class="num"><span class="small">★ ' + String(p.rating).replace('.', ',') + '</span>' +
                  '<div class="cell-sub">' + F.num(p.reviews) + '</div></td>' +
                '<td><div class="table-actions">' +
                  '<button class="iconbtn" data-edit="' + esc(p.id) + '" title="Editar">' + VT.icons.get('edit', 16) + '</button>' +
                  '<button class="iconbtn" data-dup="' + esc(p.id) + '" title="Duplicar">' + VT.icons.get('copy', 16) + '</button>' +
                  '<button class="iconbtn" data-del="' + esc(p.id) + '" title="Excluir">' + VT.icons.get('trash', 16) + '</button>' +
                  '</div></td>' +
                '</tr>';
            }).join('') +
          '</tbody>' +
        '</table></div>' + U.pager(ADMIN.prodPage, pages) +
      '</div>';
  }

  function mountProducts(root) {
    var catSel = root.querySelector('#prodCatSel');
    var sortSel = root.querySelector('#prodSortSel');
    if (catSel) catSel.addEventListener('change', function () { ADMIN.prodCat = catSel.value; ADMIN.prodPage = 1; VT.pages.admin.rerender(); });
    if (sortSel) sortSel.addEventListener('change', function () { ADMIN.prodSort = sortSel.value; VT.pages.admin.rerender(); });

    var pager = root.querySelector('.pager');
    if (pager) pager.addEventListener('click', function (e) {
      var b = e.target.closest('[data-page]');
      if (!b || b.disabled) return;
      ADMIN.prodPage = Number(b.dataset.page);
      VT.pages.admin.rerender();
    });

    /* seleção */
    var selAll = root.querySelector('#selAll');
    if (selAll) selAll.addEventListener('change', function () {
      D.qsa('[data-sel]', root).forEach(function (c) {
        c.checked = selAll.checked;
        toggleSel(c.dataset.sel, selAll.checked);
      });
      VT.pages.admin.rerender();
    });
    D.delegate(root, 'change', '[data-sel]', function (e, node) {
      toggleSel(node.dataset.sel, node.checked);
      var n = ADMIN.prodSel.length;
      var bar = root.querySelector('.bulkbar');
      if ((n > 0) !== !!bar) { VT.pages.admin.rerender(); return; }
      if (bar) bar.querySelector('b').textContent = n;
    });
    function toggleSel(id, on) {
      var i = ADMIN.prodSel.indexOf(id);
      if (on && i === -1) ADMIN.prodSel.push(id);
      if (!on && i !== -1) ADMIN.prodSel.splice(i, 1);
    }

    D.delegate(root, 'click', '[data-bulk]', function (e, node) {
      var act = node.dataset.bulk;
      if (act === 'clear') { ADMIN.prodSel = []; VT.pages.admin.rerender(); return; }
      if (act === 'delete') {
        VT.modal.confirm({
          title: 'Excluir ' + ADMIN.prodSel.length + ' produtos?',
          message: 'Os produtos personalizados são removidos. Itens do catálogo original voltam ao estado padrão.',
          danger: true, okText: 'Excluir'
        }).then(function (ok) {
          if (!ok) return;
          ADMIN.prodSel.forEach(function (id) { S.deleteProduct(id); });
          ADMIN.prodSel = [];
          VT.toast.ok('Produtos excluídos');
          VT.pages.admin.rerender();
        });
        return;
      }
      ADMIN.prodSel.forEach(function (id) {
        var p = S.product(id);
        if (!p) return;
        S.upsertProduct({ id: id, stock: act === 'stock' ? 0 : p.stock });
      });
      VT.toast.ok(act === 'stock' ? 'Estoque zerado' : 'Produtos atualizados');
      ADMIN.prodSel = [];
      VT.pages.admin.rerender();
    });

    D.delegate(root, 'click', '[data-new-product]', function () { openProductEditor(null); });
    D.delegate(root, 'click', '[data-edit]', function (e, node) {
      var p = S.product(node.dataset.edit);
      if (p) openProductEditor(p);
    });
    D.delegate(root, 'click', '[data-dup]', function (e, node) {
      var p = S.product(node.dataset.dup);
      if (!p) return;
      var copy = Object.assign({}, p, {
        id: p.id + '-c' + Math.random().toString(36).slice(2, 5),
        name: p.name + ' (cópia)', stock: p.stock, custom: true
      });
      S.upsertProduct(copy);
      VT.toast.ok('Produto duplicado');
      VT.pages.admin.rerender();
    });
    D.delegate(root, 'click', '[data-del]', function (e, node) {
      var p = S.product(node.dataset.del);
      if (!p) return;
      VT.modal.confirm({ title: 'Excluir produto?', message: p.name, danger: true, okText: 'Excluir' })
        .then(function (ok) {
          if (!ok) return;
          S.deleteProduct(p.id);
          VT.toast.info('Produto excluído');
          VT.pages.admin.rerender();
        });
    });
    D.delegate(root, 'click', '[data-export]', function () {
      var rows = [['ID', 'Nome', 'Marca', 'Categoria', 'Preço', 'Preço antigo', 'Estoque', 'Avaliação']];
      filteredProducts().forEach(function (p) {
        rows.push([p.id.toUpperCase(), p.name, p.brand, p.cat, p.price, p.old, p.stock, p.rating]);
      });
      downloadCSV('produtos-vitrine.csv', rows);
      VT.toast.ok('CSV gerado', (rows.length - 1) + ' produtos exportados.');
    });
  }

  function openProductEditor(prod) {
    var isNew = !prod;
    var p = prod || {
      id: 'novo-' + Math.random().toString(36).slice(2, 6),
      name: '', brand: '', cat: 'audio', art: 'generic', hue: 245,
      price: 0, old: 0, stock: 10, rating: 5, reviews: 0,
      desc: '', specs: {}, tags: [], isNew: false, isBest: false, featured: false
    };

    VT.modal.open({
      title: isNew ? 'Novo produto' : 'Editar produto',
      sub: isNew ? 'Preencha os dados para publicar' : esc(p.name),
      size: 'lg',
      body:
        '<div class="tabs" style="margin-bottom:var(--sp-5)">' +
          '<button class="tab on" data-ptab="geral">Geral</button>' +
          '<button class="tab" data-ptab="precо" style="display:none"></button>' +
          '<button class="tab" data-ptab="preco">Preço & estoque</button>' +
          '<button class="tab" data-ptab="midia">Mídia</button>' +
          '<button class="tab" data-ptab="specs">Especificações</button>' +
        '</div>' +

        '<div data-ppanel="geral">' +
          '<div class="grid-form">' +
            '<div class="field col-12"><label>Nome do produto <span class="req">*</span></label>' +
              '<input class="input" id="pe_name" value="' + esc(p.name) + '" placeholder="Ex.: Fone Over-Ear Aurora ANC Pro"></div>' +
            '<div class="field col-6"><label>Marca <span class="req">*</span></label>' +
              '<input class="input" id="pe_brand" value="' + esc(p.brand) + '" placeholder="Ex.: Aurora"></div>' +
            '<div class="field col-6"><label>Categoria</label>' +
              '<select class="select" id="pe_cat">' +
                VT.catalog.categories.map(function (c) {
                  return '<option value="' + esc(c.id) + '"' + (p.cat === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>';
                }).join('') +
              '</select></div>' +
            '<div class="field col-12"><label>Descrição</label>' +
              '<textarea class="textarea" id="pe_desc" placeholder="Descreva o produto em um parágrafo">' + esc(p.desc) + '</textarea></div>' +
            '<div class="field col-12"><label>Tags (separadas por vírgula)</label>' +
              '<input class="input" id="pe_tags" value="' + esc((p.tags || []).join(', ')) + '" placeholder="premium, bluetooth"></div>' +
            '<div class="field col-12">' +
              '<div class="row gap-5 wrap">' +
                '<label class="check" style="align-items:center"><input type="checkbox" id="pe_new"' + (p.isNew ? ' checked' : '') + '>' +
                  '<span class="box">' + VT.icons.get('check', 12, { stroke: 3 }) + '</span><span class="small">Marcar como lançamento</span></label>' +
                '<label class="check" style="align-items:center"><input type="checkbox" id="pe_best"' + (p.isBest ? ' checked' : '') + '>' +
                  '<span class="box">' + VT.icons.get('check', 12, { stroke: 3 }) + '</span><span class="small">Mais vendido</span></label>' +
                '<label class="check" style="align-items:center"><input type="checkbox" id="pe_feat"' + (p.featured ? ' checked' : '') + '>' +
                  '<span class="box">' + VT.icons.get('check', 12, { stroke: 3 }) + '</span><span class="small">Destacar na home</span></label>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div data-ppanel="preco" hidden>' +
          '<div class="grid-form">' +
            '<div class="field col-4"><label>Preço de venda <span class="req">*</span></label>' +
              '<input class="input" id="pe_price" type="number" step="0.01" min="0" value="' + p.price + '"></div>' +
            '<div class="field col-4"><label>Preço "de" (opcional)</label>' +
              '<input class="input" id="pe_old" type="number" step="0.01" min="0" value="' + (p.old || 0) + '"></div>' +
            '<div class="field col-4"><label>Estoque <span class="req">*</span></label>' +
              '<input class="input" id="pe_stock" type="number" min="0" value="' + p.stock + '"></div>' +
            '<div class="field col-6"><label>Nota (avaliação)</label>' +
              '<input class="input" id="pe_rating" type="number" step="0.1" min="0" max="5" value="' + p.rating + '"></div>' +
            '<div class="field col-6"><label>Quantidade de avaliações</label>' +
              '<input class="input" id="pe_reviews" type="number" min="0" value="' + p.reviews + '"></div>' +
          '</div>' +
          '<div class="panel mt-4" style="padding:var(--sp-4);background:var(--surface-2);box-shadow:none">' +
            '<div class="tiny muted">Resumo da margem</div>' +
            '<div class="row-b mt-2"><span class="small">Preço final</span><b id="pe_final">' + F.brl(p.price) + '</b></div>' +
            '<div class="row-b mt-1"><span class="small">Desconto aparente</span><b id="pe_off">—</b></div>' +
            '<div class="row-b mt-1"><span class="small">No Pix (' + S.settings().pixDiscount + '% off)</span>' +
              '<b id="pe_pix">' + F.brl(p.price * (1 - S.settings().pixDiscount / 100)) + '</b></div>' +
          '</div>' +
        '</div>' +

        '<div data-ppanel="midia" hidden>' +
          '<div class="field mb-4"><label>Ilustração</label>' +
            '<div class="row gap-4 wrap">' +
              '<div style="width:150px;height:150px;border-radius:var(--r-lg);overflow:hidden;border:1px solid var(--line)" id="pe_preview">' +
                VT.art.product(p.art, p.hue) + '</div>' +
              '<div style="flex:1 1 220px;min-width:0">' +
                '<label class="lbl">Silhueta</label>' +
                '<select class="select mb-3" id="pe_art">' +
                  VT.art.silhouettes.map(function (s) {
                    return '<option value="' + s + '"' + (p.art === s ? ' selected' : '') + '>' + s + '</option>';
                  }).join('') +
                '</select>' +
                '<label class="lbl">Matiz da paleta: <b id="pe_huev">' + p.hue + '</b></label>' +
                '<input type="range" class="range" id="pe_hue" min="0" max="359" value="' + p.hue + '">' +
                '<div class="tiny dim mt-2">A arte é gerada em SVG — sem upload, sem peso na página.</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div data-ppanel="specs" hidden>' +
          '<div class="row-b mb-3"><span class="small muted">Pares de chave e valor exibidos na ficha técnica</span>' +
            '<button class="btn btn-xs btn-outline" data-add-spec>' + VT.icons.get('plus', 13) + ' Adicionar</button></div>' +
          '<div id="pe_specs">' +
            Object.keys(p.specs || {}).map(function (k) {
              return specRow(k, p.specs[k]);
            }).join('') +
          '</div>' +
        '</div>',

      footer:
        '<button class="btn btn-ghost" data-close>Cancelar</button>' +
        '<button class="btn btn-primary" data-save>' + VT.icons.get('save', 16) + ' Salvar produto</button>',

      onMount: function (node, close) {
        /* abas */
        D.delegate(node, 'click', '[data-ptab]', function (e, b) {
          D.qsa('[data-ptab]', node).forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          D.qsa('[data-ppanel]', node).forEach(function (pan) {
            pan.hidden = pan.dataset.ppanel !== b.dataset.ptab;
          });
        });

        /* preview de mídia */
        var artSel = node.querySelector('#pe_art'), hueIn = node.querySelector('#pe_hue');
        var preview = node.querySelector('#pe_preview'), hueVal = node.querySelector('#pe_huev');
        function paint() {
          preview.innerHTML = VT.art.product(artSel.value, Number(hueIn.value));
          hueVal.textContent = hueIn.value;
        }
        artSel.addEventListener('change', paint);
        hueIn.addEventListener('input', paint);

        /* resumo de preço */
        var priceIn = node.querySelector('#pe_price'), oldIn = node.querySelector('#pe_old');
        function paintPrice() {
          var v = Number(priceIn.value) || 0, o = Number(oldIn.value) || 0;
          node.querySelector('#pe_final').textContent = F.brl(v);
          node.querySelector('#pe_off').textContent = o > v ? F.discount(o, v) + '%' : '—';
          node.querySelector('#pe_pix').textContent = F.brl(v * (1 - S.settings().pixDiscount / 100));
        }
        priceIn.addEventListener('input', paintPrice);
        oldIn.addEventListener('input', paintPrice);

        /* especificações */
        D.delegate(node, 'click', '[data-add-spec]', function () {
          node.querySelector('#pe_specs').insertAdjacentHTML('beforeend', specRow('', ''));
        });
        D.delegate(node, 'click', '[data-rm-spec]', function (e, b) {
          b.closest('.spec-row').remove();
        });

        /* salvar */
        node.querySelector('[data-save]').addEventListener('click', function () {
          var name = node.querySelector('#pe_name').value.trim();
          var brand = node.querySelector('#pe_brand').value.trim();
          var price = Number(node.querySelector('#pe_price').value) || 0;
          if (name.length < 3) { VT.toast.err('Informe o nome do produto'); return; }
          if (!brand) { VT.toast.err('Informe a marca'); return; }
          if (price <= 0) { VT.toast.err('Informe um preço válido'); return; }

          var specs = {};
          D.qsa('.spec-row', node).forEach(function (r) {
            var k = r.querySelector('.sp-k').value.trim();
            var v = r.querySelector('.sp-v').value.trim();
            if (k) specs[k] = v;
          });

          S.upsertProduct({
            id: p.id,
            name: name,
            slug: F.slug(name),
            brand: brand,
            cat: node.querySelector('#pe_cat').value,
            desc: node.querySelector('#pe_desc').value.trim(),
            tags: node.querySelector('#pe_tags').value.split(',').map(function (t) { return t.trim(); }).filter(Boolean),
            price: price,
            old: Number(node.querySelector('#pe_old').value) || 0,
            stock: Number(node.querySelector('#pe_stock').value) || 0,
            rating: Number(node.querySelector('#pe_rating').value) || 5,
            reviews: Number(node.querySelector('#pe_reviews').value) || 0,
            art: artSel.value,
            hue: Number(hueIn.value),
            specs: specs,
            isNew: node.querySelector('#pe_new').checked,
            isBest: node.querySelector('#pe_best').checked,
            featured: node.querySelector('#pe_feat').checked,
            custom: true
          });
          close();
          VT.toast.ok(isNew ? 'Produto criado!' : 'Produto atualizado!');
          if (VT.pages.admin.rerender) VT.pages.admin.rerender();
        });
      }
    });

    function specRow(k, v) {
      return '<div class="spec-row">' +
        '<input class="input sp-k" value="' + esc(k) + '" placeholder="Ex.: Conectividade">' +
        '<input class="input sp-v" value="' + esc(v) + '" placeholder="Ex.: Bluetooth 5.3">' +
        '<button class="mini-remove" data-rm-spec>' + VT.icons.get('trash', 15) + '</button>' +
        '</div>';
    }
  }

  /* ============================================================
     CLIENTES
     ============================================================ */
  function customersHTML() {
    var q = ADMIN.cliSearch.toLowerCase();
    var list = VT.seed.customers.filter(function (c) {
      if (!q) return true;
      return (c.name + ' ' + c.email + ' ' + c.city).toLowerCase().indexOf(q) !== -1;
    }).sort(function (a, b) { return b.spent - a.spent; });
    var per = 10, pages = Math.max(1, Math.ceil(list.length / per));
    if (ADMIN.cliPage > pages) ADMIN.cliPage = pages;
    var slice = list.slice((ADMIN.cliPage - 1) * per, ADMIN.cliPage * per);
    var maxSpent = Math.max.apply(null, list.map(function (c) { return c.spent; })) || 1;

    return '<div class="kpi-grid mb-5" style="grid-template-columns:repeat(3,1fr)">' +
      U.kpi({ cls: 'kpi-1', label: 'Clientes cadastrados', value: F.num(list.length), icon: 'users', foot: 'base total' }) +
      U.kpi({ cls: 'kpi-2', label: 'Ticket médio', value: F.brl(list.reduce(function (s, c) { return s + c.ticket; }, 0) / Math.max(1, list.length)), icon: 'tag', foot: 'por cliente' }) +
      U.kpi({ cls: 'kpi-3', label: 'Receita vitalícia', value: F.brlCompact(list.reduce(function (s, c) { return s + c.spent; }, 0)), icon: 'money', foot: 'LTV acumulado' }) +
      '</div>' +

      '<div class="ad-panel">' +
        '<div class="ad-toolbar"><span class="tiny dim">' + list.length + ' clientes</span>' +
          '<div class="spacer"></div>' +
          '<button class="btn btn-outline btn-sm" data-export="customers">' + VT.icons.get('download', 15) + ' CSV</button>' +
        '</div>' +
        '<div class="table-wrap"><table class="table ad-table">' +
          '<thead><tr><th>Cliente</th><th>Localização</th><th class="num">Pedidos</th><th>Valor total</th><th class="num">Ticket</th><th></th></tr></thead>' +
          '<tbody>' +
            slice.map(function (c) {
              return '<tr>' +
                '<td><div class="row gap-3">' + U.avatar(c.name, c.avatarHue) +
                  '<div><div class="cell-main">' + esc(c.name) +
                    (c.tags.indexOf('VIP') !== -1 ? ' <span class="badge badge-brand">VIP</span>' : '') + '</div>' +
                  '<div class="cell-sub">' + esc(c.email) + '</div></div></div></td>' +
                '<td><span class="small">' + esc(c.city) + '/' + esc(c.state) + '</span></td>' +
                '<td class="num strong">' + c.orders + '</td>' +
                '<td style="min-width:150px">' +
                  '<div class="row gap-3"><div class="progress" style="flex:1 1 auto"><i style="width:' +
                    Math.round((c.spent / maxSpent) * 100) + '%"></i></div>' +
                  '<span class="small strong nowrap">' + F.brl(c.spent) + '</span></div>' +
                '</td>' +
                '<td class="num">' + F.brl(c.ticket) + '</td>' +
                '<td><div class="table-actions">' +
                  '<button class="iconbtn" data-customer="' + esc(c.id) + '" title="Ver perfil">' + VT.icons.get('eye', 17) + '</button>' +
                  '</div></td>' +
                '</tr>';
            }).join('') +
          '</tbody></table></div>' + U.pager(ADMIN.cliPage, pages) +
      '</div>';
  }

  function mountCustomers(root) {
    var pager = root.querySelector('.pager');
    if (pager) pager.addEventListener('click', function (e) {
      var b = e.target.closest('[data-page]');
      if (!b || b.disabled) return;
      ADMIN.cliPage = Number(b.dataset.page);
      VT.pages.admin.rerender();
    });
    D.delegate(root, 'click', '[data-customer]', function (e, node) {
      var c = VT.seed.customers.filter(function (x) { return x.id === node.dataset.customer; })[0];
      if (c) openCustomer(c);
    });
    D.delegate(root, 'click', '[data-export]', function () {
      var rows = [['Nome', 'E-mail', 'Telefone', 'Cidade', 'UF', 'Pedidos', 'Total', 'Ticket médio']];
      VT.seed.customers.forEach(function (c) {
        rows.push([c.name, c.email, c.phone, c.city, c.state, c.orders, c.spent, c.ticket]);
      });
      downloadCSV('clientes-vitrine.csv', rows);
      VT.toast.ok('CSV gerado');
    });
  }

  function openCustomer(c) {
    var orders = VT.seed.orders.filter(function (o) { return o.customerId === c.id; }).slice(0, 8);
    VT.modal.open({
      title: c.name,
      sub: c.email,
      body:
        '<div class="row gap-4 mb-5">' + U.avatar(c.name, c.avatarHue, 'avatar-lg') +
          '<div>' +
            '<div class="row gap-2 wrap">' +
              (c.tags.indexOf('VIP') !== -1 ? '<span class="badge badge-brand">VIP</span>' : '') +
              (c.tags.indexOf('Risco') !== -1 ? '<span class="badge badge-danger">Risco</span>' : '') +
              '<span class="badge badge-ok">' + c.orders + ' pedidos</span>' +
            '</div>' +
            '<div class="small muted mt-2">' + esc(c.phone) + ' · ' + esc(c.city) + '/' + esc(c.state) + ' · CEP ' + esc(c.cep) + '</div>' +
            '<div class="small muted">Cliente desde ' + F.date(c.createdAt, { long: true }) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="grid-3 mb-5">' +
          stat('Valor total', F.brl(c.spent)) +
          stat('Ticket médio', F.brl(c.ticket)) +
          stat('Último pedido', c.lastOrder ? F.date(c.lastOrder) : '—') +
        '</div>' +
        '<h4 class="mb-3">Últimos pedidos</h4>' +
        (orders.length
          ? orders.map(function (o) {
              return '<div class="row-b" style="padding:10px 0;border-bottom:1px solid var(--line)">' +
                '<div><div class="small strong">' + esc(o.code) + '</div>' +
                '<div class="tiny dim">' + F.date(o.createdAt) + '</div></div>' +
                '<div class="row gap-3">' + U.statusBadge(o.status) +
                '<span class="small strong">' + F.brl(o.total) + '</span></div>' +
                '</div>';
            }).join('')
          : '<div class="small muted">Nenhum pedido registrado.</div>'),
      footer: '<button class="btn btn-outline" data-mail>' + VT.icons.get('mail', 16) + ' Enviar e-mail</button>' +
        '<button class="btn btn-primary" data-close>Fechar</button>',
      onMount: function (node, close) {
        node.querySelector('[data-mail]').addEventListener('click', function () {
          VT.toast.info('E-mail de demonstração', 'Aqui abriria o composer para ' + c.email + '.');
        });
      }
    });
    function stat(label, value) {
      return '<div class="panel" style="box-shadow:none;padding:var(--sp-4)">' +
        '<div class="tiny muted">' + esc(label) + '</div>' +
        '<div class="strong" style="font-size:var(--fs-lg)">' + esc(value) + '</div></div>';
    }
  }

  /* ============================================================
     CUPONS
     ============================================================ */
  function couponsHTML() {
    return '<div class="ad-panel">' +
      '<div class="ad-toolbar">' +
        '<span class="tiny dim">' + VT.seed.coupons.length + ' cupons cadastrados</span>' +
        '<div class="spacer"></div>' +
        '<button class="btn btn-primary btn-sm" data-new-coupon>' + VT.icons.get('plus', 15) + ' Novo cupom</button>' +
      '</div>' +
      '<div class="table-wrap"><table class="table ad-table">' +
        '<thead><tr><th>Código</th><th>Tipo</th><th>Valor</th><th>Mínimo</th><th class="num">Usos</th><th>Status</th><th></th></tr></thead>' +
        '<tbody>' +
          VT.seed.coupons.map(function (c, i) {
            return '<tr>' +
              '<td><span class="mono strong">' + esc(c.code) + '</span>' +
                '<div class="cell-sub">' + esc(c.desc) + '</div></td>' +
              '<td><span class="small">' + (c.type === 'percent' ? 'Percentual' : (c.type === 'fixed' ? 'Valor fixo' : 'Frete')) + '</span></td>' +
              '<td class="strong">' + (c.type === 'percent' ? c.value + '%' : (c.type === 'fixed' ? F.brl(c.value) : 'Frete grátis')) + '</td>' +
              '<td><span class="small">' + (c.min ? F.brl(c.min) : '—') + '</span></td>' +
              '<td class="num">' + F.num(c.uses) + '</td>' +
              '<td>' + (c.active ? '<span class="badge badge-ok">Ativo</span>' : '<span class="badge badge-danger">Inativo</span>') + '</td>' +
              '<td><div class="table-actions">' +
                '<button class="iconbtn" data-coupon="' + i + '" title="Editar">' + VT.icons.get('edit', 16) + '</button>' +
                '<button class="iconbtn" data-coupon-del="' + i + '" title="Excluir">' + VT.icons.get('trash', 16) + '</button>' +
                '</div></td>' +
              '</tr>';
          }).join('') +
        '</tbody></table></div>' +
      '</div>' +
      '<div class="panel mt-4" style="padding:var(--sp-5)">' +
        '<div class="row gap-3">' +
          '<span style="color:var(--brand);display:grid">' + VT.icons.get('info', 20) + '</span>' +
          '<div class="small muted">Cupons são validados automaticamente no carrinho: percentual, valor fixo ou frete grátis. ' +
            'Defina um valor mínimo para proteger sua margem.</div>' +
        '</div>' +
      '</div>';
  }

  function mountCoupons(root) {
    D.delegate(root, 'click', '[data-new-coupon]', function () { openCouponEditor(null); });
    D.delegate(root, 'click', '[data-coupon]', function (e, node) {
      openCouponEditor(VT.seed.coupons[Number(node.dataset.coupon)]);
    });
    D.delegate(root, 'click', '[data-coupon-del]', function (e, node) {
      var i = Number(node.dataset.couponDel);
      var c = VT.seed.coupons[i];
      VT.modal.confirm({ title: 'Excluir cupom ' + c.code + '?', danger: true, okText: 'Excluir' })
        .then(function (ok) {
          if (!ok) return;
          VT.seed.coupons.splice(i, 1);
          VT.toast.info('Cupom excluído');
          VT.pages.admin.rerender();
        });
    });
  }

  function openCouponEditor(c) {
    var isNew = !c;
    c = c || { code: '', type: 'percent', value: 10, min: 0, active: true, uses: 0, desc: '' };
    VT.modal.open({
      title: isNew ? 'Novo cupom' : 'Editar ' + c.code,
      body:
        '<div class="grid-form">' +
          '<div class="field col-6"><label>Código <span class="req">*</span></label>' +
            '<input class="input" id="cp_code" value="' + esc(c.code) + '" placeholder="PRIMAVERA20" style="text-transform:uppercase"></div>' +
          '<div class="field col-6"><label>Tipo</label>' +
            '<select class="select" id="cp_type">' +
              '<option value="percent"' + (c.type === 'percent' ? ' selected' : '') + '>Percentual</option>' +
              '<option value="fixed"' + (c.type === 'fixed' ? ' selected' : '') + '>Valor fixo</option>' +
              '<option value="shipping"' + (c.type === 'shipping' ? ' selected' : '') + '>Frete grátis</option>' +
            '</select></div>' +
          '<div class="field col-6"><label>Valor</label>' +
            '<input class="input" type="number" step="0.01" id="cp_value" value="' + c.value + '"></div>' +
          '<div class="field col-6"><label>Compra mínima</label>' +
            '<input class="input" type="number" step="0.01" id="cp_min" value="' + c.min + '"></div>' +
          '<div class="field col-12"><label>Descrição interna</label>' +
            '<input class="input" id="cp_desc" value="' + esc(c.desc) + '" placeholder="Campanha de lançamento"></div>' +
          '<div class="field col-12">' +
            '<label class="switch"><input type="checkbox" id="cp_active"' + (c.active ? ' checked' : '') + '>' +
              '<span class="track"></span><span class="small">Cupom ativo</span></label>' +
          '</div>' +
        '</div>',
      footer: '<button class="btn btn-ghost" data-close>Cancelar</button>' +
        '<button class="btn btn-primary" data-save>Salvar cupom</button>',
      onMount: function (node, close) {
        node.querySelector('[data-save]').addEventListener('click', function () {
          var code = node.querySelector('#cp_code').value.trim().toUpperCase();
          if (code.length < 3) { VT.toast.err('Código muito curto'); return; }
          var obj = {
            code: code,
            type: node.querySelector('#cp_type').value,
            value: Number(node.querySelector('#cp_value').value) || 0,
            min: Number(node.querySelector('#cp_min').value) || 0,
            active: node.querySelector('#cp_active').checked,
            uses: c.uses || 0,
            desc: node.querySelector('#cp_desc').value.trim()
          };
          var idx = VT.seed.coupons.findIndex(function (x) { return x.code === c.code; });
          if (isNew) VT.seed.coupons.unshift(obj);
          else if (idx !== -1) VT.seed.coupons[idx] = obj;
          close();
          VT.toast.ok(isNew ? 'Cupom criado!' : 'Cupom atualizado!');
          if (VT.pages.admin.rerender) VT.pages.admin.rerender();
        });
      }
    });
  }

  /* ============================================================
     RELATÓRIOS
     ============================================================ */
  function reportsHTML() {
    var cat = VT.seed.categoryRevenue();
    var top = VT.seed.topProducts(8);
    var mix = VT.seed.paymentMix();
    var funnel = VT.seed.funnel();
    var topCust = VT.seed.customers.slice().sort(function (a, b) { return b.spent - a.spent; }).slice(0, 6);
    var k = VT.seed.kpis(ADMIN.repPeriod);

    return '<div class="row-b wrap gap-3 mb-5">' +
        '<div class="segmented" id="repPeriod">' +
          [7, 30, 90, 365].map(function (d) {
            return '<button data-rep="' + d + '"' + (ADMIN.repPeriod === d ? ' class="on"' : '') + '>' +
              (d === 365 ? '12 meses' : d + ' dias') + '</button>';
          }).join('') +
        '</div>' +
        '<div class="row gap-2">' +
          '<button class="btn btn-outline btn-sm" data-rep-export>' + VT.icons.get('download', 15) + ' Exportar relatório</button>' +
        '</div>' +
      '</div>' +

      '<div class="kpi-grid mb-5" style="grid-template-columns:repeat(4,1fr)">' +
        U.kpi({ cls: 'kpi-1', label: 'Receita', value: F.brl(k.revenue), icon: 'money', delta: k.revenueDelta }) +
        U.kpi({ cls: 'kpi-2', label: 'Pedidos', value: F.num(k.orders), icon: 'receipt', delta: k.ordersDelta }) +
        U.kpi({ cls: 'kpi-3', label: 'Ticket médio', value: F.brl(k.ticket), icon: 'tag', delta: k.ticketDelta }) +
        U.kpi({ cls: 'kpi-4', label: 'Itens vendidos', value: F.num(k.items), icon: 'package', delta: 12.1 }) +
      '</div>' +

      '<div class="chart-grid mb-4">' +
        '<div class="ad-panel">' +
          '<div class="ad-panel-head"><h3>Receita por categoria</h3></div>' +
          '<div class="ad-panel-body"><div class="chart-box"><canvas id="rpCat"></canvas></div></div>' +
        '</div>' +
        '<div class="ad-panel">' +
          '<div class="ad-panel-head"><h3>Pagamentos</h3></div>' +
          '<div class="ad-panel-body"><div class="chart-box" style="height:230px"><canvas id="rpMix"></canvas></div>' +
            '<div class="col gap-2 mt-4">' +
              mix.map(function (m) {
                var total = mix.reduce(function (s, x) { return s + x.value; }, 0) || 1;
                return '<div class="row-b"><div class="row gap-2">' +
                  '<i class="sw" style="width:10px;height:10px;border-radius:3px;background:hsl(' + m.hue + ' 74% 52%)"></i>' +
                  '<span class="small">' + esc(m.name) + '</span></div>' +
                  '<span class="small strong">' + F.brlCompact(m.value) + ' · ' + F.pct(m.value / total * 100, 0) + '</span></div>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="grid-2 mb-4">' +
        '<div class="ad-panel">' +
          '<div class="ad-panel-head"><h3>Funil de conversão</h3></div>' +
          '<div class="ad-panel-body"><div class="chart-box" style="height:280px"><canvas id="rpFunnel"></canvas></div></div>' +
        '</div>' +
        '<div class="ad-panel">' +
          '<div class="ad-panel-head"><h3>Produtos campeões</h3></div>' +
          '<div class="ad-list">' +
            top.map(function (t, i) {
              return '<div class="ad-list-row">' +
                '<span class="rk' + (i === 0 ? ' top' : '') + '">' + (i + 1) + '</span>' +
                '<div class="thumb">' + VT.art.product(t.product.art, t.product.hue) + '</div>' +
                '<div class="nm"><div class="t trunc">' + esc(t.product.name) + '</div>' +
                  '<div class="s">' + t.qty + ' un.</div></div>' +
                '<span class="vl">' + F.brlCompact(t.revenue) + '</span>' +
                '</div>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="ad-panel">' +
        '<div class="ad-panel-head"><h3>Melhores clientes</h3></div>' +
        '<div class="table-wrap"><table class="table ad-table">' +
          '<thead><tr><th>Cliente</th><th>Cidade</th><th class="num">Pedidos</th><th>Valor total</th><th class="num">Ticket</th></tr></thead>' +
          '<tbody>' +
            topCust.map(function (c) {
              return '<tr>' +
                '<td><div class="row gap-3">' + U.avatar(c.name, c.avatarHue, 'avatar-sm') +
                  '<div><div class="cell-main">' + esc(c.name) + '</div>' +
                  '<div class="cell-sub">' + esc(c.email) + '</div></div></div></td>' +
                '<td><span class="small">' + esc(c.city) + '/' + esc(c.state) + '</span></td>' +
                '<td class="num">' + c.orders + '</td>' +
                '<td class="strong">' + F.brl(c.spent) + '</td>' +
                '<td class="num">' + F.brl(c.ticket) + '</td>' +
                '</tr>';
            }).join('') +
          '</tbody></table></div>' +
      '</div>';
  }

  function mountReports(root) {
    D.delegate(root, 'click', '[data-rep]', function (e, node) {
      ADMIN.repPeriod = Number(node.dataset.rep);
      D.qsa('[data-rep]', root).forEach(function (b) { b.classList.toggle('on', b.dataset.rep === String(ADMIN.repPeriod)); });
      var k = VT.seed.kpis(ADMIN.repPeriod);
      var kvs = D.qsa('.kpi .kv', root);
      if (kvs[0]) kvs[0].textContent = F.brl(k.revenue);
      if (kvs[1]) kvs[1].textContent = F.num(k.orders);
      if (kvs[2]) kvs[2].textContent = F.brl(k.ticket);
      if (kvs[3]) kvs[3].textContent = F.num(k.items);
    });

    var catCv = root.querySelector('#rpCat');
    if (catCv) {
      C.bars(catCv, {
        data: VT.seed.categoryRevenue().slice(0, 8).map(function (c) {
          return { label: c.emoji + ' ' + c.name.split(' ')[0], value: c.value, hue: c.hue };
        }),
        format: function (v) { return F.brlCompact(v).replace('R$ ', ''); }
      });
    }
    var mixCv = root.querySelector('#rpMix');
    if (mixCv) {
      C.donut(mixCv, {
        data: VT.seed.paymentMix().map(function (m) { return { label: m.name, value: m.value, hue: m.hue }; }),
        centerLabel: 'receita'
      });
    }
    var funCv = root.querySelector('#rpFunnel');
    if (funCv) C.funnel(funCv, { data: VT.seed.funnel() });

    D.delegate(root, 'click', '[data-rep-export]', function () {
      var k = VT.seed.kpis(ADMIN.repPeriod);
      var rows = [['Relatório Vitrine — ' + F.date(new Date())], ['Período (dias)', ADMIN.repPeriod],
        [], ['Métrica', 'Valor'], ['Receita', F.brl(k.revenue)], ['Pedidos', k.orders],
        ['Ticket médio', F.brl(k.ticket)], ['Clientes', k.customers], ['Itens vendidos', k.items],
        [], ['Categoria', 'Receita']];
      VT.seed.categoryRevenue().forEach(function (c) { rows.push([c.name, F.brl(c.value)]); });
      rows.push([], ['Produto', 'Quantidade', 'Receita']);
      VT.seed.topProducts(10).forEach(function (t) { rows.push([t.product.name, t.qty, F.brl(t.revenue)]); });
      downloadCSV('relatorio-vitrine.csv', rows);
      VT.toast.ok('Relatório exportado');
    });
  }

  /* ============================================================
     CONFIGURAÇÕES
     ============================================================ */
  function settingsHTML() {
    var cfg = S.settings();
    var presets = [245, 210, 160, 130, 20, 340, 280, 0];
    return '<div class="ad-panel">' +
        '<div class="ad-panel-head"><h3>' + VT.icons.get('store', 18) + ' Dados da loja</h3></div>' +
        '<div class="ad-panel-body">' +
          '<div class="grid-form">' +
            '<div class="field col-6"><label>Nome da loja</label>' +
              '<input class="input" id="st_name" value="' + esc(cfg.storeName) + '"></div>' +
            '<div class="field col-6"><label>Slogan</label>' +
              '<input class="input" id="st_tag" value="' + esc(cfg.tagline) + '"></div>' +
            '<div class="field col-6"><label>E-mail de atendimento</label>' +
              '<input class="input" type="email" id="st_mail" value="' + esc(cfg.supportEmail) + '"></div>' +
            '<div class="field col-6"><label>WhatsApp</label>' +
              '<input class="input" id="st_wpp" value="' + esc(cfg.whatsapp) + '"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="ad-panel">' +
        '<div class="ad-panel-head"><h3>' + VT.icons.get('card', 18) + ' Pagamentos</h3></div>' +
        '<div class="ad-panel-body">' +
          '<div class="setting-row">' +
            '<div><div class="sr-t">Chave Pix</div><div class="sr-d">E-mail, CPF, CNPJ ou chave aleatória</div></div>' +
            '<input class="input" id="st_pix" value="' + esc(cfg.pixKey) + '" style="max-width:280px">' +
          '</div>' +
          '<div class="setting-row">' +
            '<div><div class="sr-t">Desconto no Pix</div><div class="sr-d">Aplicado automaticamente sobre o total</div></div>' +
            '<div class="row gap-2 sr-c"><input class="input" type="number" id="st_pixd" value="' + cfg.pixDiscount + '" min="0" max="30" step="0.5" style="width:100px"><span class="small">%</span></div>' +
          '</div>' +
          '<div class="setting-row">' +
            '<div><div class="sr-t">Parcelamento máximo</div><div class="sr-d">Quantidade de vezes exibida no checkout</div></div>' +
            '<select class="select" id="st_inst" style="width:auto">' +
              [1, 3, 6, 10, 12].map(function (n) {
                return '<option value="' + n + '"' + (cfg.instMax === n ? ' selected' : '') + '>' + n + 'x</option>';
              }).join('') +
            '</select>' +
          '</div>' +
          '<div class="setting-row">' +
            '<div><div class="sr-t">Parcelas sem juros</div><div class="sr-d">As demais recebem a taxa mensal abaixo</div></div>' +
            '<select class="select" id="st_instf" style="width:auto">' +
              [1, 2, 3, 6, 10, 12].map(function (n) {
                return '<option value="' + n + '"' + (cfg.instFree === n ? ' selected' : '') + '>' + n + 'x</option>';
              }).join('') +
            '</select>' +
          '</div>' +
          '<div class="setting-row">' +
            '<div><div class="sr-t">Taxa de juros ao mês</div><div class="sr-d">Aplicada nas parcelas com juros</div></div>' +
            '<div class="row gap-2 sr-c"><input class="input" type="number" id="st_rate" value="' + cfg.instRate + '" min="0" max="15" step="0.01" style="width:110px"><span class="small">% a.m.</span></div>' +
          '</div>' +
          '<div class="setting-row">' +
            '<div><div class="sr-t">Meios habilitados</div><div class="sr-d">Desative o que não quer oferecer</div></div>' +
            '<div class="row gap-4 sr-c">' +
              ['pix', 'card', 'boleto'].map(function (m) {
                return '<label class="check" style="align-items:center"><input type="checkbox" data-method="' + m + '"' +
                  (cfg.methods[m] !== false ? ' checked' : '') + '><span class="box">' +
                  VT.icons.get('check', 12, { stroke: 3 }) + '</span><span class="small">' +
                  esc(VT.payments.PAY_LABEL[m]) + '</span></label>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="ad-panel">' +
        '<div class="ad-panel-head"><h3>' + VT.icons.get('truck', 18) + ' Frete e impostos</h3></div>' +
        '<div class="ad-panel-body">' +
          '<div class="setting-row">' +
            '<div><div class="sr-t">Frete grátis a partir de</div><div class="sr-d">Valor do carrinho que libera o frete grátis</div></div>' +
            '<input class="input" type="number" id="st_free" value="' + cfg.freeShipFrom + '" step="1" min="0" style="max-width:160px">' +
          '</div>' +
          '<div class="setting-row">' +
            '<div><div class="sr-t">Valor base do frete</div><div class="sr-d">Multiplicado pela região de entrega</div></div>' +
            '<input class="input" type="number" id="st_ship" value="' + cfg.shipBase + '" step="0.1" min="0" style="max-width:160px">' +
          '</div>' +
          '<div class="setting-row">' +
            '<div><div class="sr-t">Imposto sobre a venda</div><div class="sr-d">Percentual adicionado no total</div></div>' +
            '<div class="row gap-2 sr-c"><input class="input" type="number" id="st_tax" value="' + cfg.taxPercent + '" step="0.1" min="0" style="width:110px"><span class="small">%</span></div>' +
          '</div>' +
          '<div class="setting-row">' +
            '<div><div class="sr-t">Alerta de estoque baixo</div><div class="sr-d">Aparece no painel quando chegar nesse nível</div></div>' +
            '<input class="input" type="number" id="st_alert" value="' + cfg.stockAlert + '" min="1" max="100" style="max-width:160px">' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="ad-panel">' +
        '<div class="ad-panel-head"><h3>' + VT.icons.get('palette', 18) + ' Aparência</h3></div>' +
        '<div class="ad-panel-body">' +
          '<div class="setting-row">' +
            '<div><div class="sr-t">Cor da marca</div><div class="sr-d">Aplicada em toda a loja e no painel</div></div>' +
            '<div class="col gap-2 sr-c" style="align-items:flex-end">' +
              '<div class="color-presets" id="st_presets">' +
                presets.map(function (h) {
                  return '<button class="color-preset' + (S.get('brandHue') === h ? ' on' : '') + '" data-hue="' + h + '"' +
                    ' style="background:hsl(' + h + ' 78% 55%)" aria-label="Cor ' + h + '"></button>';
                }).join('') +
              '</div>' +
              '<input type="range" class="range" id="st_hue" min="0" max="359" value="' + S.get('brandHue') + '" style="width:200px">' +
            '</div>' +
          '</div>' +
          '<div class="setting-row">' +
            '<div><div class="sr-t">Tema</div><div class="sr-d">Claro ou escuro</div></div>' +
            '<div class="segmented sr-c">' +
              '<button data-theme-set="light"' + (S.get('theme') === 'light' ? ' class="on"' : '') + '>' +
                VT.icons.get('sun', 15) + ' Claro</button>' +
              '<button data-theme-set="dark"' + (S.get('theme') === 'dark' ? ' class="on"' : '') + '>' +
                VT.icons.get('moon', 15) + ' Escuro</button>' +
            '</div>' +
          '</div>' +
          '<div class="setting-row">' +
            '<div><div class="sr-t">Avaliações de clientes</div><div class="sr-d">Exibe notas e comentários nos produtos</div></div>' +
            '<label class="switch sr-c"><input type="checkbox" id="st_reviews"' + (cfg.reviews ? ' checked' : '') + '><span class="track"></span></label>' +
          '</div>' +
          '<div class="setting-row">' +
            '<div><div class="sr-t">Loja em manutenção</div><div class="sr-d">Mostra um aviso em vez da vitrine</div></div>' +
            '<label class="switch sr-c"><input type="checkbox" id="st_maint"' + (cfg.maintenance ? ' checked' : '') + '><span class="track"></span></label>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="ad-panel">' +
        '<div class="ad-panel-head"><h3>' + VT.icons.get('database', 18) + ' Dados</h3></div>' +
        '<div class="ad-panel-body">' +
          '<div class="setting-row">' +
            '<div><div class="sr-t">Exportar tudo</div><div class="sr-d">Gera um arquivo JSON com catálogo, pedidos e clientes</div></div>' +
            '<button class="btn btn-outline btn-sm" data-export-all>' + VT.icons.get('download', 15) + ' Exportar JSON</button>' +
          '</div>' +
          '<div class="setting-row">' +
            '<div><div class="sr-t">Restaurar padrões</div><div class="sr-d">Volta tema, marca e configurações ao original</div></div>' +
            '<button class="btn btn-outline btn-sm" data-reset-cfg>Restaurar</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="danger-zone mt-4">' +
        '<h4>Zona de risco</h4>' +
        '<p>Apaga carrinho, favoritos, pedidos locais, endereços e todas as personalizações feitas nesta instalação.</p>' +
        '<button class="btn btn-danger btn-sm" data-reset-all>' + VT.icons.get('alertTri', 15) + ' Limpar todos os dados</button>' +
      '</div>';
  }

  function mountSettings(root) {
    var cfg = S.settings();
    function bind(sel, path, parse) {
      var el = root.querySelector(sel);
      if (!el) return;
      var evt = el.type === 'checkbox' ? 'change' : 'input';
      el.addEventListener(evt, function () {
        var v = el.type === 'checkbox' ? el.checked : (parse === Number ? Number(el.value) : el.value);
        S.set(path, v);
        if (path.indexOf('settings') === 0) cfg = S.settings();
      });
    }
    bind('#st_name', 'settings.storeName');
    bind('#st_tag', 'settings.tagline');
    bind('#st_mail', 'settings.supportEmail');
    bind('#st_wpp', 'settings.whatsapp');
    bind('#st_pix', 'settings.pixKey');
    bind('#st_pixd', 'settings.pixDiscount', Number);
    bind('#st_inst', 'settings.instMax', Number);
    bind('#st_instf', 'settings.instFree', Number);
    bind('#st_rate', 'settings.instRate', Number);
    bind('#st_free', 'settings.freeShipFrom', Number);
    bind('#st_ship', 'settings.shipBase', Number);
    bind('#st_tax', 'settings.taxPercent', Number);
    bind('#st_alert', 'settings.stockAlert', Number);
    bind('#st_reviews', 'settings.reviews');
    bind('#st_maint', 'settings.maintenance');

    D.delegate(root, 'change', '[data-method]', function (e, node) {
      var m = Object.assign({}, S.settings().methods);
      m[node.dataset.method] = node.checked;
      S.set('settings.methods', m);
    });

    /* cor da marca */
    var hueIn = root.querySelector('#st_hue');
    if (hueIn) {
      hueIn.addEventListener('input', function () {
        S.set('brandHue', Number(hueIn.value));
        S.applyTheme();
        D.qsa('.color-preset', root).forEach(function (b) {
          b.classList.toggle('on', Number(b.dataset.hue) === Number(hueIn.value));
        });
      });
    }
    D.delegate(root, 'click', '[data-hue]', function (e, node) {
      var h = Number(node.dataset.hue);
      S.set('brandHue', h);
      S.applyTheme();
      hueIn.value = h;
      D.qsa('.color-preset', root).forEach(function (b) { b.classList.toggle('on', Number(b.dataset.hue) === h); });
      setTimeout(C.refresh, 60);
    });

    /* tema */
    D.delegate(root, 'click', '[data-theme-set]', function (e, node) {
      S.set('theme', node.dataset.themeSet);
      S.applyTheme();
      D.qsa('[data-theme-set]', root).forEach(function (b) { b.classList.toggle('on', b.dataset.themeSet === node.dataset.themeSet); });
      setTimeout(C.refresh, 80);
    });

    /* dados */
    D.delegate(root, 'click', '[data-export-all]', function () {
      var payload = {
        exportedAt: new Date().toISOString(),
        settings: S.settings(),
        products: S.allProducts(),
        orders: VT.seed.orders,
        customers: VT.seed.customers,
        coupons: VT.seed.coupons
      };
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'vitrine-dados.json';
      document.body.appendChild(a); a.click(); a.remove();
      VT.toast.ok('Backup gerado', 'vitrine-dados.json baixado.');
    });
    D.delegate(root, 'click', '[data-reset-cfg]', function () {
      VT.modal.confirm({ title: 'Restaurar configurações?', message: 'Tema, cor, frete e pagamentos voltam ao padrão.' })
        .then(function (ok) {
          if (!ok) return;
          var theme = S.get('theme');
          S.set('settings', {
            storeName: 'Vitrine', tagline: 'Tudo que você precisa, em um só lugar',
            supportEmail: 'contato@vitrine.com', whatsapp: '(34) 99999-0000',
            pixKey: 'loja@vitrine.com', pixDiscount: 5, freeShipFrom: 299, shipBase: 24.9,
            taxPercent: 0, instMax: 12, instFree: 6, instRate: 1.99,
            methods: { pix: true, card: true, boleto: true }, maintenance: false,
            newsletter: true, reviews: true, stockAlert: 5
          });
          S.set('brandHue', 245);
          S.set('theme', theme);
          S.applyTheme();
          VT.toast.ok('Configurações restauradas');
          VT.pages.admin.rerender();
        });
    });
    D.delegate(root, 'click', '[data-reset-all]', function () {
      VT.modal.confirm({
        title: 'Apagar todos os dados?',
        message: 'Carrinho, favoritos, pedidos e personalizações serão perdidos nesta instalação.',
        okText: 'Apagar tudo', danger: true
      }).then(function (ok) {
        if (!ok) return;
        S.reset(false);
        S.applyTheme();
        VT.toast.info('Dados apagados');
        location.hash = '#/';
      });
    });
  }
})(window);
