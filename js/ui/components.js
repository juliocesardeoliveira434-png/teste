/* ============================================================
   VITRINE PRO — components.js
   Componentes de UI renderizáveis em string (produtos, preços,
   avaliações, paginação, estados vazios…).
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};
  var F = VT.format, D = VT.dom, S = VT.store;
  var esc = D.esc;

  /* ------------------------- avaliação ------------------------- */
  function stars(rating, size) {
    var out = '', i;
    var full = Math.floor(rating);
    var half = rating - full >= .4;
    for (i = 1; i <= 5; i++) {
      var cls = i <= full ? 'on' : (half && i === full + 1 ? 'half' : '');
      out += VT.icons.get('star', size || 15, { filled: true, cls: cls, style: cls ? '' : 'opacity:.28' });
    }
    return out;
  }

  function rating(r, count, opts) {
    opts = opts || {};
    return '<span class="rating' + (opts.lg ? ' rating-lg' : '') + '">' + stars(r, opts.size) +
      (opts.noVal ? '' : '<span class="rating-val">' + String(r).replace('.', ',') + '</span>') +
      (count != null ? '<span class="rating-val dim" style="font-weight:500">(' + F.num(count) + ')</span>' : '') +
      '</span>';
  }

  /* ------------------------- preço ------------------------- */
  function price(p, opts) {
    opts = opts || {};
    var off = F.discount(p.old, p.price);
    var pixRate = S.settings().pixDiscount || 0;
    var pix = Math.round(p.price * (1 - pixRate / 100) * 100) / 100;
    var cls = 'price' + (opts.cls ? ' ' + opts.cls : '');
    return '<span class="row gap-2 wrap" style="align-items:baseline">' +
      '<span class="' + cls + '">' + F.brl(p.price) + '</span>' +
      (off ? '<span class="price-old">' + F.brl(p.old) + '</span>' : '') +
      (off >= 3 ? '<span class="price-off">-' + off + '%</span>' : '') +
      '</span>' +
      (opts.pix !== false && pixRate > 0
        ? '<span class="price-pix">' + F.brl(pix) + ' <b>no Pix</b></span>' : '');
  }

  function priceBlock(p, opts) {
    opts = opts || {};
    var pixRate = S.settings().pixDiscount || 0;
    var pix = Math.round(p.price * (1 - pixRate / 100) * 100) / 100;
    var off = F.discount(p.old, p.price);
    var inst = F.installments(p.price, S.settings().instMax || 12, S.settings().instFree || 6, (S.settings().instRate || 0) / 100);
    var best = inst.filter(function (x) { return x.interestFree; }).pop() || inst[0];
    return '<div class="pdp-price-box">' +
      '<div class="row gap-3 wrap" style="align-items:baseline">' +
        '<span class="price price-xl">' + F.brl(p.price) + '</span>' +
        (off ? '<span class="price-old" style="font-size:var(--fs-md)">' + F.brl(p.old) + '</span>' : '') +
        (off >= 3 ? '<span class="badge badge-ok">-' + off + '% OFF</span>' : '') +
      '</div>' +
      (pixRate > 0
        ? '<div class="pix"><div class="row gap-2 wrap" style="align-items:baseline">' +
            '<span class="v">' + F.brl(pix) + '</span>' +
            '<span class="badge badge-ok">Pix ' + pixRate + '% off</span>' +
          '</div></div>' : '') +
      '<div class="parcel">ou <b>' + best.count + 'x de ' + F.brl(best.value) + '</b>' +
        (best.interestFree ? ' sem juros' : ' (' + F.brl(best.total) + ')') + '</div>' +
      '</div>';
  }

  /* ------------------------- avatar ------------------------- */
  function avatar(name, hue, cls) {
    var h = hue == null
      ? (Math.abs(String(name || '?').split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0)) % 360)
      : hue;
    return '<span class="avatar ' + (cls || '') + '" style="background:linear-gradient(140deg,hsl(' + h +
      ' 72% 55%),hsl(' + ((h + 40) % 360) + ' 70% 45%))">' + esc(F.initials(name)) + '</span>';
  }

  /* ------------------------- etiquetas ------------------------- */
  function tags(p) {
    var out = [];
    if (p.old > 0 && F.discount(p.old, p.price) >= 3) out.push('<span class="badge badge-accent">Oferta</span>');
    if (p.isNew) out.push('<span class="badge badge-brand">Novo</span>');
    if (p.isBest) out.push('<span class="badge badge-dark">Mais vendido</span>');
    if (p.stock === 0) out.push('<span class="badge badge-danger">Esgotado</span>');
    else if (p.stock > 0 && p.stock <= 5) out.push('<span class="badge badge-warn">Últimas ' + p.stock + '</span>');
    return out.join('');
  }

  /* ------------------------- cartão de produto ------------------------- */
  function productCard(p, opts) {
    opts = opts || {};
    var fav = S.isFav(p.id);
    var outOfStock = p.stock === 0;
    var cls = 'pcard' + (opts.list ? ' list' : '');
    var pixRate = S.settings().pixDiscount || 0;
    var pix = Math.round(p.price * (1 - pixRate / 100) * 100) / 100;

    return '<article class="' + cls + '" data-product="' + esc(p.id) + '">' +
      '<div class="pcard-fig">' +
        '<a class="pcard-media" href="#/produto/' + esc(p.slug) + '" data-link aria-label="' + esc(p.name) + '">' +
          VT.art.product(p.art, p.hue) +
        '</a>' +
        '<div class="pcard-tags">' + tags(p) + '</div>' +
        '<button class="pcard-fav' + (fav ? ' on' : '') + '" data-fav="' + esc(p.id) + '" aria-label="Favoritar" title="Favoritar">' +
          VT.icons.get('heart', 17, { filled: fav }) +
        '</button>' +
        '<div class="pcard-quick">' +
          (outOfStock
            ? '<button class="btn btn-outline btn-block btn-sm" disabled>Esgotado</button>'
            : '<button class="btn btn-primary btn-block btn-sm" data-add="' + esc(p.id) + '">' +
                VT.icons.get('cart', 16) + ' Adicionar</button>') +
        '</div>' +
      '</div>' +
      '<div class="pcard-body">' +
        '<span class="pcard-brand">' + esc(p.brand) + '</span>' +
        '<h3 class="pcard-name"><a href="#/produto/' + esc(p.slug) + '" data-link>' + esc(p.name) + '</a></h3>' +
        '<div class="pcard-rate">' + rating(p.rating, p.reviews) + '</div>' +
        (opts.list && p.desc
          ? '<p class="pcard-desc">' + esc(F.truncate(p.desc, 180)) + '</p>' : '') +
        '<div class="pcard-price">' + price(p) + '</div>' +
        (p.price >= 199
          ? '<span class="pcard-ship">' + VT.icons.get('truck', 13) + ' Frete grátis</span>' : '') +
      '</div>' +
      (opts.list
        ? '<div class="pcard-side">' +
            '<div class="col gap-2">' + price(p, { cls: 'price-lg' }) + '</div>' +
            (outOfStock
              ? '<button class="btn btn-outline btn-block" disabled>Esgotado</button>'
              : '<button class="btn btn-primary btn-block" data-add="' + esc(p.id) + '">' +
                  VT.icons.get('cart', 17) + ' Adicionar</button>') +
            '<a class="btn btn-ghost btn-sm btn-block" href="#/produto/' + esc(p.slug) + '" data-link>Ver detalhes</a>' +
          '</div>'
        : '') +
      '</article>';
  }

  /* ------------------------- estados ------------------------- */
  function empty(icon, title, text, action) {
    return '<div class="empty">' +
      '<div class="ei">' + VT.icons.get(icon || 'package', 34) + '</div>' +
      '<h4>' + esc(title) + '</h4>' +
      '<p>' + (text ? esc(text) : '') + '</p>' +
      (action || '') +
      '</div>';
  }

  function skeletonCards(n) {
    var out = '', i;
    for (i = 0; i < (n || 8); i++) {
      out += '<div class="col gap-2">' +
        '<div class="sk sk-card"></div>' +
        '<div class="sk sk-line w80"></div>' +
        '<div class="sk sk-line w40"></div>' +
        '</div>';
    }
    return '<div class="prod-grid">' + out + '</div>';
  }

  /* ------------------------- paginação ------------------------- */
  function pager(page, pages) {
    if (pages <= 1) return '';
    var out = '<div class="pager">';
    out += '<button data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + ' aria-label="Anterior">' +
      VT.icons.get('chevronLeft', 16) + '</button>';
    var i, from = Math.max(1, page - 2), to = Math.min(pages, from + 4);
    from = Math.max(1, to - 4);
    if (from > 1) {
      out += '<button data-page="1">1</button>';
      if (from > 2) out += '<span class="dots">…</span>';
    }
    for (i = from; i <= to; i++) {
      out += '<button data-page="' + i + '"' + (i === page ? ' class="on" aria-current="page"' : '') + '>' + i + '</button>';
    }
    if (to < pages) {
      if (to < pages - 1) out += '<span class="dots">…</span>';
      out += '<button data-page="' + pages + '">' + pages + '</button>';
    }
    out += '<button data-page="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + ' aria-label="Próxima">' +
      VT.icons.get('chevronRight', 16) + '</button>';
    return out + '</div>';
  }

  /* ------------------------- breadcrumb ------------------------- */
  function crumbs(items) {
    return '<nav class="crumbs" aria-label="Trilha de navegação">' +
      items.map(function (it, i) {
        var sep = i ? '<span class="sep">/</span>' : '';
        return sep + (it.href
          ? '<a href="' + esc(it.href) + '" data-link>' + esc(it.label) + '</a>'
          : '<span class="cur">' + esc(it.label) + '</span>');
      }).join('') +
      '</nav>';
  }

  /* ------------------------- títulos de seção ------------------------- */
  function sectionHead(eyebrow, title, sub, action) {
    return '<div class="row-b wrap gap-3 section-head" data-reveal>' +
      '<div style="min-width:0">' +
        (eyebrow ? '<div class="eyebrow mb-2">' + esc(eyebrow) + '</div>' : '') +
        '<h2>' + esc(title) + '</h2>' +
        (sub ? '<p class="sub">' + esc(sub) + '</p>' : '') +
      '</div>' +
      (action || '') +
      '</div>';
  }

  /* ------------------------- status ------------------------- */
  function statusBadge(status) {
    return '<span class="st st-' + status + '">' + esc(VT.payments.STATUS_LABEL[status] || status) + '</span>';
  }

  function stockPill(stock) {
    if (stock === 0) return '<span class="stock-pill out">Esgotado</span>';
    if (stock <= 5) return '<span class="stock-pill low">' + stock + ' un.</span>';
    return '<span class="stock-pill ok">' + stock + ' un.</span>';
  }

  /* ------------------------- controle de quantidade ------------------------- */
  function qty(value, max, cls) {
    max = max == null ? 99 : max;
    return '<span class="qty ' + (cls || '') + '">' +
      '<button data-qty="dec" aria-label="Diminuir"' + (value <= 1 ? ' disabled' : '') + '>−</button>' +
      '<span class="v" data-qty-val>' + value + '</span>' +
      '<button data-qty="inc" aria-label="Aumentar"' + (value >= max ? ' disabled' : '') + '>+</button>' +
      '</span>';
  }

  /* ------------------------- KPI (admin) ------------------------- */
  function kpi(o) {
    var up = o.delta >= 0;
    return '<div class="kpi ' + (o.cls || '') + '">' +
      '<div class="kh">' +
        '<div>' +
          '<div class="kl">' + esc(o.label) + '</div>' +
          '<div class="kv">' + esc(o.value) + '</div>' +
        '</div>' +
        '<div class="ki">' + VT.icons.get(o.icon || 'chart', 20) + '</div>' +
      '</div>' +
      '<div class="kf">' +
        (o.delta != null
          ? '<span class="delta ' + (up ? 'up' : 'down') + '">' +
              VT.icons.get(up ? 'trendUp' : 'trendDown', 13) + ' ' +
              (up ? '+' : '') + F.pct(o.delta, 1).replace('.0', '') +
            '</span>' : '') +
        '<span class="dim">' + esc(o.foot || 'vs. período anterior') + '</span>' +
      '</div>' +
      '</div>';
  }

  /* ------------------------- benefícios ------------------------- */
  var BENEFITS = [
    { icon: 'truck', t: 'Frete grátis', s: 'acima de R$ 299 para todo o Brasil' },
    { icon: 'shieldCheck', t: 'Compra protegida', s: '7 dias para trocar ou devolver' },
    { icon: 'pix', t: 'Pix com desconto', s: 'aprovação imediata e 5% off' },
    { icon: 'award', t: 'Garantia estendida', s: 'até 24 meses nos produtos premium' }
  ];
  function benefits() {
    return '<section class="benefits"><div class="benefits-in">' +
      BENEFITS.map(function (b) {
        return '<div class="benefit">' +
          '<div class="bi">' + VT.icons.get(b.icon, 21) + '</div>' +
          '<div><div class="bt">' + esc(b.t) + '</div><div class="bs">' + esc(b.s) + '</div></div>' +
          '</div>';
      }).join('') +
      '</div></section>';
  }

  VT.ui = {
    stars: stars, rating: rating, price: price, priceBlock: priceBlock, avatar: avatar,
    tags: tags, productCard: productCard, empty: empty, skeletonCards: skeletonCards,
    pager: pager, crumbs: crumbs, sectionHead: sectionHead, statusBadge: statusBadge,
    stockPill: stockPill, qty: qty, kpi: kpi, benefits: benefits, BENEFITS: BENEFITS
  };
})(window);
