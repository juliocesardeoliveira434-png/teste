/* ============================================================
   VITRINE PRO — app.js
   Router, shell (header/footer/tabbar), gaveta do carrinho,
   busca em palette, atalhos de teclado e boot da aplicação.
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};
  var F = VT.format, D = VT.dom, S = VT.store, U = VT.ui;
  var esc = D.esc;

  /* ============================================================
     ROUTER
     ============================================================ */
  var ROUTES = [
    { re: /^\/?$/, page: 'home', params: function () { return {}; } },
    { re: /^\/categoria$/, page: 'catalog', params: queryParams },
    { re: /^\/produto\/([\w-]+)$/, page: 'product', params: function (m) { return { slug: m[1] }; } },
    { re: /^\/carrinho$/, page: 'cart', params: function () { return {}; } },
    { re: /^\/checkout$/, page: 'checkout', params: function () { return {}; } },
    { re: /^\/pedido\/([\w-]+)$/, page: 'order', params: function (m) { return { code: m[1] }; } },
    { re: /^\/conta$/, page: 'account', params: function () { return { section: '' }; } },
    { re: /^\/conta\/([\w-]+)$/, page: 'account', params: function (m) { return { section: m[1] }; } },
    { re: /^\/planos$/, page: 'plans', params: function () { return {}; } },
    { re: /^\/institucional\/([\w-]+)$/, page: 'institutional', params: function (m) { return { page: m[1] }; } },
    { re: /^\/admin$/, page: 'admin', params: function () { return { section: 'dashboard' }; } },
    { re: /^\/admin\/([\w-]+)$/, page: 'admin', params: function (m) { return { section: m[1] }; } }
  ];

  function queryParams() {
    var raw = location.hash.split('?')[1] || '';
    var out = {};
    raw.split('&').forEach(function (pair) {
      if (!pair) return;
      var kv = pair.split('=');
      out[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' '));
    });
    return out;
  }

  var Router = {
    current: null,
    currentPath: null,

    path: function () {
      var h = location.hash.replace(/^#/, '') || '/';
      return h.split('?')[0];
    },

    resolve: function () {
      var path = this.path();
      var i, m;
      for (i = 0; i < ROUTES.length; i++) {
        m = path.match(ROUTES[i].re);
        if (m) {
          return { page: VT.pages[ROUTES[i].page], name: ROUTES[i].page, params: ROUTES[i].params(m) };
        }
      }
      return { page: null, name: '404', params: {} };
    },

    /**
     * Troca o #view por um nó novo: assim nenhum listener preso ao
     * container sobrevive à navegação (evita handlers duplicados).
     */
    freshView: function () {
      var old = D.byId('view');
      var neo = document.createElement('main');
      neo.id = 'view';
      neo.tabIndex = -1;
      neo.className = old.className;
      old.parentNode.replaceChild(neo, old);
      return neo;
    },

    go: function (opts) {
      opts = opts || {};
      var r = this.resolve();
      var view = this.freshView();
      var prevPage = this.current;

      /* desmonta a página anterior */
      if (prevPage && typeof prevPage.unmount === 'function') {
        try { prevPage.unmount(view, this.currentPath); } catch (e) { console.warn(e); }
      }
      /* avisa a página de destino sobre novos parâmetros */
      if (r.page && typeof r.page.onParams === 'function') {
        try { r.page.onParams(r.params); } catch (e) {}
      }

      var html;
      try {
        html = r.page ? r.page.render(r.params) : notFoundHTML();
      } catch (e) {
        console.error('[router] erro ao renderizar', r.name, e);
        html = errorHTML(e);
      }

      view.innerHTML = html;
      document.title = (r.page && r.page.title) ? r.page.title : 'Vitrine';
      this.current = r.page;
      this.currentPath = r.name + '|' + this.path();

      /* admin muda o layout do body */
      document.body.classList.toggle('is-admin', r.name === 'admin');

      VT.icons.fill(view);
      D.observeReveal(view);
      if (VT.charts) setTimeout(VT.charts.refresh, 40);

      if (r.page && typeof r.page.mount === 'function') {
        try { r.page.mount(view, r.params); } catch (e) { console.error('[router] erro no mount', e); }
      }

      if (opts.scroll !== false) {
        if (r.name === 'admin') w.scrollTo(0, 0);
        else w.scrollTo({ top: 0, behavior: opts.smooth === false ? 'auto' : 'smooth' });
      }
      if (opts.focus !== false) {
        try { view.focus({ preventScroll: true }); } catch (e) {}
      }
      syncHeader();
    },

    /** Recarrega a rota atual (usado por etapas do checkout). */
    reload: function () { this.go({ scroll: false, focus: false, smooth: false }); }
  };

  function notFoundHTML() {
    return '<div class="shell section">' +
      U.empty('alertTri', 'Página não encontrada',
        'O endereço acessado não existe nesta loja. Use o menu ou a busca para encontrar o que procura.',
        '<div class="row gap-3 mt-5" style="justify-content:center">' +
          '<a class="btn btn-primary" href="#/" data-link>Ir para o início</a>' +
          '<a class="btn btn-outline" href="#/categoria" data-link>Ver catálogo</a>' +
        '</div>') +
      '</div>';
  }

  function errorHTML(e) {
    return '<div class="shell section">' +
      U.empty('alertTri', 'Ops, algo deu errado',
        'Não foi possível carregar esta página. Detalhes: ' + (e && e.message ? e.message : 'erro desconhecido'),
        '<a class="btn btn-primary mt-4" href="#/" data-link>Voltar ao início</a>') +
      '</div>';
  }

  VT.router = Router;

  /* ============================================================
     SHELL — header / footer / navegações
     ============================================================ */
  function buildCatbar() {
    var bar = D.byId('catbar');
    if (!bar) return;
    bar.innerHTML = '<div class="catbar-in">' +
      '<a class="cat-all" href="#/categoria" data-link>' + VT.icons.get('grid', 15) + ' Todas</a>' +
      VT.catalog.categories.map(function (c) {
        return '<a class="cat-link" href="#/categoria?cat=' + esc(c.id) + '" data-link>' +
          '<span class="emo">' + c.emoji + '</span>' + esc(c.name) +
          '<span class="cnt">' + c.count + '</span></a>';
      }).join('') +
      '<div style="flex:1 1 auto"></div>' +
      '<a class="cat-link" href="#/planos" data-link>' + VT.icons.get('zap', 14) + ' Planos</a>' +
      '<a class="cat-link" href="#/institucional/sobre" data-link>Sobre</a>' +
      '</div>';
  }

  function buildFooter() {
    var foot = D.byId('sitefoot');
    if (!foot) return;
    var cfg = S.settings();
    var year = new Date().getFullYear();
    foot.innerHTML =
      '<div class="foot-top">' +
        '<div class="foot-brand">' +
          '<a class="brand" href="#/" data-link>' +
            '<span class="brand-mark">V</span><span class="brand-txt">VITRINE<b>PRO</b></span>' +
          '</a>' +
          '<p>' + esc(cfg.tagline) + ' Plataforma de e-commerce completa, responsiva e pronta para vender.</p>' +
          '<div class="foot-social">' +
            [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['twitter', 'X'],
             ['youtube', 'YouTube'], ['whatsapp', 'WhatsApp'], ['linkedin', 'LinkedIn']].map(function (s) {
              return '<a href="#" aria-label="' + s[1] + '" title="' + s[1] + '">' + VT.icons.get(s[0], 17) + '</a>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div class="foot-col"><h5>Institucional</h5><ul>' +
          ['sobre|Sobre nós', 'contato|Contato', 'faq|Perguntas frequentes', 'envio|Frete e devoluções'].map(function (l) {
            var kv = l.split('|');
            return '<li><a href="#/institucional/' + kv[0] + '" data-link>' + kv[1] + '</a></li>';
          }).join('') +
        '</ul></div>' +
        '<div class="foot-col"><h5>Minha conta</h5><ul>' +
          '<li><a href="#/conta" data-link>Entrar / Cadastrar</a></li>' +
          '<li><a href="#/conta/pedidos" data-link>Meus pedidos</a></li>' +
          '<li><a href="#/conta/favoritos" data-link>Lista de desejos</a></li>' +
          '<li><a href="#/conta/enderecos" data-link>Meus endereços</a></li>' +
          '<li><a href="#/admin" data-link>Painel da loja</a></li>' +
        '</ul></div>' +
        '<div class="foot-col"><h5>Categorias</h5><ul>' +
          VT.catalog.categories.slice(0, 6).map(function (c) {
            return '<li><a href="#/categoria?cat=' + esc(c.id) + '" data-link>' + esc(c.name) + '</a></li>';
          }).join('') +
        '</ul></div>' +
      '</div>' +
      '<div style="border-top:1px solid var(--line)"><div class="shell-wide" style="padding:var(--sp-5)">' +
        '<div class="row-b wrap gap-4">' +
          '<div>' +
            '<div class="small strong mb-2">Formas de pagamento</div>' +
            '<div class="foot-pay">' +
              ['PIX', 'VISA', 'MASTER', 'ELO', 'AMEX', 'HIPERCARD', 'BOLETO', '12x SEM JUROS'].map(function (p) {
                return '<span class="pay-badge">' + p + '</span>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<div>' +
            '<div class="small strong mb-2">Segurança</div>' +
            '<div class="foot-pay">' +
              ['SSL 256 bits', 'LGPD', 'PCIDSS', 'ANTIFRAUDE'].map(function (p) {
                return '<span class="pay-badge">' + p + '</span>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div></div>' +
      '<div class="foot-bottom"><div class="foot-bottom-in">' +
        '<span>© ' + year + ' ' + esc(cfg.storeName) + ' · CNPJ 00.000.000/0001-00 · Todos os direitos reservados</span>' +
        '<div class="foot-legal">' +
          '<a href="#/institucional/termos" data-link>Termos de uso</a>' +
          '<a href="#/institucional/privacidade" data-link>Privacidade</a>' +
          '<a href="#/institucional/envio" data-link>Trocas e devoluções</a>' +
        '</div>' +
      '</div></div>';
  }

  function buildTabbar() {
    var bar = D.byId('tabbar');
    if (!bar) return;
    var items = [
      { href: '#/', icon: 'home', label: 'Início', key: 'home' },
      { href: '#/categoria', icon: 'grid', label: 'Categorias', key: 'categoria' },
      { href: '#/carrinho', icon: 'cart', label: 'Carrinho', key: 'carrinho', dot: 'cart' },
      { href: '#/conta/favoritos', icon: 'heart', label: 'Favoritos', key: 'favoritos', dot: 'wish' },
      { href: '#/conta', icon: 'user', label: 'Conta', key: 'conta' }
    ];
    bar.innerHTML = '<div class="tabbar-in">' +
      items.map(function (it) {
        return '<a class="tabitem" href="' + it.href + '" data-link data-tabkey="' + it.key + '">' +
          VT.icons.get(it.icon, 22) + '<span>' + it.label + '</span>' +
          (it.dot ? '<i class="dot" data-dot="' + it.dot + '" hidden>0</i>' : '') +
          '</a>';
      }).join('') +
      '</div>';
  }

  /* mantém o destaque do item ativo */
  function syncHeader() {
    var path = Router.path();
    var key = path.indexOf('/categoria') === 0 ? 'categoria'
      : path.indexOf('/conta/favoritos') === 0 ? 'favoritos'
      : path === '/' ? 'home'
      : path.indexOf('/carrinho') === 0 ? 'carrinho'
      : path.indexOf('/conta') === 0 ? 'conta' : '';
    D.qsa('[data-tabkey]').forEach(function (a) {
      a.classList.toggle('on', a.dataset.tabkey === key);
    });
    D.qsa('.cat-link').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      a.classList.toggle('on', href.indexOf('cat=') !== -1 && location.hash.indexOf(href.replace('#', '')) !== -1);
    });
  }

  /* ============================================================
     CARRINHO — gaveta lateral
     ============================================================ */
  function openCart() {
    var t = VT.cart.totals();
    var drawer = VT.modal.drawer({
      title: VT.icons.get('cart', 19) + ' Carrinho <span class="cnt">' + t.itemCount + '</span>',
      body: cartDrawerBody(t),
      footer: cartDrawerFoot(t),
      onMount: function (panel, close) {
        panel.addEventListener('click', function (e) {
          var inc = e.target.closest('[data-dqty]');
          if (inc) {
            var key = inc.dataset.dqty;
            var line = VT.cart.lines().filter(function (l) { return l.key === key; })[0];
            if (!line) return;
            VT.cart.setQty(key, line.qty + Number(inc.dataset.delta));
            return;
          }
          var rm = e.target.closest('[data-dremove]');
          if (rm) { VT.cart.remove(rm.dataset.dremove); return; }
        });
      }
    });
    return drawer;
  }

  function cartDrawerBody(t) {
    if (!t.items.length) {
      return '<div class="center" style="padding:var(--sp-8) 0">' +
        '<div style="width:88px;height:88px;margin:0 auto var(--sp-4);border-radius:50%;display:grid;place-items:center;background:var(--surface-3);color:var(--ink-4)">' +
          VT.icons.get('cart', 38) + '</div>' +
        '<h4>Seu carrinho está vazio</h4>' +
        '<p class="muted small mt-2">Que tal dar uma olhada nas novidades?</p>' +
        '<a class="btn btn-primary mt-5" href="#/categoria" data-link data-close>' + VT.icons.get('bag', 17) + ' Explorar catálogo</a>' +
        '</div>';
    }
    var cfg = S.settings();
    return '' +
      (t.freeShipMissing > 0
        ? '<div class="free-ship-bar">' +
            '<div class="t">Faltam <b>' + F.brl(t.freeShipMissing) + '</b> para o frete grátis</div>' +
            '<div class="progress"><i style="width:' +
              Math.min(100, Math.round((t.subtotal - t.discount) / cfg.freeShipFrom * 100)) + '%"></i></div>' +
          '</div>'
        : '<div class="free-ship-bar"><div class="t" style="color:var(--ok-ink)">' +
            VT.icons.get('checkCircle', 14) + ' Frete grátis liberado!</div>' +
            '<div class="progress"><i style="width:100%"></i></div></div>') +
      t.items.map(function (it) {
        return '<div class="mini-item">' +
          '<a class="mini-thumb" href="#/produto/' + esc(it.product.slug) + '" data-link data-close>' +
            VT.art.product(it.product.art, it.product.hue) + '</a>' +
          '<div style="min-width:0">' +
            '<a class="mini-name" href="#/produto/' + esc(it.product.slug) + '" data-link data-close>' + esc(it.product.name) + '</a>' +
            '<div class="mini-var">' + esc(it.product.brand) +
              (it.variant ? ' · ' + esc(it.variant.value) : '') + '</div>' +
            '<div class="mini-actions">' +
              '<span class="qty qty-sm">' +
                '<button data-dqty="' + esc(it.key) + '" data-delta="-1" aria-label="Diminuir">−</button>' +
                '<span class="v">' + it.qty + '</span>' +
                '<button data-dqty="' + esc(it.key) + '" data-delta="1" aria-label="Aumentar">+</button>' +
              '</span>' +
              '<button class="link-danger" data-dremove="' + esc(it.key) + '">remover</button>' +
            '</div>' +
          '</div>' +
          '<div class="mini-price">' + F.brl(it.total) + '</div>' +
          '</div>';
      }).join('');
  }

  function cartDrawerFoot(t) {
    if (!t.items.length) return '';
    return '<div class="col gap-3">' +
      '<div class="sum-line"><span>Subtotal</span><span class="v">' + F.brl(t.subtotal - t.discount) + '</span></div>' +
      '<div class="sum-line"><span>Frete</span><span class="v">' +
        (t.shipping ? F.brl(t.shipping) : '<b style="color:var(--ok-ink)">grátis</b>') + '</span></div>' +
      '<div class="sum-line big"><span>Total</span><span class="v">' + F.brl(t.total) + '</span></div>' +
      (t.pixEconomy > 0
        ? '<div class="tiny" style="color:var(--ok-ink)">ou ' + F.brl(t.pixTotal) + ' no Pix (' + t.pixRate + '% off)</div>' : '') +
      '<a class="btn btn-primary btn-lg btn-block mt-2" href="#/checkout" data-link data-close>' +
        VT.icons.get('lock', 17) + ' Fechar pedido</a>' +
      '<a class="btn btn-ghost btn-block" href="#/carrinho" data-link data-close>Ver carrinho completo</a>' +
      '</div>';
  }

  /* ============================================================
     PALETTE DE BUSCA
     ============================================================ */
  function openPalette(initialTerm) {
    var host = D.byId('paletteRoot');
    if (host.querySelector('.palette-backdrop')) return;
    host.innerHTML = '<div class="palette-backdrop">' +
      '<div class="palette" role="dialog" aria-modal="true" aria-label="Buscar">' +
        '<div class="palette-input">' + VT.icons.get('search', 20) +
          '<input type="search" id="palInput" placeholder="Buscar produtos, marcas, categorias…" autocomplete="off">' +
          '<kbd>esc</kbd>' +
        '</div>' +
        '<div class="palette-body" id="palBody"></div>' +
        '<div class="palette-foot">' +
          '<span>' + VT.icons.get('arrowUp', 12) + VT.icons.get('arrowDown', 12) + ' navegar</span>' +
          '<span>↵ abrir</span><span>esc fechar</span>' +
        '</div>' +
      '</div>' +
    '</div>';
    var input = host.querySelector('#palInput');
    var body = host.querySelector('#palBody');
    var sel = 0, items = [];

    function render(term) {
      var res = VT.catalog.suggest(term, 10);
      items = res;
      sel = 0;
      if (!term.trim()) {
        body.innerHTML =
          '<div class="palette-group">Sugestões populares</div>' +
          res.map(itemHTML).join('') +
          '<div class="palette-group">Categorias</div>' +
          VT.catalog.categories.slice(0, 6).map(function (c) {
            return '<div class="palette-item" data-go="#/categoria?cat=' + esc(c.id) + '">' +
              '<span class="pi-ico">' + c.emoji + '</span>' +
              '<span class="pi-main"><span class="pi-t">' + esc(c.name) + '</span>' +
              '<span class="pi-s">' + c.count + ' produtos</span></span>' +
              VT.icons.get('chevronRight', 15) + '</div>';
          }).join('');
      } else {
        body.innerHTML = res.length
          ? '<div class="palette-group">' + res.length + ' resultados</div>' + res.map(itemHTML).join('')
          : '<div class="palette-group">Sem resultados</div>' +
            '<div class="palette-item" data-go="#/categoria?q=' + encodeURIComponent(term) + '">' +
            '<span class="pi-ico">' + VT.icons.get('search', 16) + '</span>' +
            '<span class="pi-main"><span class="pi-t">Buscar “' + esc(term) + '” em todo o catálogo</span>' +
            '<span class="pi-s">abre a página de resultados</span></span>' +
            VT.icons.get('chevronRight', 15) + '</div>';
      }
      highlight();
    }

    function itemHTML(it, i) {
      if (it.type === 'product') {
        var p = it.product;
        return '<div class="palette-item" data-go="#/produto/' + esc(p.slug) + '" data-i="' + i + '">' +
          '<span class="pi-thumb">' + VT.art.product(p.art, p.hue) + '</span>' +
          '<span class="pi-main"><span class="pi-t">' + esc(p.name) + '</span>' +
          '<span class="pi-s">' + esc(p.brand) + ' · ★ ' + String(p.rating).replace('.', ',') + '</span></span>' +
          '<span class="pi-r">' + F.brl(p.price) + '</span>' +
          '</div>';
      }
      if (it.type === 'category') {
        return '<div class="palette-item" data-go="#/categoria?cat=' + esc(it.category.id) + '" data-i="' + i + '">' +
          '<span class="pi-ico">' + it.category.emoji + '</span>' +
          '<span class="pi-main"><span class="pi-t">' + esc(it.category.name) + '</span>' +
          '<span class="pi-s">categoria · ' + it.category.count + ' produtos</span></span>' +
          VT.icons.get('chevronRight', 15) + '</div>';
      }
      return '<div class="palette-item" data-go="#/categoria" data-i="' + i + '">' +
        '<span class="pi-ico">' + VT.icons.get('tag', 16) + '</span>' +
        '<span class="pi-main"><span class="pi-t">' + esc(it.brand) + '</span>' +
        '<span class="pi-s">marca</span></span>' +
        VT.icons.get('chevronRight', 15) + '</div>';
    }

    function highlight() {
      var nodes = D.qsa('.palette-item', body);
      nodes.forEach(function (n, i) { n.classList.toggle('sel', i === sel); });
      if (nodes[sel] && nodes[sel].scrollIntoView) nodes[sel].scrollIntoView({ block: 'nearest' });
    }
    function move(d) {
      var nodes = D.qsa('.palette-item', body);
      if (!nodes.length) return;
      sel = (sel + d + nodes.length) % nodes.length;
      highlight();
    }
    function go() {
      var nodes = D.qsa('.palette-item', body);
      if (nodes[sel]) nodes[sel].click();
    }

    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); go(); }
    });
    D.on(document, 'keydown', null);
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    }
    document.addEventListener('keydown', onKey);

    function close() {
      document.removeEventListener('keydown', onKey);
      host.innerHTML = '';
      document.body.classList.remove('no-scroll');
    }
    body.addEventListener('click', function (e) {
      var it = e.target.closest('[data-go]');
      if (!it) return;
      location.hash = it.dataset.go.replace(/^#/, '#');
      close();
    });
    host.querySelector('.palette-backdrop').addEventListener('mousedown', function (e) {
      if (e.target === this) close();
    });

    document.body.classList.add('no-scroll');
    render(initialTerm || '');
    input.value = initialTerm || '';
    setTimeout(function () { input.focus(); }, 40);
  }

  /* ============================================================
     AÇÕES GLOBAIS DO CATÁLOGO
     ============================================================ */
  function handleAdd(id, qty, variant) {
    var p = S.product(id);
    if (!p) return;
    if (p.stock === 0) { VT.toast.warn('Produto esgotado', 'Avise-me quando chegar em breve.'); return; }
    if (!variant && (p.colors || p.sizes)) { quickView(p); return; }
    var res = VT.cart.add(p, qty || 1, variant || null);
    if (!res.ok) {
      VT.toast.warn('Não foi possível adicionar',
        res.reason === 'stock' ? 'Estoque disponível: ' + res.available : 'Produto esgotado.');
      return;
    }
    bumpCart();
    VT.toast.ok('Adicionado ao carrinho', p.name, 2200);
  }

  function quickView(p) {
    var variant = null, qty = 1;
    VT.modal.open({
      title: p.name,
      sub: p.brand,
      body:
        '<div class="row gap-5 wrap">' +
          '<div style="width:190px;flex:none;border-radius:var(--r-lg);overflow:hidden;border:1px solid var(--line)">' +
            VT.art.product(p.art, p.hue) + '</div>' +
          '<div style="flex:1 1 220px;min-width:0">' +
            U.rating(p.rating, p.reviews) +
            '<div class="mt-3">' + U.priceBlock(p) + '</div>' +
            (p.colors
              ? '<div class="opt-group" data-variant="color">' +
                  '<span class="lbl">Cor <b data-variant-label>—</b></span>' +
                  '<div class="opt-opts">' + p.colors.map(function (c, i) {
                    return '<button class="opt opt-color' + (i === 0 ? ' on' : '') + '" data-opt="' + esc(c.n) + '" title="' + esc(c.n) + '">' +
                      '<i style="background:' + esc(c.c) + '"></i></button>';
                  }).join('') + '</div></div>' : '') +
            (p.sizes
              ? '<div class="opt-group" data-variant="size">' +
                  '<span class="lbl">Tamanho <b data-variant-label>—</b></span>' +
                  '<div class="opt-opts">' + p.sizes.map(function (s, i) {
                    return '<button class="opt' + (i === 0 ? ' on' : '') + '" data-opt="' + esc(s.n) + '">' + esc(s.n) + '</button>';
                  }).join('') + '</div></div>' : '') +
            '<div class="row gap-3 mt-4">' +
              '<span class="qty" data-qv-qty><button data-qv="dec">−</button>' +
              '<span class="v">1</span><button data-qv="inc">+</button></span>' +
              '<a class="btn btn-ghost btn-sm" href="#/produto/' + esc(p.slug) + '" data-link data-close>Ver detalhes</a>' +
            '</div>' +
          '</div>' +
        '</div>',
      footer: '<button class="btn btn-ghost" data-close>Continuar comprando</button>' +
        '<button class="btn btn-primary" data-qv-add>' + VT.icons.get('cart', 17) + ' Adicionar ao carrinho</button>',
      onMount: function (node, close) {
        D.qsa('.opt-group', node).forEach(function (g) {
          var first = g.querySelector('[data-opt]');
          if (first) {
            g.querySelector('[data-variant-label]').textContent = first.dataset.opt;
            variant = { type: g.dataset.variant === 'color' ? 'Cor' : 'Tamanho', value: first.dataset.opt };
          }
          g.addEventListener('click', function (e) {
            var b = e.target.closest('[data-opt]');
            if (!b) return;
            D.qsa('[data-opt]', g).forEach(function (x) { x.classList.remove('on'); });
            b.classList.add('on');
            g.querySelector('[data-variant-label]').textContent = b.dataset.opt;
            variant = { type: g.dataset.variant === 'color' ? 'Cor' : 'Tamanho', value: b.dataset.opt };
          });
        });
        node.addEventListener('click', function (e) {
          var q = e.target.closest('[data-qv]');
          if (q) {
            qty = Math.max(1, Math.min(p.stock || 99, qty + (q.dataset.qv === 'inc' ? 1 : -1)));
            node.querySelector('[data-qv-qty] .v').textContent = qty;
          }
        });
        node.querySelector('[data-qv-add]').addEventListener('click', function () {
          handleAdd(p.id, qty, variant);
          close();
        });
      }
    });
  }

  function bumpCart() {
    var btn = D.byId('btnCart');
    if (btn) { btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump'); }
  }

  /* ============================================================
     CONTADORES
     ============================================================ */
  function updateCounts() {
    var n = VT.cart.count();
    var wc = (S.get('wishlist') || []).length;
    var cartCount = D.byId('cartCount');
    var wishCount = D.byId('wishCount');
    D.qsa('[data-dot="cart"]').forEach(function (el) {
      el.hidden = n === 0; el.textContent = n;
    });
    if (cartCount) { cartCount.hidden = n === 0; cartCount.textContent = n; }
    if (wishCount) { wishCount.hidden = wc === 0; wishCount.textContent = wc; }
    D.qsa('[data-dot="wish"]').forEach(function (el) {
      el.hidden = wc === 0; el.textContent = wc;
    });
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    /* tema */
    S.applyTheme();

    /* shell */
    buildCatbar();
    buildFooter();
    buildTabbar();
    VT.icons.fill(document);
    updateCounts();

    /* header: tema */
    var themeBtn = D.byId('btnTheme');
    function paintTheme() {
      if (themeBtn) themeBtn.innerHTML = VT.icons.get(S.get('theme') === 'dark' ? 'sun' : 'moon', 20);
    }
    paintTheme();
    themeBtn.addEventListener('click', function () {
      S.toggleTheme(); paintTheme(); VT.icons.fill(document);
      setTimeout(function () { if (VT.charts) VT.charts.refresh(); }, 60);
    });

    /* header: scroll */
    var topbar = D.byId('topbar');
    w.addEventListener('scroll', D.throttle(function () {
      topbar.classList.toggle('scrolled', w.scrollY > 8);
    }, 90), { passive: true });

    /* header: carrinho */
    D.byId('btnCart').addEventListener('click', openCart);

    /* header: busca */
    var searchForm = D.byId('searchForm');
    var searchInput = D.byId('searchInput');
    var searchClear = D.byId('searchClear');
    searchInput.addEventListener('focus', function () {
      openPalette(searchInput.value);
      searchInput.blur();
    });
    searchInput.addEventListener('input', function () {
      searchClear.style.display = searchInput.value ? 'grid' : 'none';
    });
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      openPalette(searchInput.value);
    });
    searchClear.addEventListener('click', function () {
      searchInput.value = '';
      searchClear.style.display = 'none';
    });
    searchClear.style.display = 'none';

    /* menu mobile */
    D.byId('btnMenu').addEventListener('click', function () {
      var menu = VT.modal.drawer({
        width: 340,
        title: '',
        body: '',
        onMount: function (panel, close) {
          panel.className = 'mobile-menu';
          panel.style.width = '';
          panel.innerHTML =
            '<div class="mm-head">' +
              '<a class="brand" href="#/" data-link data-close>' +
                '<span class="brand-mark">V</span><span class="brand-txt">VITRINE<b>PRO</b></span></a>' +
              '<button class="iconbtn" data-close aria-label="Fechar">✕</button>' +
            '</div>' +
            '<div class="mm-body">' +
              '<a class="mm-link" href="#/" data-link data-close>' + VT.icons.get('home', 17) + ' Início</a>' +
              '<a class="mm-link" href="#/categoria" data-link data-close>' + VT.icons.get('grid', 17) + ' Categorias</a>' +
              '<div class="mm-sep"></div>' +
              VT.catalog.categories.map(function (c) {
                return '<a class="mm-link" href="#/categoria?cat=' + esc(c.id) + '" data-link data-close>' +
                  '<span class="emo">' + c.emoji + '</span>' + esc(c.name) +
                  '<span class="cnt">' + c.count + '</span></a>';
              }).join('') +
              '<div class="mm-sep"></div>' +
              '<a class="mm-link" href="#/carrinho" data-link data-close>' + VT.icons.get('cart', 17) + ' Carrinho</a>' +
              '<a class="mm-link" href="#/conta/favoritos" data-link data-close>' + VT.icons.get('heart', 17) + ' Favoritos</a>' +
              '<a class="mm-link" href="#/conta" data-link data-close>' + VT.icons.get('user', 17) + ' Minha conta</a>' +
              '<a class="mm-link" href="#/planos" data-link data-close>' + VT.icons.get('zap', 17) + ' Planos</a>' +
              '<a class="mm-link" href="#/institucional/contato" data-link data-close>' + VT.icons.get('chat', 17) + ' Contato</a>' +
              '<a class="mm-link" href="#/admin" data-link data-close>' + VT.icons.get('settings', 17) + ' Painel da loja</a>' +
            '</div>' +
            '<div class="mm-foot">' +
              '<button class="btn btn-outline btn-block btn-sm" data-theme-m>' +
                VT.icons.get(S.get('theme') === 'dark' ? 'sun' : 'moon', 16) + ' Alternar tema</button>' +
            '</div>';
          panel.addEventListener('click', function (e) {
            if (e.target.closest('[data-close]')) close();
            if (e.target.closest('[data-theme-m]')) {
              S.toggleTheme(); paintTheme(); VT.icons.fill(document);
            }
          });
        }
      });
      /* transforma a gaveta em menu lateral esquerdo */
      var node = menu.node;
      node.style.right = 'auto';
      node.style.left = '0';
      return menu;
    });

    /* delegação global de catálogo */
    document.addEventListener('click', function (e) {
      var add = e.target.closest('[data-add]');
      if (add) { e.preventDefault(); handleAdd(add.dataset.add, 1, null); return; }
      var fav = e.target.closest('[data-fav]');
      if (fav) {
        e.preventDefault();
        var on = S.toggleFav(fav.dataset.fav);
        fav.classList.toggle('on', on);
        fav.innerHTML = VT.icons.get('heart', 17, { filled: on });
        VT.toast.info(on ? 'Salvo nos favoritos' : 'Removido dos favoritos');
        return;
      }
      /* fecha gavetas ao navegar */
      var link = e.target.closest('[data-link][data-close]');
      if (link) {
        var host = D.byId('cartRoot');
        if (host) host.innerHTML = '';
        document.body.classList.remove('no-scroll');
      }
    });

    /* atalhos de teclado */
    document.addEventListener('keydown', function (e) {
      var tag = document.activeElement ? document.activeElement.tagName : '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      if (e.key === '/') { e.preventDefault(); openPalette(''); }
      if (e.key === 'c' && (e.metaKey || e.ctrlKey) === false && !e.altKey) { /* reservado */ }
    });

    /* reage a mudanças de estado */
    S.subscribe(function (path) {
      if (path === 'cart' || path === 'wishlist') updateCounts();
      if (path === 'cart') {
        /* atualiza a gaveta se estiver aberta */
        var panel = D.qs('#cartRoot .drawer .drawer-body');
        if (panel) {
          var t = VT.cart.totals();
          panel.innerHTML = cartDrawerBody(t);
          var foot = D.qs('#cartRoot .drawer .drawer-foot');
          if (foot) foot.innerHTML = cartDrawerFoot(t);
          var title = D.qs('#cartRoot .drawer .drawer-head h3');
          if (title) title.innerHTML = VT.icons.get('cart', 19) + ' Carrinho <span class="cnt">' + t.itemCount + '</span>';
        }
      }
      if (path === 'theme') paintTheme();
      if (String(path).indexOf('settings') === 0 || path === 'brandHue') {
        buildFooter(); VT.icons.fill(document);
      }
    });

    /* rota inicial */
    if (!location.hash) location.hash = '#/';
    Router.go({ smooth: false });
    w.addEventListener('hashchange', function () { Router.go(); });

    /* esconde o splash */
    setTimeout(function () {
      var boot = D.byId('boot');
      if (boot) { boot.classList.add('gone'); setTimeout(function () { boot.remove(); }, 600); }
    }, 380);

    /* service worker (instalação offline) */
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      w.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () { /* silencioso */ });
      });
    }

    /* contador de visitas (usado em relatórios) */
    S.set('visits', (S.get('visits') || 0) + 1);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
