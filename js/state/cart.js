/* ============================================================
   VITRINE PRO — cart.js
   Carrinho: linhas, quantidades, cupons, frete e totais.
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};
  var S = VT.store, F = VT.format;

  function keyOf(id, variant) {
    return id + '::' + (variant && variant.value ? variant.value : '-');
  }

  function lines() { return S.get('cart') || []; }

  function count() {
    return lines().reduce(function (s, l) { return s + l.qty; }, 0);
  }

  function find(key) {
    var ls = lines(), i;
    for (i = 0; i < ls.length; i++) if (ls[i].key === key) return ls[i];
    return null;
  }

  /** Adiciona ao carrinho. Retorna { ok, line, reason } */
  function add(product, qty, variant) {
    qty = Math.max(1, qty || 1);
    var key = keyOf(product.id, variant);
    var ls = lines();
    var line = find(key);
    var available = product.stock == null ? 999 : product.stock;

    if (line) {
      if (line.qty + qty > available) {
        return { ok: false, reason: 'stock', line: line, available: available };
      }
      line.qty += qty;
    } else {
      if (available <= 0) return { ok: false, reason: 'out', available: 0 };
      line = {
        key: key,
        id: product.id,
        qty: Math.min(qty, available),
        variant: variant || null,
        addedAt: Date.now(),
        unit: product.price
      };
      ls.push(line);
    }
    S.set('cart', ls);
    return { ok: true, line: line, available: available };
  }

  function setQty(key, qty) {
    var ls = lines(), i;
    for (i = 0; i < ls.length; i++) {
      if (ls[i].key === key) {
        if (qty <= 0) { ls.splice(i, 1); break; }
        var p = S.product(ls[i].id);
        var max = p && p.stock != null ? p.stock : 999;
        ls[i].qty = Math.min(qty, Math.max(1, max));
        break;
      }
    }
    S.set('cart', ls);
    return ls;
  }

  function inc(key) { return setQty(key, (find(key) ? find(key).qty : 0) + 1); }
  function dec(key) { return setQty(key, (find(key) ? find(key).qty : 0) - 1); }
  function remove(key) {
    S.set('cart', lines().filter(function (l) { return l.key !== key; }));
  }
  function clear() { S.set('cart', []); S.set('coupon', null); S.set('shippingSel', null); }

  /** Linhas resolvidas com dados atuais do produto. */
  function items() {
    return lines().map(function (l) {
      var p = S.product(l.id);
      if (!p) return null;
      return {
        key: l.key,
        qty: l.qty,
        variant: l.variant,
        product: p,
        unit: p.price,
        total: Math.round(p.price * l.qty * 100) / 100,
        stock: p.stock
      };
    }).filter(Boolean);
  }

  /* ------------------------- cupons ------------------------- */
  function findCoupon(code) {
    if (!code) return null;
    var c = (VT.seed.coupons || []).filter(function (x) {
      return x.code === String(code).trim().toUpperCase();
    })[0];
    return c || null;
  }

  /** Aplica cupom. Retorna { ok, msg, coupon } */
  function applyCoupon(code) {
    var c = findCoupon(code);
    if (!c) return { ok: false, msg: 'Cupom não encontrado.' };
    if (!c.active) return { ok: false, msg: 'Este cupom não está mais ativo.' };
    var sub = subtotal();
    if (sub < c.min) return { ok: false, msg: 'Válido para compras acima de ' + F.brl(c.min) + '.' };
    S.set('coupon', c.code);
    return { ok: true, msg: 'Cupom ' + c.code + ' aplicado!', coupon: c };
  }

  function removeCoupon() { S.set('coupon', null); }

  /* ------------------------- frete ------------------------- */
  function subtotal() {
    return Math.round(items().reduce(function (s, i) { return s + i.total; }, 0) * 100) / 100;
  }

  function couponDiscount(sub) {
    var c = findCoupon(S.get('coupon'));
    if (!c || !c.active) return 0;
    if (sub < c.min) return 0;
    var d = c.type === 'percent' ? sub * c.value / 100
      : c.type === 'fixed' ? c.value : 0;
    if (c.max) d = Math.min(d, c.max);
    return Math.min(Math.round(d * 100) / 100, sub);
  }

  function shippingOptions(subAfterDiscount, cep) {
    var cfg = S.settings();
    var free = subAfterDiscount >= cfg.freeShipFrom;
    var base = cfg.shipBase;
    var region = VT.shipping ? VT.shipping.regionOf(cep) : null;
    var mult = region ? region.mult : 1;
    var extraDays = region ? region.extra : 0;

    return [
      {
        id: 'economy', name: 'Econômico', price: free ? 0 : Math.round(base * 0.75 * mult * 100) / 100,
        days: 6 + extraDays, free: free, desc: 'Envio consolidado'
      },
      {
        id: 'standard', name: 'Padrão', price: free ? 0 : Math.round(base * mult * 100) / 100,
        days: 4 + extraDays, free: free, desc: 'Entrega mais escolhida'
      },
      {
        id: 'express', name: 'Expresso', price: free ? Math.round(base * 1.1 * mult * 100) / 100 : Math.round(base * 2.1 * mult * 100) / 100,
        days: 1 + extraDays, free: false, desc: 'Receba em até 2 dias úteis'
      }
    ];
  }

  function selectedShipping(opts) {
    var sel = S.get('shippingSel');
    if (sel && opts.some(function (o) { return o.id === sel.id; })) {
      var match = opts.filter(function (o) { return o.id === sel.id; })[0];
      return { id: match.id, name: match.name, price: match.price, days: match.days };
    }
    var def = opts[1] || opts[0];
    return def ? { id: def.id, name: def.name, price: def.price, days: def.days } : null;
  }

  /* ------------------------- totais ------------------------- */
  function totals(opts) {
    opts = opts || {};
    var its = items();
    var sub = Math.round(its.reduce(function (s, i) { return s + i.total; }, 0) * 100) / 100;
    var coupon = findCoupon(S.get('coupon'));
    var disc = couponDiscount(sub);

    var baseForShip = sub - disc;
    var shipOpts = shippingOptions(baseForShip, opts.cep);
    /* cupom do tipo "shipping" zera o frete */
    if (coupon && coupon.type === 'shipping') {
      shipOpts = shipOpts.map(function (o) { return Object.assign({}, o, { price: 0, free: true }); });
    }
    var ship = opts.shipping != null
      ? opts.shipping
      : (selectedShipping(shipOpts) ? selectedShipping(shipOpts).price : 0);

    var cfg = S.settings();
    var tax = Math.round((baseForShip * (cfg.taxPercent || 0) / 100) * 100) / 100;
    var total = Math.max(0, Math.round((baseForShip + ship + tax) * 100) / 100);

    /* desconto do Pix sobre o total com frete */
    var pixRate = cfg.pixDiscount || 0;
    var pixTotal = Math.round((total * (1 - pixRate / 100)) * 100) / 100;

    var inst = F.installments(total, cfg.instMax || 12, cfg.instFree || 0, (cfg.instRate || 0) / 100);

    return {
      items: its,
      itemCount: its.reduce(function (s, i) { return s + i.qty; }, 0),
      subtotal: sub,
      discount: disc,
      coupon: coupon,
      shipping: ship,
      shippingOptions: shipOpts,
      shippingSel: selectedShipping(shipOpts),
      tax: tax,
      total: total,
      pixRate: pixRate,
      pixTotal: pixTotal,
      pixEconomy: Math.round((total - pixTotal) * 100) / 100,
      installments: inst,
      bestInstallment: inst.filter(function (x) { return x.interestFree; }).pop() || inst[0],
      freeShipMissing: Math.max(0, Math.round((cfg.freeShipFrom - baseForShip) * 100) / 100)
    };
  }

  VT.cart = {
    keyOf: keyOf, lines: lines, count: count, add: add, setQty: setQty,
    inc: inc, dec: dec, remove: remove, clear: clear, items: items,
    subtotal: subtotal, totals: totals,
    applyCoupon: applyCoupon, removeCoupon: removeCoupon, findCoupon: findCoupon,
    shippingOptions: shippingOptions, selectedShipping: selectedShipping
  };
})(window);
