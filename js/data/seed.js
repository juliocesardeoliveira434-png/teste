/* ============================================================
   VITRINE PRO — seed.js
   Gera, de forma determinística, os dados de demonstração do
   painel: clientes, pedidos, avaliações, cupons e séries.
   Nada é aleatório de verdade — a semente garante que os
   números não mudem entre recarregamentos.
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};
  var F = VT.format;

  var FIRST = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João',
    'Karina', 'Lucas', 'Mariana', 'Nathan', 'Olívia', 'Pedro', 'Queila', 'Rafael', 'Sofia', 'Thiago',
    'Ursula', 'Vinícius', 'Wagner', 'Yara', 'Beatriz', 'Caio', 'Daniela', 'Eduardo', 'Fernanda', 'Gustavo',
    'Helena', 'Igor', 'Juliana', 'Kléber', 'Larissa', 'Marcelo', 'Natália', 'Otávio', 'Priscila', 'Renata'];
  var LAST = ['Almeida', 'Barbosa', 'Cardoso', 'Duarte', 'Esteves', 'Ferreira', 'Gomes', 'Higashi', 'Ignácio',
    'Jardim', 'Klein', 'Lima', 'Machado', 'Nogueira', 'Oliveira', 'Pereira', 'Queiroz', 'Ribeiro', 'Santos',
    'Teixeira', 'Vasconcelos', 'Werneck', 'Xavier', 'Zanetti', 'Andrade', 'Batista', 'Correia', 'Dias'];
  var CITIES = [
    ['São Paulo', 'SP'], ['Rio de Janeiro', 'RJ'], ['Belo Horizonte', 'MG'], ['Uberlândia', 'MG'],
    ['Curitiba', 'PR'], ['Porto Alegre', 'RS'], ['Salvador', 'BA'], ['Recife', 'PE'], ['Fortaleza', 'CE'],
    ['Brasília', 'DF'], ['Goiânia', 'GO'], ['Campinas', 'SP'], ['Florianópolis', 'SC'], ['Vitória', 'ES'],
    ['Manaus', 'AM'], ['Niterói', 'RJ'], ['Sorocaba', 'SP'], ['Londrina', 'PR']
  ];
  var STREETS = ['Rua das Acácias', 'Av. Brasil', 'Rua Professor Alceu', 'Av. Afonso Pena', 'Rua Bahia',
    'Av. Paulista', 'Rua XV de Novembro', 'Travessa das Flores', 'Alameda Santos', 'Rua Paraná'];

  var REV_TITLES = [
    'Superou as expectativas', 'Entrega rápida e produto ótimo', 'Vale cada centavo',
    'Boa compra, recomendo', 'Cumpre o que promete', ' Qualidade impressionante',
    'Chegou antes do prazo', 'Design muito bonito', 'Custo-benefício excelente',
    'Atendeu bem minha necessidade', 'Produto top', 'Satisfeito com a compra'
  ];
  var REV_BODY = [
    'Comprei com um pouco de receio, mas o acabamento é realmente muito bom. Uso todos os dias e nada apresentou desgaste até agora.',
    'A entrega foi rápida e a embalagem veio muito bem protegida. Produto original, com nota fiscal e garantia.',
    'Achei o custo-benefício excelente pelo que entrega. Comparei com outras marcas antes e essa foi a melhor escolha sem dúvida.',
    'Atendeu exatamente o que eu precisava. Só acho que poderia vir com mais acessórios na caixa.',
    'Estou usando há três semanas e a bateria continua excelente. Recomendo para quem trabalha fora de casa.',
    'A construção passa muita confiança, dá para perceber que não é produto descartável. Compraria de novo.',
    'Chegou antes do prazo e o suporte respondeu minhas dúvidas em poucas horas. Experiência muito positiva.',
    'Bonito, confortável e funcional. O material é melhor do que eu imaginava pelas fotos do site.',
    'Depois de pesquisar bastante, escolhi este modelo e não me arrependo. Funciona direitinho desde o primeiro dia.',
    'Produto consistente, mas o frete demorou um pouco mais do que eu gostaria. No geral, valeu a pena.'
  ];

  var STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'delivered', 'delivered', 'cancelled'];
  var PAYMENTS = [['pix', 45], ['card', 42], ['boleto', 13]];

  /* ------------------------- clientes ------------------------- */
  var customers = (function () {
    var r = VT.rng('customers-v1'), out = [], i;
    for (i = 0; i < 48; i++) {
      var name = r.pick(FIRST) + ' ' + r.pick(LAST);
      var city = r.pick(CITIES);
      var email = F.slug(name).replace(/-/g, '.') + i + '@' + r.pick(['gmail.com', 'hotmail.com', 'outlook.com', 'uol.com.br']);
      out.push({
        id: 'c-' + (1000 + i),
        name: name,
        email: email,
        phone: '(34) 9' + F.randomDigits(4) + '-' + F.randomDigits(4),
        doc: F.randomDigits(3) + '.' + F.randomDigits(3) + '.' + F.randomDigits(3) + '-' + F.randomDigits(2),
        city: city[0], state: city[1],
        cep: '3840' + F.randomDigits(2) + '-' + F.randomDigits(3),
        createdAt: F.addDays(Date.now(), -r.int(5, 700)),
        avatarHue: r.int(0, 359),
        tags: r.chance(.18) ? ['VIP'] : (r.chance(.12) ? ['Risco'] : [])
      });
    }
    /* cliente de demonstração para a área "minha conta" */
    out.unshift({
      id: 'c-demo', name: 'Visitante Demo', email: 'demo@vitrine.com', phone: '(34) 99999-0000',
      doc: '123.456.789-00', city: 'Uberlândia', state: 'MG', cep: '38400-100',
      createdAt: F.addDays(Date.now(), -420), avatarHue: 250, tags: ['VIP'], demo: true
    });
    return out;
  })();

  /* ------------------------- cupons ------------------------- */
  var coupons = [
    { code: 'BEMVINDO10', type: 'percent', value: 10, min: 0, max: 0, active: true, uses: 128, desc: 'Primeira compra' },
    { code: 'FRETEZERO', type: 'shipping', value: 100, min: 150, max: 0, active: true, uses: 341, desc: 'Frete grátis acima de R$ 150' },
    { code: 'VITRINE15', type: 'percent', value: 15, min: 400, max: 500, active: true, uses: 62, desc: 'Campanha de lançamento' },
    { code: 'BLACKFRIDAY', type: 'percent', value: 25, min: 800, max: 0, active: false, uses: 0, desc: 'Expirado' },
    { code: 'PRIMEIRA50', type: 'fixed', value: 50, min: 300, max: 0, active: true, uses: 17, desc: 'R$ 50 off' }
  ];

  /* ------------------------- pedidos ------------------------- */
  function makeOrders() {
    var r = VT.rng('orders-v2');
    var prods = VT.catalog.products;
    var out = [], i;
    var today = new Date();

    for (i = 0; i < 168; i++) {
      var daysAgo = r.int(0, 119);
      var created = new Date(today.getTime() - daysAgo * 86400000 - r.int(0, 23) * 3600000 - r.int(0, 59) * 60000);
      var customer = r.chance(.14) ? customers[0] : r.pick(customers);

      var nItems = r.weighted([[1, 55], [2, 25], [3, 13], [4, 7]]);
      var items = [], subtotal = 0, used = {};
      for (var k = 0; k < nItems; k++) {
        var p = r.pick(prods);
        if (used[p.id]) { p = r.pick(prods); }
        used[p.id] = 1;
        var qty = r.weighted([[1, 72], [2, 20], [3, 6], [4, 2]]);
        var price = p.price;
        var variant = null;
        if (p.colors) variant = { type: 'Cor', value: r.pick(p.colors).n };
        else if (p.sizes) variant = { type: 'Tamanho', value: r.pick(p.sizes).n };
        items.push({
          id: p.id, name: p.name, slug: p.slug, brand: p.brand, art: p.art, hue: p.hue,
          price: price, qty: qty, variant: variant
        });
        subtotal += price * qty;
      }

      var status;
      if (daysAgo > 25) status = r.weighted([['delivered', 82], ['cancelled', 8], ['shipped', 5], ['paid', 5]]);
      else if (daysAgo > 5) status = r.weighted([['delivered', 45], ['shipped', 30], ['paid', 15], ['cancelled', 5], ['pending', 5]]);
      else status = r.weighted([['pending', 42], ['paid', 33], ['shipped', 15], ['delivered', 6], ['cancelled', 4]]);

      var coupon = null, discount = 0;
      if (r.chance(.22)) {
        var c = r.pick(coupons.filter(function (x) { return x.active; }));
        if (subtotal >= c.min) {
          coupon = c.code;
          discount = c.type === 'percent' ? subtotal * c.value / 100
            : c.type === 'fixed' ? Math.min(c.value, subtotal) : 0;
          if (c.max) discount = Math.min(discount, c.max);
          discount = Math.round(discount * 100) / 100;
        }
      }

      var shipping = subtotal - discount >= 299 || r.chance(.2) ? 0 : (r.pick([19.9, 24.9, 29.9, 34.9, 44.9]));
      var total = Math.max(0, subtotal - discount + shipping);
      var payment = r.weighted(PAYMENTS);

      out.push({
        id: 'VT-' + created.getFullYear().toString().slice(2) + F.pad(created.getMonth() + 1) + '-' + F.randomDigits(5),
        code: 'VT-' + created.getFullYear().toString().slice(2) + F.pad(created.getMonth() + 1) + '-' + F.randomDigits(5),
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        createdAt: created,
        status: status,
        items: items,
        subtotal: Math.round(subtotal * 100) / 100,
        discount: discount,
        shipping: shipping,
        total: Math.round(total * 100) / 100,
        coupon: coupon,
        payment: payment,
        installments: payment === 'card' ? r.weighted([[1, 40], [2, 16], [3, 14], [6, 12], [10, 10], [12, 8]]) : 1,
        tracking: status === 'shipped' || status === 'delivered' ? 'BR' + F.randomDigits(9) + 'BR' : null,
        deliveredAt: status === 'delivered' ? F.addDays(created, r.int(2, 9)) : null,
        city: customer.city, state: customer.state
      });
    }
    return out.sort(function (a, b) { return b.createdAt - a.createdAt; });
  }

  var orders = makeOrders();

  /* enriquece clientes com métricas derivadas dos pedidos */
  (function () {
    customers.forEach(function (c) { c.orders = 0; c.spent = 0; c.lastOrder = null; });
    orders.forEach(function (o) {
      var c = customers.filter(function (x) { return x.id === o.customerId; })[0];
      if (!c) return;
      if (o.status === 'cancelled') return;
      c.orders += 1;
      c.spent += o.total;
      if (!c.lastOrder || o.createdAt > c.lastOrder) c.lastOrder = o.createdAt;
    });
    customers.forEach(function (c) {
      c.spent = Math.round(c.spent * 100) / 100;
      c.ticket = c.orders ? Math.round((c.spent / c.orders) * 100) / 100 : 0;
    });
  })();

  /* ------------------------- avaliações ------------------------- */
  var reviewCache = {};
  function reviewsFor(productId) {
    if (reviewCache[productId]) return reviewCache[productId];
    var p = VT.catalog.byId[productId];
    if (!p) return [];
    var r = VT.rng('reviews-' + productId);
    var n = Math.min(8, Math.max(3, Math.round(p.reviews / 40)));
    var out = [], i;
    for (i = 0; i < n; i++) {
      var name = r.pick(FIRST) + ' ' + r.pick(LAST).charAt(0) + '.';
      var rating = r.weighted([[5, 58], [4, 26], [3, 9], [2, 4], [1, 3]]);
      if (p.rating >= 4.7 && rating < 4) rating = 4;
      out.push({
        id: 'r-' + productId + '-' + i,
        name: name,
        rating: rating,
        title: r.pick(REV_TITLES).trim(),
        body: r.pick(REV_BODY),
        date: F.addDays(Date.now(), -r.int(2, 400)),
        verified: r.chance(.72),
        helpful: r.int(0, 48),
        hue: r.int(0, 359)
      });
    }
    out.sort(function (a, b) { return b.date - a.date; });
    reviewCache[productId] = out;
    return out;
  }

  /** Distribuição 1..5 estrelas coerente com a nota média. */
  function ratingBreakdown(p) {
    var r = VT.rng('bd-' + p.id);
    var total = p.reviews || 1;
    var weights = [0.02, 0.03, 0.09, 0.24, 0.62];
    if (p.rating < 4.6) weights = [0.04, 0.06, 0.14, 0.32, 0.44];
    if (p.rating < 4.3) weights = [0.07, 0.10, 0.20, 0.33, 0.30];
    var counts = weights.map(function (x) { return Math.round(total * x * r.float(.9, 1.1)); });
    var sum = counts.reduce(function (a, b) { return a + b; }, 0);
    counts[4] += total - sum;
    return counts.map(function (c, i) { return { star: i + 1, count: Math.max(0, c), pct: Math.round(c / total * 100) }; });
  }

  /* ------------------------- séries temporais ------------------------- */
  /** Receita/pedidos por dia dos últimos N dias. */
  function salesSeries(days) {
    days = days || 30;
    var out = [], i;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    for (i = days - 1; i >= 0; i--) {
      var d = new Date(today.getTime() - i * 86400000);
      var real = orders.filter(function (o) {
        if (o.status === 'cancelled') return false;
        var od = new Date(o.createdAt); od.setHours(0, 0, 0, 0);
        return od.getTime() === d.getTime();
      });
      out.push({
        date: d,
        label: F.dateShort(d),
        orders: real.length,
        revenue: real.reduce(function (s, o) { return s + o.total; }, 0)
      });
    }
    return out;
  }

  /** Receita agrupada por categoria. */
  function categoryRevenue() {
    var map = {};
    orders.forEach(function (o) {
      if (o.status === 'cancelled') return;
      o.items.forEach(function (it) {
        var p = VT.catalog.byId[it.id];
        if (!p) return;
        map[p.cat] = (map[p.cat] || 0) + it.price * it.qty;
      });
    });
    return VT.catalog.categories.map(function (c) {
      return { id: c.id, name: c.name, emoji: c.emoji, hue: c.hue, value: Math.round(map[c.id] || 0) };
    }).sort(function (a, b) { return b.value - a.value; });
  }

  /** Produtos mais vendidos. */
  function topProducts(n) {
    var map = {};
    orders.forEach(function (o) {
      if (o.status === 'cancelled') return;
      o.items.forEach(function (it) {
        if (!map[it.id]) map[it.id] = { product: VT.catalog.byId[it.id], qty: 0, revenue: 0 };
        map[it.id].qty += it.qty;
        map[it.id].revenue += it.price * it.qty;
      });
    });
    return Object.keys(map).map(function (k) {
      var m = map[k];
      m.revenue = Math.round(m.revenue * 100) / 100;
      return m;
    }).filter(function (m) { return m.product; })
      .sort(function (a, b) { return b.revenue - a.revenue; }).slice(0, n || 5);
  }

  /** Distribuição por forma de pagamento. */
  function paymentMix() {
    var map = { pix: 0, card: 0, boleto: 0 };
    orders.forEach(function (o) { if (o.status !== 'cancelled') map[o.payment] += o.total; });
    return [
      { id: 'pix', name: 'Pix', value: Math.round(map.pix), hue: 165 },
      { id: 'card', name: 'Cartão', value: Math.round(map.card), hue: 250 },
      { id: 'boleto', name: 'Boleto', value: Math.round(map.boleto), hue: 38 }
    ];
  }

  /** Funil de conversão (visitas simuladas coerentes com os pedidos). */
  function funnel() {
    var r = VT.rng('funnel-v1');
    var delivered = orders.filter(function (o) { return o.status !== 'cancelled'; }).length;
    var checkout = Math.round(delivered / r.float(.34, .42));
    var cart = Math.round(checkout / r.float(.52, .62));
    var product = Math.round(cart / r.float(.28, .36));
    var visits = Math.round(product / r.float(.40, .48));
    return [
      { label: 'Visitas', value: visits },
      { label: 'Produto', value: product },
      { label: 'Carrinho', value: cart },
      { label: 'Checkout', value: checkout },
      { label: 'Pedidos', value: delivered }
    ];
  }

  /** KPIs do período. */
  function kpis(days) {
    days = days || 30;
    var from = Date.now() - days * 86400000;
    var cur = orders.filter(function (o) { return o.status !== 'cancelled' && new Date(o.createdAt) >= from; });
    var prev = orders.filter(function (o) {
      if (o.status === 'cancelled') return false;
      var t = new Date(o.createdAt).getTime();
      return t >= Date.now() - days * 2 * 86400000 && t < from;
    });
    function sum(list, f) { return list.reduce(function (s, o) { return s + (f ? f(o) : o.total); }, 0); }
    var rev = sum(cur), revPrev = sum(prev);
    var ticket = cur.length ? rev / cur.length : 0;
    var ticketPrev = prev.length ? revPrev / prev.length : 0;
    function delta(a, b) { return b ? ((a - b) / b) * 100 : 0; }
    return {
      revenue: rev,
      revenueDelta: delta(rev, revPrev),
      orders: cur.length,
      ordersDelta: delta(cur.length, prev.length),
      ticket: ticket,
      ticketDelta: delta(ticket, ticketPrev),
      customers: new Set(cur.map(function (o) { return o.customerId; })).size,
      items: sum(cur, function (o) { return o.items.reduce(function (s, i) { return s + i.qty; }, 0); }),
      conversion: 2.4 + (rev > 0 ? 0.6 : 0),
      pending: orders.filter(function (o) { return o.status === 'pending'; }).length,
      conversionDelta: 0.3
    };
  }

  VT.seed = {
    customers: customers,
    orders: orders,
    coupons: coupons,
    reviewsFor: reviewsFor,
    ratingBreakdown: ratingBreakdown,
    salesSeries: salesSeries,
    categoryRevenue: categoryRevenue,
    topProducts: topProducts,
    paymentMix: paymentMix,
    funnel: funnel,
    kpis: kpis,
    cities: CITIES,
    demoEmail: 'demo@vitrine.com'
  };
})(window);
