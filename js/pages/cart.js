/* ============================================================
   VITRINE PRO — pages/cart.js
   Página do carrinho: itens, cupom, estimativa de frete e resumo.
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};
  var F = VT.format, D = VT.dom, S = VT.store, U = VT.ui;
  var esc = D.esc;

  VT.pages = VT.pages || {};

  VT.pages.cart = {
    title: 'Carrinho — Vitrine',

    render: function () {
      var t = VT.cart.totals();
      var cfg = S.settings();

      if (!t.items.length) {
        return '<div class="shell section">' +
          '<div class="panel" style="max-width:620px;margin-inline:auto">' +
          U.empty('cart', 'Seu carrinho está vazio',
            'Que tal começar explorando o catálogo? Temos ' + VT.catalog.products.length +
            ' produtos com frete grátis acima de ' + F.brl(cfg.freeShipFrom) + '.',
            '<div class="row gap-3 mt-5" style="justify-content:center">' +
              '<a class="btn btn-primary" href="#/categoria" data-link>' + VT.icons.get('bag', 18) + ' Ir às compras</a>' +
              (S.get('recent').length ? '<a class="btn btn-outline" href="#/categoria?sort=rating" data-link>Ver mais vendidos</a>' : '') +
            '</div>') +
          '</div>' +
          (S.get('recent').length
            ? '<section class="section-sm mt-8">' +
                U.sectionHead('Visto por último', 'Retome de onde parou') +
                '<div class="prod-grid">' +
                  S.get('recent').slice(0, 4).map(function (id) {
                    var p = S.product(id);
                    return p ? U.productCard(p) : '';
                  }).join('') +
                '</div>' +
              '</section>'
            : '') +
          '</div>';
      }

      return '<div class="shell-wide"><div class="shell" style="padding-inline:0">' +
        '<div class="row-b wrap gap-3 mb-6">' +
          '<div>' +
            '<h1 style="font-size:var(--fs-3xl)">Meu carrinho</h1>' +
            '<p class="muted mt-2">' + t.itemCount + ' ' + F.plural(t.itemCount, 'item', 'itens') + ' no seu pedido</p>' +
          '</div>' +
          '<a class="btn btn-ghost btn-sm" href="#/categoria" data-link>' + VT.icons.get('arrowLeft', 16) + ' Continuar comprando</a>' +
        '</div>' +

        '<div class="check-layout">' +
          '<div>' +

            /* lista de itens */
            '<div class="panel" style="padding:var(--sp-5)">' +
              t.items.map(function (it) {
                return '<div class="cart-item" data-key="' + esc(it.key) + '">' +
                  '<a class="cart-thumb" href="#/produto/' + esc(it.product.slug) + '" data-link>' +
                    VT.art.product(it.product.art, it.product.hue) +
                  '</a>' +
                  '<div style="min-width:0">' +
                    '<div class="row-b gap-3">' +
                      '<a class="cart-name" href="#/produto/' + esc(it.product.slug) + '" data-link>' + esc(it.product.name) + '</a>' +
                      '<button class="mini-del" data-remove="' + esc(it.key) + '" title="Remover" aria-label="Remover item">' +
                        VT.icons.get('trash', 15) + '</button>' +
                    '</div>' +
                    '<div class="cart-var">' + esc(it.product.brand) +
                      (it.variant ? ' · ' + esc(it.variant.type) + ': ' + esc(it.variant.value) : '') +
                      ' · Cód. ' + esc(it.product.id.toUpperCase()) + '</div>' +
                    '<div class="cart-actions">' +
                      '<span class="qty" data-qty-wrap>' +
                        '<button data-cart-qty="dec" data-key="' + esc(it.key) + '" aria-label="Diminuir">−</button>' +
                        '<span class="v">' + it.qty + '</span>' +
                        '<button data-cart-qty="inc" data-key="' + esc(it.key) + '" aria-label="Aumentar">+</button>' +
                      '</span>' +
                      '<span class="ci-price">' +
                        '<span class="price price-sm">' + F.brl(it.total) + '</span>' +
                        (it.qty > 1 ? '<div class="tiny dim">' + F.brl(it.unit) + ' cada</div>' : '') +
                      '</span>' +
                    '</div>' +
                    (it.stock <= 5 && it.stock > 0
                      ? '<div class="tiny mt-2" style="color:var(--warn-ink)">Só mais ' + it.stock + ' em estoque</div>' : '') +
                  '</div>' +
                  '</div>';
              }).join('') +
              '<div class="row-b wrap gap-3 mt-5 pt-5" style="border-top:1px solid var(--line)">' +
                '<button class="link-danger" data-clear-cart>' + VT.icons.get('trash', 14) + ' Esvaziar carrinho</button>' +
                '<span class="tiny dim">' + VT.icons.get('lock', 13) + ' Compra protegida e dados criptografados</span>' +
              '</div>' +
            '</div>' +

            /* estimativa de frete */
            '<div class="panel mt-4" style="padding:var(--sp-5)">' +
              '<div class="row-b wrap gap-3 mb-3">' +
                '<strong>Calcular frete</strong>' +
                '<span class="tiny dim">informe seu CEP para ver prazos e valores</span>' +
              '</div>' +
              '<form class="row gap-2" id="cartShipForm">' +
                '<input class="input" type="text" id="cartCep" placeholder="00000-000" inputmode="numeric" maxlength="9" style="max-width:200px" aria-label="CEP">' +
                '<button class="btn btn-outline" type="submit">' + VT.icons.get('truck', 17) + ' Calcular</button>' +
              '</form>' +
              '<div id="cartShipResult"></div>' +
            '</div>' +

            /* recomendados */
            '<section class="mt-7">' +
              U.sectionHead('Aproveite também', 'Combina com o seu carrinho') +
              '<div class="prod-grid" id="cartCross"></div>' +
            '</section>' +

          '</div>' +

          /* resumo */
          '<aside>' +
            '<div class="summary">' +
              '<div class="summary-head"><h3>Resumo do pedido</h3></div>' +
              '<div class="summary-body" id="sumBody">' + summaryBody(t) + '</div>' +
              '<div class="summary-foot">' +
                '<form class="coupon-row mb-4" id="couponForm">' +
                  '<input class="input" type="text" name="coupon" placeholder="Cupom de desconto" value="' + esc(S.get('coupon') || '') + '" aria-label="Cupom">' +
                  '<button class="btn btn-outline" type="submit">Aplicar</button>' +
                '</form>' +
                '<a class="btn btn-primary btn-lg btn-block" href="#/checkout" data-link>' +
                  VT.icons.get('lock', 18) + ' Fechar pedido</a>' +
                '<div class="tiny dim center mt-3">Pix, cartão em até 12x ou boleto</div>' +
              '</div>' +
            '</div>' +
            '<div class="panel mt-4" style="padding:var(--sp-4)">' +
              '<div class="col gap-3">' +
                [
                  ['shieldCheck', 'Compra protegida', 'Dinheiro de volta se o produto não chegar'],
                  ['refresh', 'Devolução em 7 dias', 'Direito garantido por lei'],
                  ['headphones', 'Suporte humano', 'Atendimento de seg a sex']
                ].map(function (b) {
                return '<div class="row gap-3">' +
                  '<span style="color:var(--brand);display:grid">' + VT.icons.get(b[0], 18) + '</span>' +
                  '<div><div class="small strong">' + b[1] + '</div><div class="tiny dim">' + b[2] + '</div></div>' +
                  '</div>';
              }).join('') +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</div></div>';

      function summaryBody(tt) {
        return '' +
          '<div class="sum-line"><span>Produtos (' + tt.itemCount + ')</span><span class="v">' + F.brl(tt.subtotal) + '</span></div>' +
          (tt.discount > 0
            ? '<div class="sum-line disc"><span>Cupom ' + esc(tt.coupon.code) + '</span><span class="v">− ' + F.brl(tt.discount) + '</span></div>' : '') +
          '<div class="sum-line"><span>Frete</span><span class="v">' + (tt.shipping === 0 ? '<b style="color:var(--ok-ink)">GRÁTIS</b>' : F.brl(tt.shipping)) + '</span></div>' +
          (tt.tax > 0 ? '<div class="sum-line"><span>Impostos</span><span class="v">' + F.brl(tt.tax) + '</span></div>' : '') +
          '<div class="sum-line big"><span>Total</span><span class="v">' + F.brl(tt.total) + '</span></div>' +
          (tt.pixEconomy > 0
            ? '<div class="sum-line disc"><span>ou no Pix</span><span class="v">' + F.brl(tt.pixTotal) + '</span></div>' : '') +
          (tt.bestInstallment && tt.bestInstallment.count > 1
            ? '<div class="tiny dim center mt-2">ou ' + tt.bestInstallment.count + 'x de ' + F.brl(tt.bestInstallment.value) +
              (tt.bestInstallment.interestFree ? ' sem juros' : '') + '</div>' : '');
      }
    },

    mount: function (root) {
      /* ---- ações dos itens ---- */
      root.addEventListener('click', function (e) {
        var inc = e.target.closest('[data-cart-qty]');
        if (inc) {
          var key = inc.dataset.key;
          var line = VT.cart.lines().filter(function (l) { return l.key === key; })[0];
          if (!line) return;
          VT.cart.setQty(key, line.qty + (inc.dataset.cartQty === 'inc' ? 1 : -1));
          return;
        }
        var rm = e.target.closest('[data-remove]');
        if (rm) {
          VT.cart.remove(rm.dataset.remove);
          VT.toast.info('Item removido', 'Você pode adicioná-lo novamente quando quiser.');
          return;
        }
        if (e.target.closest('[data-clear-cart]')) {
          VT.modal.confirm({
            title: 'Esvaziar carrinho?',
            message: 'Todos os itens serão removidos. Essa ação não pode ser desfeita.',
            okText: 'Esvaziar', danger: true
          }).then(function (ok) {
            if (ok) { VT.cart.clear(); VT.toast.info('Carrinho esvaziado'); }
          });
        }
      });

      /* ---- cupom ---- */
      var cform = root.querySelector('#couponForm');
      if (cform) {
        cform.addEventListener('submit', function (e) {
          e.preventDefault();
          var code = cform.querySelector('[name="coupon"]').value.trim();
          if (!code) { VT.toast.warn('Digite um cupom'); return; }
          var res = VT.cart.applyCoupon(code);
          if (res.ok) VT.toast.ok('Cupom aplicado!', res.msg);
          else VT.toast.err('Cupom inválido', res.msg);
        });
      }

      /* ---- frete ---- */
      var sform = root.querySelector('#cartShipForm');
      if (sform) {
        var cep = root.querySelector('#cartCep');
        cep.addEventListener('input', function () { cep.value = F.maskCEP(cep.value); });
        sform.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!F.validCEP(cep.value)) { VT.toast.err('CEP inválido'); return; }
          var btn = sform.querySelector('button');
          btn.classList.add('btn-loading');
          var out = root.querySelector('#cartShipResult');
          out.innerHTML = '<div class="sk sk-line w80 mt-3"></div>';
          VT.cep.lookup(cep.value).then(function (addr) {
            btn.classList.remove('btn-loading');
            var t = VT.cart.totals();
            var q = VT.shipping.quote(cep.value, t.subtotal - t.discount);
            out.innerHTML =
              '<div class="tiny muted mt-3">Entregar em ' + esc(addr.logradouro) + ', ' + esc(addr.cidade) + '/' + esc(addr.uf) + '</div>' +
              '<div class="ship-opts">' + q.options.map(function (o) {
                return '<label class="ship-opt' + (o.price === 0 ? ' free' : '') + '" style="cursor:pointer">' +
                  '<input type="radio" name="shipOpt" value="' + o.id + '" style="accent-color:var(--brand)"' +
                    (o.id === 'standard' ? ' checked' : '') + '>' +
                  '<div><div class="sn">' + esc(o.name) + ' · ' + o.days + ' dias úteis</div>' +
                  '<div class="sd">' + esc(o.desc) + '</div></div>' +
                  '<div class="sp">' + (o.price === 0 ? 'GRÁTIS' : F.brl(o.price)) + '</div>' +
                  '</label>';
              }).join('') + '</div>';
            D.qsa('input[name="shipOpt"]', out).forEach(function (r) {
              r.addEventListener('change', function () {
                var opt = q.options.filter(function (o) { return o.id === r.value; })[0];
                S.set('shippingSel', { id: opt.id, name: opt.name, price: opt.price, days: opt.days });
                VT.toast.ok('Frete atualizado', opt.name + ' — ' + (opt.price ? F.brl(opt.price) : 'grátis'));
              });
            });
          }).catch(function () {
            btn.classList.remove('btn-loading');
            out.innerHTML = '<div class="tiny mt-3" style="color:var(--danger-ink)">CEP não encontrado.</div>';
          });
        });
      }

      /* ---- recomendados ---- */
      var cross = root.querySelector('#cartCross');
      if (cross) {
        var catIds = VT.cart.items().map(function (i) { return i.product.cat; });
        var inCart = VT.cart.items().map(function (i) { return i.product.id; });
        var sug = VT.catalog.query({ sort: 'rating' }).filter(function (p) {
          return inCart.indexOf(p.id) === -1 && catIds.indexOf(p.cat) !== -1;
        }).slice(0, 4);
        if (!sug.length) sug = VT.catalog.query({ sort: 'rating' }).slice(0, 4);
        cross.innerHTML = sug.map(function (p) { return U.productCard(p); }).join('');
      }
    }
  };
})(window);
