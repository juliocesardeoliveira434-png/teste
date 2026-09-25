/* ============================================================
   VITRINE PRO — pages/catalog.js
   Catálogo com filtros facetados, ordenação, busca e paginação.
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};
  var F = VT.format, D = VT.dom, S = VT.store, U = VT.ui;
  var esc = D.esc;

  var PER_PAGE = 12;
  var SORTS = [
    { id: 'relevance', label: 'Mais relevantes' },
    { id: 'price_asc', label: 'Menor preço' },
    { id: 'price_desc', label: 'Maior preço' },
    { id: 'rating', label: 'Melhor avaliados' },
    { id: 'reviews', label: 'Mais avaliados' },
    { id: 'discount', label: 'Maior desconto' },
    { id: 'name', label: 'Nome A–Z' }
  ];

  VT.pages = VT.pages || {};
  VT.pages.catalog = {
    title: 'Catálogo — Vitrine',

    /* estado local da página (preservado entre renders) */
    _state: null,

    state: function (params) {
      if (this._state) return this._state;
      var pr = VT.catalog.priceRange;
      this._state = {
        q: params.q || '',
        cat: params.cat || '',
        brands: params.brands ? params.brands.split(',') : [],
        min: params.min != null ? Number(params.min) : pr.min,
        max: params.max != null ? Number(params.max) : pr.max,
        rating: params.rating ? Number(params.rating) : 0,
        onSale: !!params.oferta,
        inStock: false,
        sort: params.sort || 'relevance',
        page: 1,
        view: S.get('view') || 'grid'
      };
      return this._state;
    },

    render: function (params) {
      var st = this._state = null;
      st = this.state(params || {});
      var cats = VT.catalog.categories;
      var pr = VT.catalog.priceRange;

      return '<div class="shell-wide">' +
        '<div class="cat-layout">' +

          /* ---------- filtros ---------- */
          '<aside class="filters" id="filters">' +
            '<div class="filters-head">' +
              '<h3>' + VT.icons.get('filter', 16) + ' Filtros</h3>' +
              '<button class="iconbtn only-mobile" data-close-filters aria-label="Fechar filtros">✕</button>' +
            '</div>' +
            '<div class="filters-body" id="filtersBody">' +

              fgroup('Categoria', 'cat', true,
                '<label class="check radio"><input type="radio" name="cat" value=""' + (st.cat ? '' : ' checked') + '>' +
                  '<span class="box"></span><span class="ct">Todas as categorias</span></label>' +
                cats.map(function (c) {
                  return '<label class="check radio"><input type="radio" name="cat" value="' + esc(c.id) + '"' +
                    (st.cat === c.id ? ' checked' : '') + '><span class="box"></span>' +
                    '<span class="ct">' + c.emoji + ' ' + esc(c.name) + '</span>' +
                    '<span class="cc">' + c.count + '</span></label>';
                }).join('')) +

              fgroup('Marca', 'brand', true,
                VT.catalog.brands.map(function (b) {
                  return '<label class="check"><input type="checkbox" name="brand" value="' + esc(b.name) + '"' +
                    (st.brands.indexOf(b.name) !== -1 ? ' checked' : '') + '><span class="box">' +
                    VT.icons.get('check', 12, { stroke: 3 }) + '</span>' +
                    '<span class="ct">' + esc(b.name) + '</span><span class="cc">' + b.count + '</span></label>';
                }).join('')) +

              '<div class="fgroup open" data-group="price">' +
                '<button class="fgroup-btn" type="button">Faixa de preço <span class="chev">' + VT.icons.get('chevronDown', 16) + '</span></button>' +
                '<div class="fgroup-panel"><div><div class="fgroup-inner">' +
                  '<div class="range-row">' +
                    '<input class="input" type="text" inputmode="numeric" id="priceMin" value="' + st.min + '" aria-label="Preço mínimo">' +
                    '<span class="dim">até</span>' +
                    '<input class="input" type="text" inputmode="numeric" id="priceMax" value="' + st.max + '" aria-label="Preço máximo">' +
                  '</div>' +
                  '<div class="range-dual">' +
                    '<span class="tr"></span><span class="tf" id="rangeFill"></span>' +
                    '<input type="range" id="rMin" min="' + pr.min + '" max="' + pr.max + '" value="' + st.min + '" step="10" aria-label="Mínimo">' +
                    '<input type="range" id="rMax" min="' + pr.min + '" max="' + pr.max + '" value="' + st.max + '" step="10" aria-label="Máximo">' +
                  '</div>' +
                  '<div class="row-b tiny dim"><span>' + F.brl(pr.min) + '</span><span>' + F.brl(pr.max) + '</span></div>' +
                '</div></div></div>' +
              '</div>' +

              fgroup('Avaliação', 'rating', true,
                [4, 3, 2].map(function (n) {
                  return '<label class="check radio"><input type="radio" name="rating" value="' + n + '"' +
                    (st.rating === n ? ' checked' : '') + '><span class="box"></span>' +
                    '<span class="ct">' + U.stars(n + .5) + ' <span class="dim small">' + n + '★ ou mais</span></span></label>';
                }).join('') +
                '<label class="check radio"><input type="radio" name="rating" value="0"' + (st.rating ? '' : ' checked') +
                  '><span class="box"></span><span class="ct">Todas</span></label>') +

              fgroup('Ofertas', 'extra', true,
                '<label class="check"><input type="checkbox" name="onSale"' + (st.onSale ? ' checked' : '') +
                  '><span class="box">' + VT.icons.get('check', 12, { stroke: 3 }) + '</span>' +
                  '<span class="ct">Somente promoções</span></label>' +
                '<label class="check"><input type="checkbox" name="inStock"' + (st.inStock ? ' checked' : '') +
                  '><span class="box">' + VT.icons.get('check', 12, { stroke: 3 }) + '</span>' +
                  '<span class="ct">Somente em estoque</span></label>') +

            '</div>' +
            '<div class="filters-foot">' +
              '<button class="btn btn-ghost btn-sm grow" data-clear-filters>Limpar</button>' +
              '<button class="btn btn-primary btn-sm grow only-mobile" data-close-filters>Aplicar</button>' +
            '</div>' +
          '</aside>' +

          /* ---------- resultados ---------- */
          '<div class="cat-results">' +
            '<div class="cat-toolbar">' +
              '<button class="btn btn-outline btn-sm only-mobile" data-open-filters>' +
                VT.icons.get('filter', 15) + ' Filtros</button>' +
              '<span class="res" id="catRes"></span>' +
              '<div style="flex:1 1 auto"></div>' +
              '<div class="segmented only-desktop" role="group" aria-label="Modo de visualização">' +
                '<button data-view="grid"' + (st.view === 'grid' ? ' class="on"' : '') + '>' + VT.icons.get('grid', 15) + ' Grade</button>' +
                '<button data-view="list"' + (st.view === 'list' ? ' class="on"' : '') + '>' + VT.icons.get('list', 15) + ' Lista</button>' +
              '</div>' +
              '<select class="select sort-select" id="sortSel" aria-label="Ordenar por">' +
                SORTS.map(function (s) {
                  return '<option value="' + s.id + '"' + (st.sort === s.id ? ' selected' : '') + '>' + esc(s.label) + '</option>';
                }).join('') +
              '</select>' +
            '</div>' +
            '<div id="chipsActive"></div>' +
            '<div id="catGrid"></div>' +
            '<div id="catPager"></div>' +
          '</div>' +

        '</div>' +
      '</div>';

      function fgroup(title, key, open, inner) {
        return '<div class="fgroup' + (open ? ' open' : '') + '" data-group="' + key + '">' +
          '<button class="fgroup-btn" type="button">' + esc(title) + ' <span class="chev">' + VT.icons.get('chevronDown', 16) + '</span></button>' +
          '<div class="fgroup-panel"><div><div class="fgroup-inner">' + inner + '</div></div></div>' +
          '</div>';
      }
    },

    mount: function (root, params) {
      var self = this;
      var st = this.state(params || {});
      var filtersEl = root.querySelector('#filters');
      var gridEl = root.querySelector('#catGrid');
      var pagerEl = root.querySelector('#catPager');
      var resEl = root.querySelector('#catRes');
      var chipsEl = root.querySelector('#chipsActive');

      /* ---------- render dos resultados ---------- */
      function update() {
        var res = VT.catalog.query({
          q: st.q, cat: st.cat, brands: st.brands,
          minPrice: st.min, maxPrice: st.max,
          minRating: st.rating, onSale: st.onSale, inStock: st.inStock,
          sort: st.sort
        });
        var pages = Math.max(1, Math.ceil(res.length / PER_PAGE));
        if (st.page > pages) st.page = pages;
        var slice = res.slice((st.page - 1) * PER_PAGE, st.page * PER_PAGE);

        resEl.innerHTML = '<b>' + res.length + '</b> ' +
          (res.length === 1 ? 'produto' : 'produtos') +
          (st.q ? ' para “' + esc(st.q) + '”' : '');

        if (!res.length) {
          gridEl.innerHTML = U.empty('search', 'Nenhum resultado encontrado',
            'Tente ajustar os filtros, buscar por outra palavra-chave ou limpar a seleção.',
            '<button class="btn btn-primary mt-4" data-clear-filters>Limpar filtros</button>');
        } else {
          gridEl.innerHTML = '<div class="prod-grid' + (st.view === 'list' ? ' list-view' : '') + '">' +
            slice.map(function (p) { return U.productCard(p, { list: st.view === 'list' }); }).join('') + '</div>';
        }
        pagerEl.innerHTML = U.pager(st.page, pages);
        renderChips();
        D.observeReveal(gridEl);
      }

      function renderChips() {
        var list = [];
        if (st.q) list.push({ label: 'Busca: ' + st.q, fn: function () { st.q = ''; } });
        if (st.cat) {
          var c = VT.catalog.catById[st.cat];
          list.push({ label: (c ? c.emoji + ' ' + c.name : st.cat), fn: function () { st.cat = ''; } });
        }
        st.brands.forEach(function (b) {
          list.push({ label: b, fn: function () { st.brands = st.brands.filter(function (x) { return x !== b; }); } });
        });
        if (st.min > VT.catalog.priceRange.min || st.max < VT.catalog.priceRange.max) {
          list.push({
            label: F.brl(st.min) + ' – ' + F.brl(st.max),
            fn: function () { st.min = VT.catalog.priceRange.min; st.max = VT.catalog.priceRange.max; }
          });
        }
        if (st.rating) list.push({ label: st.rating + '★ ou mais', fn: function () { st.rating = 0; } });
        if (st.onSale) list.push({ label: 'Promoções', fn: function () { st.onSale = false; } });
        if (st.inStock) list.push({ label: 'Em estoque', fn: function () { st.inStock = false; } });

        chipsEl.innerHTML = list.length
          ? '<div class="chips-active">' +
            list.map(function (c) { return '<button class="chip" data-chip-remove>' + esc(c.label) + ' <span class="x">✕</span></button>'; }).join('') +
            '<button class="chip" data-clear-filters style="border-style:dashed">Limpar tudo</button></div>'
          : '';
        Array.prototype.forEach.call(chipsEl.querySelectorAll('[data-chip-remove]'), function (btn, i) {
          btn.addEventListener('click', function () { st.page = 1; list[i].fn(); syncInputs(); update(); });
        });
      };

      /* ---------- sincroniza os inputs com o estado ---------- */
      function syncInputs() {
        D.qsa('input[name="cat"]', filtersEl).forEach(function (i) { i.checked = (i.value === st.cat); });
        D.qsa('input[name="brand"]', filtersEl).forEach(function (i) { i.checked = st.brands.indexOf(i.value) !== -1; });
        D.qsa('input[name="rating"]', filtersEl).forEach(function (i) { i.checked = (Number(i.value) === st.rating); });
        var onSale = filtersEl.querySelector('input[name="onSale"]');
        var inStock = filtersEl.querySelector('input[name="inStock"]');
        if (onSale) onSale.checked = st.onSale;
        if (inStock) inStock.checked = st.inStock;
        var rMin = root.querySelector('#rMin'), rMax = root.querySelector('#rMax');
        var pMin = root.querySelector('#priceMin'), pMax = root.querySelector('#priceMax');
        if (rMin) { rMin.value = st.min; rMax.value = st.max; pMin.value = st.min; pMax.value = st.max; paintRange(); }
      }

      function paintRange() {
        var pr = VT.catalog.priceRange;
        var fill = root.querySelector('#rangeFill');
        if (!fill) return;
        var a = ((st.min - pr.min) / (pr.max - pr.min)) * 100;
        var b = ((st.max - pr.min) / (pr.max - pr.min)) * 100;
        fill.style.left = Math.min(a, b) + '%';
        fill.style.width = Math.abs(b - a) + '%';
      }

      /* ---------- eventos ---------- */
      /* grupos expansíveis */
      D.delegate(filtersEl, 'click', '.fgroup-btn', function (e, node) {
        node.parentNode.classList.toggle('open');
      });

      /* radio/checkbox */
      filtersEl.addEventListener('change', function (e) {
        var t = e.target;
        if (t.name === 'brand') {
          if (t.checked) { if (st.brands.indexOf(t.value) === -1) st.brands.push(t.value); }
          else st.brands = st.brands.filter(function (x) { return x !== t.value; });
        } else if (t.name === 'cat') { st.cat = t.value; }
        else if (t.name === 'rating') { st.rating = Number(t.value); }
        else if (t.name === 'onSale') { st.onSale = t.checked; }
        else if (t.name === 'inStock') { st.inStock = t.checked; }
        st.page = 1;
        update();
      });

      /* faixa de preço */
      var rMin = root.querySelector('#rMin'), rMax = root.querySelector('#rMax');
      var pMin = root.querySelector('#priceMin'), pMax = root.querySelector('#priceMax');
      function onRange() {
        var a = Number(rMin.value), b = Number(rMax.value);
        if (a > b) { var tmp = a; a = b; b = tmp; }
        st.min = a; st.max = b;
        pMin.value = a; pMax.value = b;
        paintRange(); st.page = 1; update();
      }
      rMin.addEventListener('input', onRange);
      rMax.addEventListener('input', onRange);
      [pMin, pMax].forEach(function (inp) {
        inp.addEventListener('change', function () {
          var a = Number(F.onlyDigits(pMin.value)) || VT.catalog.priceRange.min;
          var b = Number(F.onlyDigits(pMax.value)) || VT.catalog.priceRange.max;
          if (a > b) { var t = a; a = b; b = t; }
          st.min = a; st.max = b;
          rMin.value = a; rMax.value = b;
          paintRange(); st.page = 1; update();
        });
      });
      paintRange();

      /* ordenação */
      root.querySelector('#sortSel').addEventListener('change', function () {
        st.sort = this.value; st.page = 1; update();
      });

      /* visualização */
      D.delegate(root, 'click', '[data-view]', function (e, node) {
        st.view = node.dataset.view;
        S.set('view', st.view);
        D.qsa('[data-view]', root).forEach(function (b) { b.classList.toggle('on', b.dataset.view === st.view); });
        update();
      });

      /* paginação */
      pagerEl.addEventListener('click', function (e) {
        var b = e.target.closest('[data-page]');
        if (!b || b.disabled) return;
        st.page = Number(b.dataset.page);
        update();
        root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      /* limpar filtros */
      D.delegate(root, 'click', '[data-clear-filters]', function () {
        st.q = ''; st.cat = ''; st.brands = []; st.rating = 0; st.onSale = false; st.inStock = false;
        st.min = VT.catalog.priceRange.min; st.max = VT.catalog.priceRange.max; st.page = 1;
        syncInputs(); update();
      });

      /* gaveta de filtros no mobile */
      function closeFilters() {
        filtersEl.classList.remove('open');
        var bd = root.querySelector('.filters-backdrop');
        if (bd && bd.parentNode) bd.parentNode.removeChild(bd);
      }
      D.delegate(root, 'click', '[data-open-filters]', function () {
        filtersEl.classList.add('open');
        if (!root.querySelector('.filters-backdrop')) {
          var bd = document.createElement('div');
          bd.className = 'drawer-backdrop filters-backdrop';
          bd.addEventListener('click', closeFilters);
          root.appendChild(bd);
        }
      });
      D.delegate(root, 'click', '[data-close-filters]', closeFilters);

      update();
    },

    /* chamado quando a URL muda para a mesma página (ex.: busca pelo header) */
    onParams: function (params) {
      this._state = null;
    }
  };
})(window);
