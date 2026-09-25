/* ============================================================
   VITRINE PRO — pages/home.js
   Capa da loja: hero, categorias, destaques, ofertas,
   marcas, prova social e newsletter.
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};
  var F = VT.format, D = VT.dom, S = VT.store, U = VT.ui;
  var esc = D.esc;

  VT.pages = VT.pages || {};

  VT.pages.home = {
    title: 'Vitrine — sua loja online completa',

    render: function () {
      var cats = VT.catalog.categories;
      var featured = VT.catalog.products.filter(function (p) { return p.featured; }).slice(0, 8);
      var deals = VT.catalog.products.filter(function (p) { return p.old > 0 && p.stock > 0; })
        .sort(function (a, b) { return F.discount(b.old, b.price) - F.discount(a.old, a.price); }).slice(0, 8);
      var best = VT.catalog.products.slice().sort(function (a, b) { return b.reviews - a.reviews; }).slice(0, 8);
      var totalProducts = VT.catalog.products.length;
      var avgRating = VT.catalog.products.reduce(function (s, p) { return s + p.rating; }, 0) / totalProducts;

      /* depoimentos: pega as melhores avaliações dos produtos destaque */
      var testimonials = [];
      featured.slice(0, 6).forEach(function (p) {
        var rs = VT.seed.reviewsFor(p.id);
        if (rs && rs[0]) {
          testimonials.push({ r: rs[0], product: p.name, hue: p.hue });
        }
      });

      return '' +
      /* ===== HERO ===== */
      '<section class="hero">' +
        '<div class="hero-in">' +
          '<div class="hero-copy">' +
            '<span class="hero-badge"><b>Novo</b> Catálogo 2026 já disponível</span>' +
            '<h1>Sua loja online <em>completa</em>, pronta para vender.</h1>' +
            '<p class="lead">Catálogo, carrinho, checkout com Pix, cartão e boleto, painel administrativo e relatórios. ' +
              'Tudo responsivo — do celular ao desktop — e funcionando sem depender de servidor.</p>' +
            '<div class="hero-cta">' +
              '<a class="btn btn-primary btn-lg" href="#/categoria" data-link>' + VT.icons.get('bag', 19) + ' Explorar catálogo</a>' +
              '<a class="btn btn-outline btn-lg" href="#/planos" data-link>' + VT.icons.get('zap', 18) + ' Ver planos</a>' +
            '</div>' +
            '<div class="hero-stats">' +
              '<div class="hs"><div class="n">' + F.num(totalProducts) + '+</div><div class="l">produtos</div></div>' +
              '<div class="hs"><div class="n">' + cats.length + '</div><div class="l">categorias</div></div>' +
              '<div class="hs"><div class="n">' + avgRating.toFixed(1).replace('.', ',') + '</div><div class="l">nota média</div></div>' +
              '<div class="hs"><div class="n">24h</div><div class="l">despachamos</div></div>' +
            '</div>' +
          '</div>' +
          '<div class="hero-art">' +
            '<div class="ha-card ha-1">' + VT.art.product('headphones', 262) + '</div>' +
            '<div class="ha-card ha-2">' + VT.art.product('watch', 200) + '</div>' +
            '<div class="ha-card ha-3">' + VT.art.product('camera', 330) + '</div>' +
            '<div class="ha-pill">' + VT.icons.get('pix', 15, { filled: true }) + ' 5% off no Pix</div>' +
            '<div class="ha-float">' +
              '<div class="ic">' + VT.icons.get('checkCircle', 20) + '</div>' +
              '<div><div class="t1">Pagamento aprovado</div><div class="t2">agora mesmo · Pix</div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +

      /* ===== BENEFÍCIOS ===== */
      U.benefits() +

      /* ===== CATEGORIAS ===== */
      '<section class="section shell-wide">' +
        U.sectionHead('Navegue por', 'Todas as categorias',
          'Do áudio ao setup gamer — encontre exatamente o que procura.',
          '<a class="btn btn-ghost btn-sm" href="#/categoria" data-link>Ver tudo ' + VT.icons.get('arrowRight', 16) + '</a>') +
        '<div class="cat-grid">' +
          cats.map(function (c) {
            return '<a class="cat-card" href="#/categoria?cat=' + esc(c.id) + '" data-link>' +
              '<div class="cc-ico">' + c.emoji + '</div>' +
              '<div class="cc-n">' + esc(c.name) + '</div>' +
              '<div class="cc-c">' + c.count + ' produtos</div>' +
              '</a>';
          }).join('') +
        '</div>' +
      '</section>' +

      /* ===== DESTAQUES ===== */
      '<section class="section shell-wide" style="background:var(--surface);border-block:1px solid var(--line)">' +
        '<div class="shell" style="padding-inline:0">' +
          U.sectionHead('Seleção da curadoria', 'Produtos em destaque',
            'Escolhidos pela nossa equipe pelo conjunto de qualidade, avaliações e preço.',
            '<a class="btn btn-ghost btn-sm" href="#/categoria?sort=rating" data-link>Mais bem avaliados ' + VT.icons.get('arrowRight', 16) + '</a>') +
          '<div class="prod-grid">' +
            featured.map(function (p) { return U.productCard(p); }).join('') +
          '</div>' +
        '</div>' +
      '</section>' +

      /* ===== BANNER ===== */
      '<section class="section shell-wide">' +
        '<div class="promo">' +
          '<div class="promo-art">' + VT.art.product('laptop', 250, { decor: true }) + '</div>' +
          '<div class="promo-body">' +
            '<span class="eyebrow">Setup completo</span>' +
            '<h2>Monte seu escritório em casa com 15% off</h2>' +
            '<p>Cadeiras ergonômicas, monitores 4K, periféricos e iluminação. Compre o combo e receba ' +
              'frete grátis para qualquer lugar do Brasil.</p>' +
            '<div class="row gap-3 wrap mt-5">' +
              '<a class="btn btn-primary" href="#/categoria?cat=perifericos" data-link>Ver periféricos</a>' +
              '<a class="btn btn-ghost" href="#/categoria?cat=moveis" data-link>Móveis ' + VT.icons.get('arrowRight', 16) + '</a>' +
            '</div>' +
            '<div class="promo-timer" data-countdown>' +
              '<div class="pt-b"><b data-cd-h>08</b><span>horas</span></div>' +
              '<div class="pt-b"><b data-cd-m>42</b><span>min</span></div>' +
              '<div class="pt-b"><b data-cd-s>15</b><span>seg</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +

      /* ===== OFERTAS ===== */
      '<section class="section shell-wide">' +
        U.sectionHead('Por tempo limitado', 'Ofertas da semana',
          'Descontos reais em produtos selecionados. Enquanto durar o estoque.',
          '<a class="btn btn-ghost btn-sm" href="#/categoria?oferta=1" data-link>Ver todas as ofertas ' + VT.icons.get('arrowRight', 16) + '</a>') +
        '<div class="prod-grid">' +
          deals.map(function (p) { return U.productCard(p); }).join('') +
        '</div>' +
      '</section>' +

      /* ===== MAIS VENDIDOS ===== */
      '<section class="section shell-wide" style="background:var(--surface);border-block:1px solid var(--line)">' +
        '<div class="shell" style="padding-inline:0">' +
          U.sectionHead('Campeões de venda', 'Os mais vendidos',
            'O que a maioria dos nossos clientes leva para casa — com milhares de avaliações.') +
          '<div class="prod-grid">' +
            best.map(function (p) { return U.productCard(p); }).join('') +
          '</div>' +
        '</div>' +
      '</section>' +

      /* ===== MARCAS ===== */
      '<section class="brands-strip">' +
        '<div class="brands-head">Marcas parceiras</div>' +
        '<div class="marquee">' +
          '<div class="marquee-track">' +
            VT.catalog.brands.concat(VT.catalog.brands).map(function (b) {
              return '<span class="brand-logo">' + esc(b.name) + '</span>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</section>' +

      /* ===== PROVA SOCIAL ===== */
      '<section class="section shell-wide">' +
        U.sectionHead('Quem compra, aprova', 'Mais de 40 mil avaliações verificadas',
          'Nota média de ' + avgRating.toFixed(1).replace('.', ',') + ' estrelas em todo o catálogo.') +
        '<div class="rev-grid">' +
          testimonials.map(function (t) {
            return '<article class="rev-item" data-reveal>' +
              '<div class="rh">' +
                U.avatar(t.r.name, t.hue) +
                '<div style="flex:1 1 auto;min-width:0">' +
                  '<div class="rn">' + esc(t.r.name) + (t.r.verified ? ' <span class="badge badge-ok">Verificado</span>' : '') + '</div>' +
                  '<div class="rd">' + esc(F.date(t.r.date)) + ' · ' + esc(F.truncate(t.product, 34)) + '</div>' +
                '</div>' +
                U.rating(t.r.rating, null) +
              '</div>' +
              '<p class="rb">' + esc(F.truncate(t.r.body, 190)) + '</p>' +
              '</article>';
          }).join('') +
        '</div>' +
      '</section>' +

      /* ===== NEWSLETTER ===== */
      '<section class="section shell-wide">' +
        '<div class="news-cta" data-reveal>' +
          '<div style="position:relative;z-index:1;max-width:560px">' +
            '<span class="eyebrow" style="color:rgba(255,255,255,.75)">Fique por dentro</span>' +
            '<h2 class="mt-2">Receba as ofertas antes de todo mundo</h2>' +
            '<p class="mt-3" style="color:rgba(255,255,255,.8)">Cupons exclusivos, lançamentos e dicas de setup. ' +
              'Sem spam, cancele quando quiser.</p>' +
            '<form class="news-form mt-5" id="newsForm">' +
              '<input class="input" type="email" name="email" placeholder="seu@email.com" required aria-label="E-mail">' +
              '<button class="btn btn-accent" type="submit">Quero receber</button>' +
            '</form>' +
            '<div class="tiny mt-3" style="color:rgba(255,255,255,.6)">Ao se inscrever você concorda com nossa política de privacidade.</div>' +
          '</div>' +
          '<div class="news-art">' + VT.icons.get('gift', 120) + '</div>' +
        '</div>' +
      '</section>';
    },

    mount: function (root) {
      /* contador regressivo do banner promocional */
      var cd = root.querySelector('[data-countdown]');
      if (cd) {
        var target = Date.now() + 8 * 3600000 + 42 * 60000 + 15000;
        var hEl = cd.querySelector('[data-cd-h]'), mEl = cd.querySelector('[data-cd-m]'), sEl = cd.querySelector('[data-cd-s]');
        var timer = setInterval(function () {
          var left = Math.max(0, target - Date.now());
          var h = Math.floor(left / 3600000);
          var m = Math.floor((left % 3600000) / 60000);
          var s = Math.floor((left % 60000) / 1000);
          hEl.textContent = F.pad(h); mEl.textContent = F.pad(m); sEl.textContent = F.pad(s);
          if (left <= 0) clearInterval(timer);
        }, 1000);
        cd._timer = timer;
      }

      /* newsletter */
      var nf = root.querySelector('#newsForm');
      if (nf) {
        nf.addEventListener('submit', function (e) {
          e.preventDefault();
          var email = nf.querySelector('[name="email"]').value.trim();
          if (!F.validEmail(email)) { VT.toast.err('E-mail inválido', 'Confira o endereço digitado.'); return; }
          var btn = nf.querySelector('button');
          btn.classList.add('btn-loading');
          setTimeout(function () {
            btn.classList.remove('btn-loading');
            nf.reset();
            VT.toast.ok('Inscrição confirmada!', 'Enviamos o cupom BEMVINDO10 para ' + email + '.');
          }, 900);
        });
      }
    },

    unmount: function (root) {
      var cd = root.querySelector('[data-countdown]');
      if (cd && cd._timer) clearInterval(cd._timer);
    }
  };
})(window);
