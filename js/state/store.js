/* ============================================================
   VITRINE PRO — store.js
   Estado global da aplicação com persistência em localStorage
   e pub/sub simples. Tudo client-side: troque por uma API
   quando for plugar um backend real.
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};
  var KEY = 'vitrine.state.v2';

  function defaults() {
    return {
      /* preferências */
      theme: 'light',
      brandHue: 245,
      view: 'grid',

      /* loja */
      cart: [],            // { id, qty, variant, addedAt }
      wishlist: [],
      recent: [],
      coupon: null,        // código aplicado
      shippingSel: null,   // { id, name, price, days }

      /* conta */
      user: null,
      addresses: [],
      orders: [],          // pedidos criados nesta instalação
      lastOrder: null,

      /* configurações do painel (white-label) */
      settings: {
        storeName: 'Vitrine',
        tagline: 'Tudo que você precisa, em um só lugar',
        supportEmail: 'contato@vitrine.com',
        whatsapp: '(34) 99999-0000',
        pixKey: 'loja@vitrine.com',
        pixDiscount: 5,
        freeShipFrom: 299,
        shipBase: 24.9,
        taxPercent: 0,
        instMax: 12,
        instFree: 6,
        instRate: 1.99,
        methods: { pix: true, card: true, boleto: true },
        maintenance: false,
        newsletter: true,
        reviews: true,
        stockAlert: 5
      },

      /* produtos editados pelo painel (override por id) */
      prodOverrides: {},

      /* métricas leves de sessão */
      visits: 0
    };
  }

  var state = defaults();
  var subs = [];

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      state = merge(defaults(), saved);
    } catch (e) {
      console.warn('[store] falha ao ler estado salvo:', e);
    }
  }

  /** merge profundo (somente objetos simples) */
  function merge(base, patch) {
    if (patch == null) return base;
    Object.keys(patch).forEach(function (k) {
      var v = patch[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
        base[k] = merge(base[k], v);
      } else if (v !== undefined) {
        base[k] = v;
      }
    });
    return base;
  }

  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(state)); }
      catch (e) { /* quota cheia ou modo privado: ignora */ }
    }, 120);
  }

  function get(path) {
    if (!path) return state;
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, state);
  }

  function set(path, value, opts) {
    opts = opts || {};
    var parts = path.split('.');
    var last = parts.pop();
    var target = parts.reduce(function (o, k) {
      if (o[k] == null || typeof o[k] !== 'object') o[k] = {};
      return o[k];
    }, state);
    var old = target[last];
    target[last] = value;
    if (opts.persist !== false) save();
    if (!opts.silent) emit(path, value, old);
    return value;
  }

  /** Atualiza o estado por função imutável-ish. */
  function update(path, fn, opts) {
    return set(path, fn(get(path)), opts);
  }

  function subscribe(fn) {
    subs.push(fn);
    return function () { subs = subs.filter(function (f) { return f !== fn; }); };
  }

  function emit(path, value, old) {
    subs.forEach(function (fn) {
      try { fn(path, value, old, state); } catch (e) { console.error(e); }
    });
  }

  function reset(hard) {
    var keepTheme = state.theme;
    state = defaults();
    if (!hard) state.theme = keepTheme;
    save();
    emit('*', state, null);
  }

  /* ---------------- atalhos de domínio ---------------- */
  function settings() { return state.settings; }

  function isFav(id) { return state.wishlist.indexOf(id) !== -1; }
  function toggleFav(id) {
    var i = state.wishlist.indexOf(id);
    if (i === -1) state.wishlist.unshift(id); else state.wishlist.splice(i, 1);
    save(); emit('wishlist', state.wishlist, null);
    return i === -1; // virou favorito?
  }

  function pushRecent(id) {
    state.recent = [id].concat(state.recent.filter(function (x) { return x !== id; })).slice(0, 12);
    save(); emit('recent', state.recent, null);
  }

  function login(user) {
    state.user = user; save(); emit('user', user, null);
  }
  function logout() {
    var prev = state.user;
    state.user = null; save(); emit('user', null, prev);
  }

  function addOrder(order) {
    state.orders.unshift(order);
    state.lastOrder = order;
    save(); emit('orders', state.orders, null);
    return order;
  }

  /** Pedidos da conta logada (mistura os deste cliente + demonstração). */
  function myOrders() {
    var mine = state.orders.slice();
    if (state.user) {
      VT.seed.orders.forEach(function (o) {
        if (o.customerEmail === state.user.email && o.status !== 'cancelled') mine.push(o);
      });
    }
    return mine.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  }

  /** Aplica overrides do painel sobre o catálogo. */
  function product(id) {
    var p = VT.catalog.byId[id];
    if (!p) return null;
    var ov = state.prodOverrides[id];
    return ov ? Object.assign({}, p, ov) : p;
  }

  function allProducts() {
    return VT.catalog.products.map(function (p) {
      var ov = state.prodOverrides[p.id];
      return ov ? Object.assign({}, p, ov) : p;
    });
  }

  function upsertProduct(prod) {
    if (VT.catalog.byId[prod.id]) {
      state.prodOverrides[prod.id] = Object.assign({}, state.prodOverrides[prod.id] || {}, prod);
    } else {
      state.prodOverrides[prod.id] = Object.assign({ custom: true }, prod);
    }
    save(); emit('products', state.prodOverrides, null);
  }

  function deleteProduct(id) {
    delete state.prodOverrides[id];
    save(); emit('products', state.prodOverrides, null);
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    document.documentElement.style.setProperty('--brand-h', String(state.brandHue));
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', state.theme === 'dark' ? '#080b14'
        : 'hsl(' + state.brandHue + ' 83% 53%)');
    }
  }

  function toggleTheme() {
    set('theme', state.theme === 'dark' ? 'light' : 'dark');
    applyTheme();
    return state.theme;
  }

  load();

  VT.store = {
    state: state,
    get: get, set: set, update: update, subscribe: subscribe, save: save, reset: reset,
    settings: settings,
    isFav: isFav, toggleFav: toggleFav, pushRecent: pushRecent,
    login: login, logout: logout, addOrder: addOrder, myOrders: myOrders,
    product: product, allProducts: allProducts, upsertProduct: upsertProduct, deleteProduct: deleteProduct,
    applyTheme: applyTheme, toggleTheme: toggleTheme,
    KEY: KEY
  };
})(window);
