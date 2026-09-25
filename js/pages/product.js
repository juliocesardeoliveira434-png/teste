/* ============================================================
   VITRINE PRO — pages/product.js
   Página de produto: galeria, variantes, cálculo de frete,
   abas (descrição / ficha técnica / avaliações) e relacionados.
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};
  var F = VT.format, D = VT.dom, S = VT.store, U = VT.ui;
  var esc = D.esc;

  VT.pages = VT.pages || {};

  VT.pages.product = {
    title: 'Produto — Vitrine',

    render: function (params) {
      var p = VT.catalog.bySlug[params.slug] || VT.catalog.byId[params.slug];
      if (!p) {
        return '<div class="shell section">' +
          U.empty('alertTri', 'Produto não encontrado',
            'O endereço acessado não corresponde a nenhum item do catálogo.',
            '<a class="btn btn-primary mt-4" href="#/categoria" data-link>Voltar ao catálogo</a>') +
          '</div>';
      }
      var prod = S.product(p.id);
      var cat = VT.catalog.catById[prod.cat];
      var hues = [prod.hue, (prod.hue + 28) % 360, (prod.hue + 330) % 360, (prod.hue + 185) % 360];
      var bd = VT.seed.ratingBreakdown(prod);
      var reviews = VT.seed.reviewsFor(prod.id);
      var related = VT.catalog.related(prod, 4);
      var off = F.discount(prod.old, prod.price);

      return '<div class="shell-wide">' +
        '<div class="shell" style="padding-inline:0">' +

        U.crumbs([
          { label: 'Início', href: '#/' },
          { label: cat ? cat.name : 'Categoria', href: '#/categoria?cat=' + prod.cat },
          { label: prod.name }
        ]) +

        '<div class="pdp mt-5">' +

          /* ---------- galeria ---------- */
          '<div class="pdp-gallery">' +
            '<div class="pdp-main" id="pdpMain">' + VT.art.product(prod.art, hues[0]) + '</div>' +
            '<div class="pdp-thumbs">' +
              hues.map(function (h, i) {
                return '<button class="pdp-thumb' + (i === 0 ? ' on' : '') + '" data-img="' + h + '" aria-label="Imagem ' + (i + 1) + '">' +
                  VT.art.product(prod.art, h) + '</button>';
              }).join('') +
            '</div>' +
          '</div>' +

          /* ---------- informações ---------- */
          '<div class="pdp-info">' +
            '<div class="row gap-2 wrap mb-3">' + U.tags(prod) + '</div>' +
            '<div class="pcard-brand mb-2">' + esc(prod.brand) + '</div>' +
            '<h1>' + esc(prod.name) + '</h1>' +
            '<div class="pdp-meta mt-3">' +
              U.rating(prod.rating, prod.reviews, { lg: true }) +
              '<span class="dim">·</span>' +
              '<span class="small muted">' + F.num(prod.reviews) + ' avaliações</span>' +
              '<span class="dim">·</span>' +
              '<span class="small muted">Cód. ' + esc(prod.id.toUpperCase()) + '</span>' +
            '</div>' +

            U.priceBlock(prod) +

            /* variantes */
            (prod.colors ? variantGroup('Cor', 'color', prod.colors.map(function (c) {
              return { value: c.n, swatch: c.c };
            }), true) : '') +
            (prod.sizes ? variantGroup('Tamanho', 'size', prod.sizes.map(function (s) {
              return { value: s.n };
            }), false) : '') +

            /* quantidade + comprar */
            '<div class="buy-row">' +
              '<span class="qty" id="pdpQty">' +
                '<button data-qty="dec" aria-label="Diminuir">−</button>' +
                '<span class="v" data-qty-val>1</span>' +
                '<button data-qty="inc" aria-label="Aumentar">+</button>' +
              '</span>' +
              '<button class="btn btn-primary btn-lg" id="btnBuyNow"' + (prod.stock === 0 ? ' disabled' : '') + '>' +
                VT.icons.get('zap', 19) + ' Comprar agora</button>' +
              '<button class="btn btn-dark btn-lg" id="btnAddCart"' + (prod.stock === 0 ? ' disabled' : '') + '>' +
                VT.icons.get('cart', 19) + ' Adicionar</button>' +
            '</div>' +
            '<div class="stock-line ' + (prod.stock === 0 ? 'out' : (prod.stock <= 5 ? 'low' : '')) + '">' +
              VT.icons.get(prod.stock === 0 ? 'xCircle' : (prod.stock <= 5 ? 'alertTri' : 'checkCircle'), 15) +
              (prod.stock === 0 ? 'Produto esgotado — avise-me quando chegar'
                : prod.stock <= 5 ? 'Apenas ' + prod.stock + ' unidades em estoque'
                : 'Em estoque — ' + prod.stock + ' unidades disponíveis') +
            '</div>' +

            /* frete */
            '<div class="shipcalc">' +
              '<div class="row-b mb-3"><strong class="small">Calcular frete e prazo</strong>' +
                '<span class="tiny dim">enviamos para todo o Brasil</span></div>' +
              '<form class="row gap-2" id="shipForm">' +
                '<input class="input grow" type="text" id="shipCep" placeholder="00000-000" inputmode="numeric" maxlength="9" aria-label="CEP">' +
                '<button class="btn btn-outline" type="submit">' + VT.icons.get('truck', 17) + ' Calcular</button>' +
              '</form>' +
              '<div class="tiny dim mt-2" id="shipSamples">' +
                'exemplos: ' + VT.cep.samples().slice(0, 3).map(function (s) {
                  return '<a href="#" data-cep="' + s.cep + '" style="color:var(--brand)">' + s.cep + '</a>';
                }).join(' · ') +
              '</div>' +
              '<div id="shipResult"></div>' +
            '</div>' +

            '<div class="row gap-2 wrap">' +
              '<button class="btn btn-ghost btn-sm" id="btnFav">' +
                VT.icons.get('heart', 16, { filled: S.isFav(prod.id) }) +
                (S.isFav(prod.id) ? ' Salvo nos favoritos' : ' Salvar nos favoritos') + '</button>' +
              '<button class="btn btn-ghost btn-sm" id="btnShare">' + VT.icons.get('share', 16) + ' Compartilhar</button>' +
            '</div>' +

            /* confiança */
            '<div class="pdp-trust">' +
              [['shieldCheck', 'Compra protegida', '7 dias para devolução'],
               ['truck', 'Envio em 24h', 'pedidos aprovados até as 14h'],
               ['award', 'Garantia', '12 a 24 meses conforme o item'],
               ['chat', 'Suporte humano', 'seg a sex, 9h às 18h']].map(function (t) {
                return '<div class="trust-i">' + VT.icons.get(t[0], 18) +
                  '<div><b>' + t[1] + '</b>' + t[2] + '</div></div>';
              }).join('') +
            '</div>' +

          '</div>' +
        '</div>' +

        /* ---------- abas ---------- */
        '<div class="pdp-tabs mt-9">' +
          '<div class="tabs" role="tablist">' +
            '<button class="tab on" data-tab="desc" role="tab">Descrição</button>' +
            '<button class="tab" data-tab="specs" role="tab">Ficha técnica</button>' +
            '<button class="tab" data-tab="reviews" role="tab">Avaliações <span class="cnt">' + prod.reviews + '</span></button>' +
            '<button class="tab" data-tab="shipping" role="tab">Frete & devolução</button>' +
          '</div>' +

          '<div class="tab-panel" data-panel="desc">' +
            '<div class="prose"><p style="font-size:var(--fs-lg)">' + esc(prod.desc) + '</p>' +
            '<h3>Por que escolher este produto</h3>' +
            '<ul>' +
              '<li>Envio imediato para todo o Brasil com código de rastreio.</li>' +
              '<li>Nota fiscal eletrônica emitida em todas as compras.</li>' +
              '<li>Garantia do fabricante com rede de assistência nacional.</li>' +
              '<li>Atendimento por humanos — sem robôs, sem fila infinita.</li>' +
            '</ul></div>' +
          '</div>' +

          '<div class="tab-panel" data-panel="specs" hidden>' +
            '<div class="panel" style="overflow:hidden;max-width:760px">' +
              '<table class="spec-table">' +
                '<tr><td>Marca</td><td>' + esc(prod.brand) + '</td></tr>' +
                '<tr><td>Categoria</td><td>' + esc(cat ? cat.name : '—') + '</td></tr>' +
                '<tr><td>Código do produto</td><td class="mono">' + esc(prod.id.toUpperCase()) + '</td></tr>' +
                Object.keys(prod.specs).map(function (k) {
                  return '<tr><td>' + esc(k) + '</td><td>' + esc(prod.specs[k]) + '</td></tr>';
                }).join('') +
                '<tr><td>Garantia</td><td>12 meses (24 meses para itens premium)</td></tr>' +
              '</table>' +
            '</div>' +
          '</div>' +

          '<div class="tab-panel" data-panel="reviews" hidden>' +
            '<div class="rev-summary">' +
              '<div class="rev-big">' +
                '<div class="n">' + String(prod.rating).replace('.', ',') + '</div>' +
                U.rating(prod.rating, null, { lg: true }) +
                '<div class="c">baseado em ' + F.num(prod.reviews) + ' avaliações</div>' +
              '</div>' +
              '<div class="rev-bars">' +
                bd.slice().reverse().map(function (b) {
                  return '<div class="rev-bar">' +
                    '<span class="lbl2">' + b.star + '★</span>' +
                    '<span class="bar"><i style="width:' + b.pct + '%"></i></span>' +
                    '<span class="pc">' + b.pct + '%</span>' +
                    '</div>';
                }).join('') +
              '</div>' +
            '</div>' +
            '<div class="rev-list">' +
              reviews.map(function (r) {
                return '<article class="rev-item">' +
                  '<div class="rh">' +
                    U.avatar(r.name, r.hue) +
                    '<div style="flex:1 1 auto;min-width:0">' +
                      '<div class="rn">' + esc(r.name) +
                        (r.verified ? ' <span class="badge badge-ok">Compra verificada</span>' : '') + '</div>' +
                      '<div class="rd">' + esc(F.date(r.date)) + '</div>' +
                    '</div>' +
                    U.rating(r.rating) +
                  '</div>' +
                  '<div class="strong small mb-2">' + esc(r.title) + '</div>' +
                  '<p class="rb">' + esc(r.body) + '</p>' +
                  '<div class="rev-helpful">' +
                    '<button class="btn btn-ghost btn-xs" data-helpful>' + VT.icons.get('thumbsUp', 13) + ' Útil (' + r.helpful + ')</button>' +
                  '</div>' +
                  '</article>';
              }).join('') +
            '</div>' +
          '</div>' +

          '<div class="tab-panel" data-panel="shipping" hidden>' +
            '<div class="prose">' +
              '<h3>Enviamos para todo o Brasil</h3>' +
              '<p>Trabalhamos com transportadoras parceiras e com os Correios. O prazo começa a contar a partir da aprovação do pagamento, não da data da compra.</p>' +
              '<ul>' +
                '<li><b>Econômico:</b> 5 a 12 dias úteis — frete grátis acima de ' + F.brl(S.settings().freeShipFrom) + '</li>' +
                '<li><b>Padrão:</b> 3 a 8 dias úteis, com código de rastreio</li>' +
                '<li><b>Expresso:</b> 1 a 3 dias úteis para capitais e regiões metropolitanas</li>' +
              '</ul>' +
              '<h3>Trocas e devoluções</h3>' +
              '<p>Você tem 7 dias corridos, a partir do recebimento, para desistir da compra — é seu direito. ' +
              'Basta abrir um chamado na área do cliente; o frete da devolução é por nossa conta.</p>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* ---------- relacionados ---------- */
        '<section class="section-sm">' +
          U.sectionHead('Combine com', 'Quem viu, também levou') +
          '<div class="prod-grid">' + related.map(function (rp) { return U.productCard(rp); }).join('') + '</div>' +
        '</section>' +

        '</div>' +
      '</div>';

      function variantGroup(title, kind, opts, isColor) {
        return '<div class="opt-group" data-variant="' + kind + '">' +
          '<span class="lbl">' + esc(title) + ' <b data-variant-label>—</b></span>' +
          '<div class="opt-opts">' +
            opts.map(function (o, i) {
              return '<button class="opt' + (isColor ? ' opt-color' : '') + '" data-opt="' + esc(o.value) + '">' +
                (isColor ? '<i style="background:' + esc(o.swatch) + '"></i>' : esc(o.value)) +
                '</button>';
            }).join('') +
          '</div>' +
          '</div>';
      }
    },

    mount: function (root, params) {
      var p = VT.catalog.bySlug[params.slug] || VT.catalog.byId[params.slug];
      if (!p) return;
      var prod = S.product(p.id);

      var qty = 1;
      var variant = null;

      S.pushRecent(prod.id);

      /* ---------- galeria ---------- */
      var main = root.querySelector('#pdpMain');
      D.delegate(root, 'click', '.pdp-thumb', function (e, node) {
        D.qsa('.pdp-thumb', root).forEach(function (t) { t.classList.remove('on'); });
        node.classList.add('on');
        main.innerHTML = VT.art.product(prod.art, Number(node.dataset.img));
      });
      main.addEventListener('mouseenter', function () { main.classList.add('zoom'); });
      main.addEventListener('mouseleave', function () { main.classList.remove('zoom'); });
      main.addEventListener('mousemove', function (e) {
        var r = main.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width) * 100;
        var y = ((e.clientY - r.top) / r.height) * 100;
        var svg = main.querySelector('svg');
        if (svg) svg.style.transformOrigin = x + '% ' + y + '%';
      });

      /* ---------- variantes ---------- */
      D.qsa('.opt-group', root).forEach(function (group) {
        var kind = group.dataset.variant;
        var label = group.querySelector('[data-variant-label]');
        var first = group.querySelector('[data-opt]');
        if (first) {
          first.classList.add('on');
          label.textContent = first.dataset.opt;
          setVariant(kind, first.dataset.opt);
        }
        group.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-opt]');
          if (!btn) return;
          D.qsa('[data-opt]', group).forEach(function (b) { b.classList.remove('on'); });
          btn.classList.add('on');
          label.textContent = btn.dataset.opt;
          setVariant(kind, btn.dataset.opt);
        });
      });
      function setVariant(kind, value) {
        variant = { type: kind === 'color' ? 'Cor' : 'Tamanho', value: value };
      }

      /* ---------- quantidade ---------- */
      var qtyWrap = root.querySelector('#pdpQty');
      qtyWrap.addEventListener('click', function (e) {
        var b = e.target.closest('[data-qty]');
        if (!b) return;
        var max = prod.stock > 0 ? prod.stock : 99;
        if (b.dataset.qty === 'inc') qty = Math.min(max, qty + 1);
        else qty = Math.max(1, qty - 1);
        qtyWrap.querySelector('[data-qty-val]').textContent = qty;
        qtyWrap.querySelector('[data-qty="dec"]').disabled = qty <= 1;
        qtyWrap.querySelector('[data-qty="inc"]').disabled = qty >= max;
      });

      /* ---------- adicionar / comprar ---------- */
      var addBtn = root.querySelector('#btnAddCart');
      var buyBtn = root.querySelector('#btnBuyNow');
      function addToCart(silent) {
        var res = VT.cart.add(prod, qty, variant);
        if (!res.ok) {
          VT.toast.warn('Não foi possível adicionar',
            res.reason === 'stock' ? 'Quantidade maior que o estoque disponível (' + res.available + ').' : 'Produto esgotado.');
          return false;
        }
        if (!silent) VT.toast.ok('Adicionado ao carrinho', prod.name + ' · ' + qty + 'x');
        return true;
      }
      addBtn.addEventListener('click', function () { addToCart(false); });
      buyBtn.addEventListener('click', function () {
        if (addToCart(true)) location.hash = '#/checkout';
      });

      /* ---------- favoritos ---------- */
      var favBtn = root.querySelector('#btnFav');
      favBtn.addEventListener('click', function () {
        var on = S.toggleFav(prod.id);
        favBtn.innerHTML = VT.icons.get('heart', 16, { filled: on }) +
          (on ? ' Salvo nos favoritos' : ' Salvar nos favoritos');
        VT.toast.info(on ? 'Salvo nos favoritos' : 'Removido dos favoritos');
      });

      /* ---------- compartilhar ---------- */
      root.querySelector('#btnShare').addEventListener('click', function () {
        var url = location.href;
        if (navigator.share) {
          navigator.share({ title: prod.name, text: 'Confira ' + prod.name + ' na Vitrine', url: url })
            .catch(function () {});
          return;
        }
        D.copy(url).then(function () {
          VT.toast.ok('Link copiado!', 'Cole onde quiser compartilhar.');
        }).catch(function () {
          VT.toast.info('Copie o link', url);
        });
      });

      /* ---------- frete ---------- */
      var shipForm = root.querySelector('#shipForm');
      var shipCep = root.querySelector('#shipCep');
      var shipResult = root.querySelector('#shipResult');
      shipCep.addEventListener('input', function () { shipCep.value = F.maskCEP(shipCep.value); });
      D.delegate(root, 'click', '[data-cep]', function (e, node) {
        e.preventDefault();
        shipCep.value = node.dataset.cep;
        shipForm.dispatchEvent(new Event('submit', { cancelable: true }));
      });
      shipForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!F.validCEP(shipCep.value)) {
          VT.toast.err('CEP inválido', 'Digite os 8 dígitos do CEP.');
          shipCep.focus();
          return;
        }
        var btn = shipForm.querySelector('button');
        btn.classList.add('btn-loading');
        shipResult.innerHTML = '<div class="sk sk-line w80 mt-3"></div><div class="sk sk-line w60 mt-2"></div>';
        VT.cep.lookup(shipCep.value).then(function (addr) {
          btn.classList.remove('btn-loading');
          var q = VT.shipping.quote(shipCep.value, prod.price * qty);
          shipResult.innerHTML =
            '<div class="tiny muted mt-3">' +
              esc(addr.logradouro) + ' — ' + esc(addr.bairro) + ', ' + esc(addr.cidade) + '/' + esc(addr.uf) +
              ' · ' + esc(addr.regiao) +
            '</div>' +
            '<div class="ship-opts">' +
              q.options.map(function (o) {
                return '<div class="ship-opt' + (o.price === 0 ? ' free' : '') + '">' +
                  '<div><div class="sn">' + esc(o.name) + '</div><div class="sd">' + esc(o.desc) + '</div></div>' +
                  '<div class="sp">' + (o.price === 0 ? 'GRÁTIS' : F.brl(o.price)) + '</div>' +
                  '</div>';
              }).join('') +
            '</div>' +
            (q.missing > 0
              ? '<div class="tiny mt-2" style="color:var(--warn-ink)">Faltam ' + F.brl(q.missing) + ' para o frete grátis</div>'
              : '<div class="tiny mt-2" style="color:var(--ok-ink)">Você tem frete grátis nesta compra 🎉</div>');
        }).catch(function () {
          btn.classList.remove('btn-loading');
          shipResult.innerHTML = '<div class="tiny mt-3" style="color:var(--danger-ink)">Não foi possível consultar este CEP.</div>';
        });
      });

      /* ---------- abas ---------- */
      D.delegate(root, 'click', '.tab', function (e, node) {
        D.qsa('.tab', root).forEach(function (t) { t.classList.remove('on'); });
        node.classList.add('on');
        var name = node.dataset.tab;
        D.qsa('[data-panel]', root).forEach(function (pan) {
          pan.hidden = pan.dataset.panel !== name;
        });
      });

      /* ---------- avaliações úteis ---------- */
      D.delegate(root, 'click', '[data-helpful]', function (e, node) {
        var m = node.textContent.match(/\((\d+)\)/);
        var n = m ? Number(m[1]) + 1 : 1;
        node.innerHTML = VT.icons.get('thumbsUp', 13) + ' Útil (' + n + ')';
        node.disabled = true;
        node.style.opacity = '.7';
      });
    }
  };
})(window);
