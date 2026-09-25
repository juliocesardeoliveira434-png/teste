/* ============================================================
   VITRINE PRO — pages/checkout.js
   Checkout em 4 etapas + confirmação do pedido.
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};
  var F = VT.format, D = VT.dom, S = VT.store, U = VT.ui;
  var esc = D.esc;

  VT.pages = VT.pages || {};

  /* dados do checkout (vivos durante a sessão) */
  var data = {
    step: 1,
    name: '', email: '', doc: '', phone: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
    payment: 'pix',
    card: { number: '', name: '', expiry: '', cvv: '', doc: '', installments: 1 }
  };

  var STEPS = [
    { n: 1, label: 'Identificação', icon: 'user' },
    { n: 2, label: 'Entrega', icon: 'truck' },
    { n: 3, label: 'Pagamento', icon: 'card' },
    { n: 4, label: 'Revisão', icon: 'checkCircle' }
  ];

  /* ============================ CHECKOUT ============================ */
  VT.pages.checkout = {
    title: 'Checkout — Vitrine',

    render: function () {
      var t = VT.cart.totals();
      if (!t.items.length) {
        return '<div class="shell section">' +
          U.empty('cart', 'Nada para finalizar', 'Seu carrinho está vazio — adicione produtos para continuar.',
            '<a class="btn btn-primary mt-4" href="#/categoria" data-link>Ir às compras</a>') +
          '</div>';
      }
      /* pré-preenche com o usuário logado */
      var u = S.get('user');
      if (u && !data.email) {
        data.name = u.name || '';
        data.email = u.email || '';
        data.doc = u.doc || '';
        data.phone = u.phone || '';
      }
      var addr = (S.get('addresses') || [])[0];
      if (addr && !data.cep) {
        data.cep = addr.cep; data.logradouro = addr.logradouro; data.numero = addr.numero;
        data.complemento = addr.complemento || ''; data.bairro = addr.bairro;
        data.cidade = addr.cidade; data.uf = addr.uf;
      }

      return '<div class="shell-wide"><div class="shell" style="padding-inline:0">' +
        '<div class="row-b wrap gap-3 mb-6">' +
          '<div>' +
            '<h1 style="font-size:var(--fs-3xl)">Finalizar compra</h1>' +
            '<p class="muted mt-2">Faltam poucos passos para garantir seus produtos</p>' +
          '</div>' +
          '<a class="btn btn-ghost btn-sm" href="#/carrinho" data-link>' + VT.icons.get('arrowLeft', 16) + ' Voltar ao carrinho</a>' +
        '</div>' +

        '<div class="steps mb-7" id="steps">' +
          STEPS.map(function (s, i) {
            var state = data.step > s.n ? 'done' : (data.step === s.n ? 'on' : '');
            return (i ? '<span class="step-line' + (data.step > s.n ? ' done' : '') + '"></span>' : '') +
              '<div class="step ' + state + '">' +
                '<span class="sn">' + (data.step > s.n ? '✓' : s.n) + '</span>' +
                '<span class="sl">' + s.label + '</span>' +
              '</div>';
          }).join('') +
        '</div>' +

        '<div class="check-layout">' +
          '<div id="stepBody">' + this.stepHTML() + '</div>' +
          '<aside>' +
            '<div class="summary">' +
              '<div class="summary-head"><h3>Resumo</h3></div>' +
              '<div class="summary-body" id="checkSum"></div>' +
              '<div class="summary-foot">' +
                '<div class="row-b mb-2"><span class="muted small">Total</span>' +
                  '<span class="price price-lg" id="checkTotal"></span></div>' +
                '<div class="tiny dim" id="checkPix"></div>' +
              '</div>' +
            '</div>' +
            '<div class="panel mt-4" style="padding:var(--sp-4)">' +
              '<div class="row gap-3">' +
                '<span style="color:var(--brand);display:grid">' + VT.icons.get('shieldCheck', 20) + '</span>' +
                '<div class="tiny muted">Ambiente de demonstração. Nenhum pagamento real é processado e nenhum dado sai do seu navegador.</div>' +
              '</div>' +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</div></div>';
    },

    stepHTML: function () {
      var t = VT.cart.totals();
      var s = data.step;

      /* ---------- etapa 1 ---------- */
      if (s === 1) {
        return '<div class="panel">' +
          '<div class="card-head"><h3>' + VT.icons.get('user', 18) + ' Seus dados</h3>' +
            (S.get('user')
              ? '<span class="badge badge-ok">Logado</span>'
              : '<button class="btn btn-ghost btn-sm" data-goto-login>Já tenho conta</button>') +
          '</div>' +
          '<div class="card-pad">' +
            '<div class="grid-form">' +
              field('col-12', 'email', 'E-mail', '<input class="input" type="email" id="f_email" value="' + esc(data.email) + '" placeholder="voce@email.com" autocomplete="email">', 'Enviaremos o código do pedido e o rastreio.') +
              field('col-6', 'name', 'Nome completo', '<input class="input" type="text" id="f_name" value="' + esc(data.name) + '" placeholder="Como está no documento" autocomplete="name">') +
              field('col-6', 'doc', 'CPF ou CNPJ', '<input class="input" type="text" id="f_doc" value="' + esc(data.doc) + '" placeholder="000.000.000-00" inputmode="numeric">', 'Usado apenas para a nota fiscal.') +
              field('col-6', 'phone', 'Celular / WhatsApp', '<input class="input" type="tel" id="f_phone" value="' + esc(data.phone) + '" placeholder="(00) 00000-0000" inputmode="numeric">', 'Para avisos de envio.') +
            '</div>' +
            '<div id="f_errors" class="mt-4"></div>' +
          '</div>' +
          '<div class="card-foot row-b gap-3">' +
            '<a class="btn btn-ghost btn-sm" href="#/carrinho" data-link>' + VT.icons.get('arrowLeft', 16) + ' Carrinho</a>' +
            '<button class="btn btn-primary" data-next>' + VT.icons.get('arrowRight', 17) + ' Continuar para entrega</button>' +
          '</div>' +
        '</div>';
      }

      /* ---------- etapa 2 ---------- */
      if (s === 2) {
        return '<div class="panel">' +
          '<div class="card-head"><h3>' + VT.icons.get('truck', 18) + ' Endereço de entrega</h3></div>' +
          '<div class="card-pad">' +
            '<div class="grid-form">' +
              field('col-4', 'cep', 'CEP', '<div class="row gap-2"><input class="input" type="text" id="f_cep" value="' + esc(data.cep) + '" placeholder="00000-000" inputmode="numeric" maxlength="9">' +
                '<button class="btn btn-outline" type="button" id="btnCep">Buscar</button></div>',
                'Digite o CEP e preenchemos o endereço.') +
              field('col-8', 'logradouro', 'Endereço', '<input class="input" type="text" id="f_logradouro" value="' + esc(data.logradouro) + '" placeholder="Rua, avenida…">') +
              field('col-4', 'numero', 'Número', '<input class="input" type="text" id="f_numero" value="' + esc(data.numero) + '" placeholder="123">') +
              field('col-8', 'complemento', 'Complemento (opcional)', '<input class="input" type="text" id="f_complemento" value="' + esc(data.complemento) + '" placeholder="Apto, bloco, ponto de referência">') +
              field('col-4', 'bairro', 'Bairro', '<input class="input" type="text" id="f_bairro" value="' + esc(data.bairro) + '">') +
              field('col-6', 'cidade', 'Cidade', '<input class="input" type="text" id="f_cidade" value="' + esc(data.cidade) + '">') +
              field('col-2', 'uf', 'UF', '<input class="input" type="text" id="f_uf" value="' + esc(data.uf) + '" maxlength="2" style="text-transform:uppercase">') +
            '</div>' +
            '<div id="shipOpts" class="mt-5"></div>' +
            '<div id="f_errors" class="mt-4"></div>' +
          '</div>' +
          '<div class="card-foot row-b gap-3">' +
            '<button class="btn btn-ghost btn-sm" data-back>' + VT.icons.get('arrowLeft', 16) + ' Voltar</button>' +
            '<button class="btn btn-primary" data-next>' + VT.icons.get('arrowRight', 17) + ' Ir para pagamento</button>' +
          '</div>' +
        '</div>';
      }

      /* ---------- etapa 3 ---------- */
      if (s === 3) {
        var cfg = S.settings();
        var methods = VT.payments.METHODS.filter(function (m) { return cfg.methods[m.id] !== false; });
        return '<div class="panel">' +
          '<div class="card-head"><h3>' + VT.icons.get('card', 18) + ' Forma de pagamento</h3>' +
            '<span class="badge badge-ok">' + VT.icons.get('lock', 12) + ' Criptografado</span></div>' +
          '<div class="card-pad">' +
            '<div class="pay-methods">' +
              methods.map(function (m) { return payMethod(m, t); }).join('') +
            '</div>' +
            '<div id="f_errors" class="mt-4"></div>' +
          '</div>' +
          '<div class="card-foot row-b gap-3">' +
            '<button class="btn btn-ghost btn-sm" data-back>' + VT.icons.get('arrowLeft', 16) + ' Voltar</button>' +
            '<button class="btn btn-primary" data-next>' + VT.icons.get('arrowRight', 17) + ' Revisar pedido</button>' +
          '</div>' +
        '</div>';
      }

      /* ---------- etapa 4 ---------- */
      var ship = t.shippingSel || { name: 'Padrão', price: t.shipping, days: 4 };
      var eta = VT.shipping.etaRange(ship.days);
      var payLabel = VT.payments.PAY_LABEL[data.payment];
      var paidTotal = data.payment === 'pix' ? t.pixTotal : t.total;
      var inst = data.payment === 'card'
        ? t.installments.filter(function (x) { return x.count === data.card.installments; })[0]
        : null;

      return '<div class="panel">' +
        '<div class="card-head"><h3>' + VT.icons.get('checkCircle', 18) + ' Revise e confirme</h3></div>' +
        '<div class="card-pad">' +
          '<div class="grid-2 gap-4">' +
            reviewCard('Entrega', 'truck',
              esc(data.name) + '<br>' + esc(data.logradouro) + ', ' + esc(data.numero) +
              (data.complemento ? ' — ' + esc(data.complemento) : '') + '<br>' +
              esc(data.bairro) + ' · ' + esc(data.cidade) + '/' + esc(data.uf) + '<br>' +
              'CEP ' + esc(data.cep) + '<br>' +
              '<b>' + esc(ship.name) + '</b> — ' + (ship.price ? F.brl(ship.price) : 'grátis') +
              ' · chega de ' + F.dateShort(eta.from) + ' a ' + F.dateShort(eta.to),
              '<button class="btn btn-xs btn-ghost" data-goto="2">alterar</button>') +
            reviewCard('Pagamento', data.payment === 'pix' ? 'pix' : (data.payment === 'card' ? 'card' : 'barcode'),
              '<b>' + esc(payLabel) + '</b><br>' +
              (data.payment === 'pix'
                ? 'Aprovação imediata · você economiza ' + F.brl(t.pixEconomy)
                : data.payment === 'card'
                  ? (inst ? inst.count + 'x de ' + F.brl(inst.value) + (inst.interestFree ? ' sem juros' : ' (total ' + F.brl(inst.total) + ')') : '') +
                    '<br>' + esc(VT.payments.maskCard(data.card.number))
                  : 'Vence em ' + F.date(VT.format.addDays(Date.now(), 3)) + ' · ' + F.brl(paidTotal)),
              '<button class="btn btn-xs btn-ghost" data-goto="3">alterar</button>') +
          '</div>' +

          '<h4 class="mt-6 mb-3">' + t.itemCount + ' ' + F.plural(t.itemCount, 'item', 'itens') + '</h4>' +
          '<div class="panel" style="box-shadow:none">' +
            t.items.map(function (it) {
              return '<div class="cart-item" style="grid-template-columns:64px 1fr">' +
                '<div class="cart-thumb" style="width:64px;height:64px">' + VT.art.product(it.product.art, it.product.hue) + '</div>' +
                '<div class="row-b gap-3">' +
                  '<div style="min-width:0">' +
                    '<div class="small strong trunc">' + esc(it.product.name) + '</div>' +
                    '<div class="tiny dim">' + it.qty + 'x ' + F.brl(it.unit) +
                      (it.variant ? ' · ' + esc(it.variant.value) : '') + '</div>' +
                  '</div>' +
                  '<span class="small strong nowrap">' + F.brl(it.total) + '</span>' +
                '</div>' +
                '</div>';
            }).join('') +
          '</div>' +

          '<label class="check mt-5" style="align-items:center">' +
            '<input type="checkbox" id="f_terms"><span class="box">' + VT.icons.get('check', 12, { stroke: 3 }) + '</span>' +
            '<span class="small">Li e concordo com os <a href="#/institucional/termos" data-link style="color:var(--brand)">termos de uso</a> ' +
            'e a <a href="#/institucional/privacidade" data-link style="color:var(--brand)">política de privacidade</a>.</span>' +
          '</label>' +
          '<div id="f_errors" class="mt-4"></div>' +
        '</div>' +
        '<div class="card-foot row-b gap-3">' +
          '<button class="btn btn-ghost btn-sm" data-back>' + VT.icons.get('arrowLeft', 16) + ' Voltar</button>' +
          '<button class="btn btn-primary btn-lg" id="btnPlaceOrder">' +
            VT.icons.get('lock', 18) + ' Confirmar pedido · ' + F.brl(paidTotal) + '</button>' +
        '</div>' +
      '</div>';

      /* ---------- helpers ---------- */
      function field(col, id, label, input, hint) {
        return '<div class="field ' + col + '">' +
          '<label for="f_' + id + '">' + label + ' <span class="req">*</span></label>' +
          input +
          (hint ? '<span class="hint">' + hint + '</span>' : '') +
          '<span class="err" data-err="' + id + '"></span>' +
          '</div>';
      }
      function reviewCard(title, icon, body, action) {
        return '<div class="panel" style="box-shadow:none;padding:var(--sp-4)">' +
          '<div class="row-b mb-3">' +
            '<div class="row gap-2"><span style="color:var(--brand);display:grid">' + VT.icons.get(icon, 17) + '</span>' +
            '<strong class="small">' + title + '</strong></div>' + action +
          '</div>' +
          '<div class="small muted" style="line-height:1.7">' + body + '</div>' +
          '</div>';
      }
    },

    mount: function (root) {
      /* carrinho vazio: nada a montar (a página já mostra o estado vazio) */
      if (!VT.cart.items().length) return;

      /* ---------- resumo lateral ---------- */
      function renderSummary() {
        var t = VT.cart.totals();
        var box = root.querySelector('#checkSum');
        if (!box) return;
        box.innerHTML =
          t.items.map(function (it) {
            return '<div class="row gap-3">' +
              '<div style="width:44px;height:44px;border-radius:8px;overflow:hidden;flex:none">' +
                VT.art.product(it.product.art, it.product.hue) + '</div>' +
              '<div style="flex:1 1 auto;min-width:0">' +
                '<div class="tiny strong trunc">' + esc(it.product.name) + '</div>' +
                '<div class="tiny dim">' + it.qty + ' x ' + F.brl(it.unit) + '</div>' +
              '</div>' +
              '<span class="tiny strong">' + F.brl(it.total) + '</span>' +
              '</div>';
          }).join('') +
          '<div class="divider my-4"></div>' +
          '<div class="sum-line"><span>Produtos</span><span class="v">' + F.brl(t.subtotal) + '</span></div>' +
          (t.discount ? '<div class="sum-line disc"><span>Desconto</span><span class="v">− ' + F.brl(t.discount) + '</span></div>' : '') +
          '<div class="sum-line"><span>Frete</span><span class="v">' + (t.shipping ? F.brl(t.shipping) : 'grátis') + '</span></div>' +
          '<div class="sum-line big"><span>Total</span><span class="v">' + F.brl(t.total) + '</span></div>';
        var tot = root.querySelector('#checkTotal');
        if (tot) tot.textContent = F.brl(data.payment === 'pix' ? t.pixTotal : t.total);
        var pix = root.querySelector('#checkPix');
        if (pix) {
          pix.innerHTML = data.payment === 'pix'
            ? '<b style="color:var(--ok-ink)">' + F.brl(t.pixTotal) + '</b> no Pix (você economiza ' + F.brl(t.pixEconomy) + ')'
            : (data.payment === 'card' && t.bestInstallment.count > 1
                ? 'ou ' + t.bestInstallment.count + 'x de ' + F.brl(t.bestInstallment.value) + ' sem juros'
                : 'Pix com ' + t.pixRate + '% de desconto disponível');
        }
      }
      renderSummary();

      /* ---------- máscaras ---------- */
      bindMask('#f_doc', F.maskCPFCNPJ);
      bindMask('#f_phone', F.maskPhone);
      bindMask('#f_cep', F.maskCEP);
      bindMask('#card_number', F.maskCard);
      bindMask('#card_expiry', F.maskExpiry);
      bindMask('#card_doc', F.maskCPFCNPJ);
      function bindMask(sel, fn) {
        var el = root.querySelector(sel);
        if (!el) return;
        el.addEventListener('input', function () { el.value = fn(el.value); });
      }

      /* ---------- erros ---------- */
      function setErrors(errors) {
        D.qsa('[data-err]', root).forEach(function (n) { n.textContent = ''; });
        D.qsa('input,select', root).forEach(function (n) { n.removeAttribute('aria-invalid'); });
        var keys = Object.keys(errors);
        keys.forEach(function (k) {
          var n = root.querySelector('[data-err="' + k + '"]');
          if (n) n.textContent = errors[k];
          var input = root.querySelector('#f_' + k) || root.querySelector('#card_' + k);
          if (input) input.setAttribute('aria-invalid', 'true');
        });
        var box = root.querySelector('#f_errors');
        if (box) {
          box.innerHTML = keys.length
            ? '<div class="badge badge-danger" style="padding:8px 12px">' +
              VT.icons.get('alertTri', 14) + ' Revise os campos destacados</div>'
            : '';
        }
        if (keys.length) {
          var first = root.querySelector('#f_' + keys[0]) || root.querySelector('#card_' + keys[0]);
          if (first) first.focus();
        }
        return keys.length === 0;
      }
      function val(id) {
        var el = root.querySelector('#f_' + id) || root.querySelector('#card_' + id);
        return el ? el.value.trim() : '';
      }

      /* ---------- passo 1 ---------- */
      if (data.step === 1) {
        root.querySelector('[data-next]').addEventListener('click', function () {
          var errors = {};
          data.email = val('email'); data.name = val('name');
          data.doc = val('doc'); data.phone = val('phone');
          if (!F.validEmail(data.email)) errors.email = 'Informe um e-mail válido.';
          if (data.name.length < 5 || data.name.indexOf(' ') === -1) errors.name = 'Informe nome e sobrenome.';
          if (!(F.validCPF(data.doc) || F.validCNPJ(data.doc))) errors.doc = 'CPF ou CNPJ inválido.';
          if (F.onlyDigits(data.phone).length < 10) errors.phone = 'Informe DDD + número.';
          if (!setErrors(errors)) return;
          data.step = 2;
          VT.router.reload();
        });
        D.delegate(root, 'click', '[data-goto-login]', function () { location.hash = '#/conta'; });
      }

      /* ---------- passo 2 ---------- */
      if (data.step === 2) {
        var cepInput = root.querySelector('#f_cep');
        function fetchCep() {
          if (!F.validCEP(cepInput.value)) { VT.toast.err('CEP inválido'); return; }
          var btn = root.querySelector('#btnCep');
          btn.classList.add('btn-loading');
          VT.cep.lookup(cepInput.value).then(function (a) {
            btn.classList.remove('btn-loading');
            root.querySelector('#f_logradouro').value = a.logradouro;
            root.querySelector('#f_bairro').value = a.bairro;
            root.querySelector('#f_cidade').value = a.cidade;
            root.querySelector('#f_uf').value = a.uf;
            if (!root.querySelector('#f_numero').value) root.querySelector('#f_numero').value = a.numero;
            data.cep = cepInput.value;
            renderShipOpts();
            root.querySelector('#f_numero').focus();
            VT.toast.ok('Endereço encontrado', a.cidade + '/' + a.uf);
          }).catch(function () {
            btn.classList.remove('btn-loading');
            VT.toast.err('CEP não encontrado');
          });
        }
        root.querySelector('#btnCep').addEventListener('click', fetchCep);
        cepInput.addEventListener('blur', function () {
          if (F.validCEP(cepInput.value) && !root.querySelector('#f_logradouro').value) fetchCep();
        });

        function renderShipOpts() {
          var t = VT.cart.totals();
          var q = VT.shipping.quote(cepInput.value, t.subtotal - t.discount);
          var sel = S.get('shippingSel');
          var host = root.querySelector('#shipOpts');
          host.innerHTML =
            '<h4 class="mb-3">Escolha a forma de envio</h4>' +
            '<div class="col gap-2">' +
              q.options.map(function (o) {
                var on = sel ? sel.id === o.id : o.id === 'standard';
                if (on) S.set('shippingSel', { id: o.id, name: o.name, price: o.price, days: o.days }, { silent: true });
                var eta = VT.shipping.etaRange(o.days);
                return '<label class="ship-opt' + (o.price === 0 ? ' free' : '') + '" style="cursor:pointer;padding:14px 16px">' +
                  '<input type="radio" name="shipOpt" value="' + o.id + '"' + (on ? ' checked' : '') + ' style="accent-color:var(--brand)">' +
                  '<div style="flex:1 1 auto">' +
                    '<div class="sn">' + esc(o.name) + '</div>' +
                    '<div class="sd">' + esc(o.desc) + ' · chega de ' + F.dateShort(eta.from) + ' a ' + F.dateShort(eta.to) + '</div>' +
                  '</div>' +
                  '<div class="sp">' + (o.price === 0 ? 'GRÁTIS' : F.brl(o.price)) + '</div>' +
                  '</label>';
              }).join('') +
            '</div>' +
            (q.missing > 0
              ? '<div class="tiny mt-3" style="color:var(--warn-ink)">Adicione ' + F.brl(q.missing) + ' em produtos para garantir frete grátis</div>'
              : '<div class="tiny mt-3" style="color:var(--ok-ink)">Frete grátis liberado nesta compra 🎉</div>');
          D.qsa('input[name="shipOpt"]', host).forEach(function (r) {
            r.addEventListener('change', function () {
              var o = q.options.filter(function (x) { return x.id === r.value; })[0];
              S.set('shippingSel', { id: o.id, name: o.name, price: o.price, days: o.days });
              renderSummary();
            });
          });
          renderSummary();
        }
        if (data.cep) renderShipOpts();

        root.querySelector('[data-next]').addEventListener('click', function () {
          var errors = {};
          data.cep = val('cep'); data.logradouro = val('logradouro'); data.numero = val('numero');
          data.complemento = val('complemento'); data.bairro = val('bairro');
          data.cidade = val('cidade'); data.uf = val('uf').toUpperCase();
          if (!F.validCEP(data.cep)) errors.cep = 'CEP inválido.';
          if (data.logradouro.length < 3) errors.logradouro = 'Informe o endereço.';
          if (!data.numero) errors.numero = 'Informe o número.';
          if (data.bairro.length < 2) errors.bairro = 'Informe o bairro.';
          if (data.cidade.length < 2) errors.cidade = 'Informe a cidade.';
          if (data.uf.length !== 2) errors.uf = 'UF inválida.';
          if (!setErrors(errors)) return;
          if (!S.get('shippingSel')) { VT.toast.warn('Escolha a forma de envio'); return; }
          data.step = 3;
          VT.router.reload();
        });
      }

      /* ---------- passo 3 ---------- */
      if (data.step === 3) {
        D.delegate(root, 'click', '.pay-head', function (e, node) {
          data.payment = node.parentNode.dataset.method;
          D.qsa('.pay-method', root).forEach(function (m) { m.classList.toggle('on', m.dataset.method === data.payment); });
          renderSummary();
        });
        mountCardForm(root);

        root.querySelector('[data-next]').addEventListener('click', function () {
          if (data.payment === 'card') {
            data.card.number = val('number');
            data.card.name = val('name');
            data.card.expiry = val('expiry');
            data.card.cvv = val('cvv');
            data.card.doc = val('doc');
            var selInst = root.querySelector('input[name="inst"]:checked');
            data.card.installments = selInst ? Number(selInst.value) : 1;
            data.card.installmentValue = selInst ? Number(selInst.dataset.value) : 0;
            var r = VT.payments.validateCard(data.card);
            if (!r.ok) { setErrors(r.errors); return; }
            setErrors({});
          } else {
            setErrors({});
          }
          data.step = 4;
          VT.router.reload();
        });
      }

      /* ---------- passo 4 ---------- */
      if (data.step === 4) {
        D.delegate(root, 'click', '[data-goto]', function (e, node) {
          data.step = Number(node.dataset.goto);
          VT.router.reload();
        });
        root.querySelector('#btnPlaceOrder').addEventListener('click', function () {
          if (!root.querySelector('#f_terms').checked) {
            VT.toast.warn('Aceite os termos', 'É necessário concordar com os termos para continuar.');
            return;
          }
          placeOrder(root);
        });
      }

      /* voltar */
      var back = root.querySelector('[data-back]');
      if (back) back.addEventListener('click', function () { data.step = Math.max(1, data.step - 1); VT.router.reload(); });
    }
  };

  /* ---------- formulário de cartão ---------- */
  function mountCardForm(root) {
    var form = root.querySelector('#cardForm');
    if (!form) return;
    var t = VT.cart.totals();
    var preview = {
      num: form.querySelector('[data-cv-num]'),
      name: form.querySelector('[data-cv-name]'),
      exp: form.querySelector('[data-cv-exp]'),
      brand: form.querySelector('[data-cv-brand]')
    };
    function paint() {
      var num = form.querySelector('#card_number').value;
      preview.num.textContent = num ? F.maskCard(num) : '•••• •••• •••• ••••';
      preview.name.textContent = (form.querySelector('#card_name').value || 'NOME DO TITULAR').toUpperCase();
      preview.exp.textContent = form.querySelector('#card_expiry').value || 'MM/AA';
      var b = F.cardBrand(num);
      preview.brand.textContent = b ? b.name : '';
    }
    ['number', 'name', 'expiry'].forEach(function (k) {
      var el = form.querySelector('#card_' + k);
      if (el) el.addEventListener('input', paint);
    });
    paint();

    D.qsa('input[name="inst"]', form).forEach(function (r) {
      r.addEventListener('change', function () {
        D.qsa('input[name="inst"]', form).forEach(function (x) {
          x.closest('.install-opt').classList.toggle('on', x === r);
        });
      });
    });
    if (t.installments.length && !form.querySelector('input[name="inst"]:checked')) {
      var best = t.bestInstallment;
      var target = form.querySelector('input[name="inst"][value="' + best.count + '"]') ||
        form.querySelector('input[name="inst"]');
      if (target) { target.checked = true; target.closest('.install-opt').classList.add('on'); }
    }
  }

  /* ---------- gerador dos métodos de pagamento ---------- */
  function payMethod(m, t) {
    var on = VT.pages.checkout ? true : true;
    var selected = (w.VT._paySel || 'pix') === m.id;
    var body = '';

    if (m.id === 'pix') {
      body = '<div class="pay-body">' +
        '<div class="row gap-3" style="background:var(--ok-soft);border-radius:var(--r-md);padding:14px 16px">' +
          '<span style="color:var(--ok-ink);display:grid">' + VT.icons.get('pix', 22, { filled: true }) + '</span>' +
          '<div><div class="small strong" style="color:var(--ok-ink)">Pague ' + F.brl(t.pixTotal) + ' e economize ' + F.brl(t.pixEconomy) + '</div>' +
          '<div class="tiny" style="color:var(--ink-2)">O QR Code é gerado na confirmação do pedido e vale por 30 minutos.</div></div>' +
        '</div>' +
        '<ul class="tiny muted mt-3" style="line-height:1.9">' +
          '<li>' + VT.icons.get('check', 12) + ' Aprovação imediata, 24h por dia</li>' +
          '<li>' + VT.icons.get('check', 12) + ' ' + t.pixRate + '% de desconto sobre o total</li>' +
        '</ul>' +
      '</div>';
    }

    if (m.id === 'card') {
      var insts = t.installments;
      body = '<div class="pay-body" id="cardForm">' +
        '<div class="card-visual">' +
          '<div class="cv-row">' +
            '<div><div class="cv-num" data-cv-num>•••• •••• •••• ••••</div>' +
            '<div class="cv-name" data-cv-name>NOME DO TITULAR</div></div>' +
            '<div class="tiny" data-cv-brand style="opacity:.8"></div>' +
          '</div>' +
          '<div class="cv-bottom">' +
            '<div><span>Validade</span><b data-cv-exp>MM/AA</b></div>' +
            '<div style="text-align:right"><span>CVV</span><b>•••</b></div>' +
          '</div>' +
        '</div>' +
        '<div class="grid-form">' +
          '<div class="field col-12"><label>Número do cartão <span class="req">*</span></label>' +
            '<input class="input" type="text" id="card_number" inputmode="numeric" placeholder="0000 0000 0000 0000" maxlength="24" autocomplete="cc-number">' +
            '<span class="err" data-err="number"></span></div>' +
          '<div class="field col-12"><label>Nome impresso no cartão <span class="req">*</span></label>' +
            '<input class="input" type="text" id="card_name" placeholder="Como está no cartão" autocomplete="cc-name" style="text-transform:uppercase">' +
            '<span class="err" data-err="name"></span></div>' +
          '<div class="field col-4"><label>Validade <span class="req">*</span></label>' +
            '<input class="input" type="text" id="card_expiry" inputmode="numeric" placeholder="MM/AA" maxlength="5" autocomplete="cc-exp">' +
            '<span class="err" data-err="expiry"></span></div>' +
          '<div class="field col-4"><label>CVV <span class="req">*</span></label>' +
            '<input class="input" type="text" id="card_cvv" inputmode="numeric" placeholder="123" maxlength="4" autocomplete="cc-csc">' +
            '<span class="err" data-err="cvv"></span></div>' +
          '<div class="field col-4"><label>CPF do titular <span class="req">*</span></label>' +
            '<input class="input" type="text" id="card_doc" inputmode="numeric" placeholder="000.000.000-00">' +
            '<span class="err" data-err="doc"></span></div>' +
        '</div>' +
        '<h5 class="mt-5 mb-3">Escolha o parcelamento</h5>' +
        '<div class="install-opts">' +
          insts.map(function (i) {
            return '<label class="install-opt">' +
              '<input type="radio" name="inst" value="' + i.count + '" data-value="' + i.value + '" style="accent-color:var(--brand)">' +
              '<span class="n">' + i.count + 'x</span>' +
              '<span>' + F.brl(i.value) + (i.interestFree ? ' <span class="free">sem juros</span>' : ' <span class="i">total ' + F.brl(i.total) + '</span>') + '</span>' +
              '<span class="t">' + (i.interestFree ? '' : '+' + F.brl(i.diff)) + '</span>' +
              '</label>';
          }).join('') +
          '<span class="err" data-err="installments"></span>' +
        '</div>' +
        '<div class="tiny dim mt-3">' + VT.icons.get('info', 12) +
          ' Teste: use 4111 1111 1111 1111 para aprovar · final 0000 recusa · final 9999 sem limite.</div>' +
      '</div>';
    }

    if (m.id === 'boleto') {
      body = '<div class="pay-body">' +
        '<div class="boleto-box">' +
          VT.icons.get('barcode', 34) +
          '<div class="strong mt-3">Você receberá o boleto após confirmar</div>' +
          '<div class="tiny muted mt-2">Vence em ' + F.date(F.addDays(Date.now(), 3)) + ' · ' + F.brl(t.total) + '</div>' +
        '</div>' +
        '<ul class="tiny muted mt-3" style="line-height:1.9">' +
          '<li>' + VT.icons.get('alertTri', 12) + ' A compensação leva até 2 dias úteis</li>' +
          '<li>' + VT.icons.get('check', 12) + ' Não pague após o vencimento — o pedido é cancelado</li>' +
        '</ul>' +
      '</div>';
    }

    return '<div class="pay-method' + (selected ? ' on' : '') + '" data-method="' + m.id + '">' +
      '<button class="pay-head" type="button">' +
        '<span class="pay-radio"></span>' +
        '<span class="pay-ico">' + VT.icons.get(m.icon, 20, { filled: m.id === 'pix' }) + '</span>' +
        '<span style="flex:1 1 auto;text-align:left">' +
          '<span class="pay-t">' + m.name + '</span><br>' +
          '<span class="pay-s">' + m.desc + '</span>' +
        '</span>' +
        (m.id === 'pix' && t.pixRate ? '<span class="badge badge-ok pay-badge-off">-' + t.pixRate + '%</span>' : '') +
      '</button>' +
      body +
      '</div>';
  }

  /* ---------- finalizar pedido ---------- */
  function placeOrder(root) {
    var t = VT.cart.totals();
    var btn = root.querySelector('#btnPlaceOrder');
    btn.classList.add('btn-loading');
    btn.disabled = true;

    var order = VT.payments.createOrder({
      totals: t,
      customer: { name: data.name, email: data.email, doc: data.doc, phone: data.phone },
      address: {
        cep: data.cep, logradouro: data.logradouro, numero: data.numero,
        complemento: data.complemento, bairro: data.bairro, cidade: data.cidade, uf: data.uf
      },
      shipping: S.get('shippingSel'),
      payment: data.payment,
      card: data.payment === 'card' ? data.card : null
    });

    VT.payments.process(order, { cardNumber: data.card.number }).then(function (res) {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
      if (!res.ok) {
        VT.toast.err('Pagamento não aprovado', res.message);
        data.step = 3;
        VT.router.reload();
        return;
      }
      order.gateway = { txid: res.txid, nsu: res.nsu, auth: res.authCode, paidAt: res.paidAt };
      order.timeline[1] = { t: 'Pagamento aprovado', d: res.paidAt, done: true, icon: 'checkCircle' };
      S.addOrder(order);

      /* salva o endereço para as próximas compras */
      var addrs = S.get('addresses') || [];
      if (!addrs.some(function (a) { return a.cep === data.cep && a.numero === data.numero; })) {
        addrs.unshift({
          id: 'addr-' + Date.now(), label: 'Principal',
          cep: data.cep, logradouro: data.logradouro, numero: data.numero,
          complemento: data.complemento, bairro: data.bairro, cidade: data.cidade, uf: data.uf
        });
        S.set('addresses', addrs.slice(0, 5));
      }
      /* cria/atualiza o usuário da sessão */
      if (!S.get('user')) {
        S.login({ name: data.name, email: data.email, doc: data.doc, phone: data.phone, createdAt: new Date() });
      }

      VT.cart.clear();
      data.step = 1;
      location.hash = '#/pedido/' + order.code;
    }).catch(function (err) {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
      VT.toast.err('Erro inesperado', String(err && err.message || err));
    });
  }

  /* ============================ CONFIRMAÇÃO ============================ */
  VT.pages.order = {
    title: 'Pedido confirmado — Vitrine',

    render: function (params) {
      var code = params.code;
      var order = null;
      (S.get('orders') || []).forEach(function (o) { if (o.code === code) order = o; });
      if (!order && S.get('lastOrder') && S.get('lastOrder').code === code) order = S.get('lastOrder');
      if (!order) {
        VT.seed.orders.forEach(function (o) { if (o.code === code) order = o; });
      }
      if (!order) {
        return '<div class="shell section">' +
          U.empty('receipt', 'Pedido não encontrado',
            'Não localizamos o pedido ' + esc(code) + ' nesta instalação.',
            '<a class="btn btn-primary mt-4" href="#/categoria" data-link>Ir às compras</a>') +
          '</div>';
      }

      var payIcon = order.payment === 'pix' ? 'pix' : (order.payment === 'card' ? 'card' : 'barcode');
      var isPending = order.status === 'pending';

      return '<div class="shell">' +
        '<div class="done-hero">' +
          '<div class="done-ico">' + VT.icons.get(isPending ? 'clock' : 'checkCircle', 46) + '</div>' +
          '<h1>' + (isPending ? 'Pedido reservado!' : 'Pedido confirmado!') + '</h1>' +
          '<p class="muted" style="max-width:52ch;margin-inline:auto">' +
            (isPending
              ? 'Estamos aguardando a compensação do pagamento. Assim que confirmar, você recebe o código de rastreio.'
              : 'Pagamento aprovado. Enviamos um e-mail com todos os detalhes para <b>' + esc(order.customer.email) + '</b>.') +
          '</p>' +
          '<div class="done-code mt-5">' + VT.icons.get('receipt', 16) + ' ' + esc(order.code) + '</div>' +
        '</div>' +

        '<div class="grid-2-1 gap-5 mb-8">' +
          '<div class="col gap-4">' +

            /* pagamento */
            (order.payment === 'pix' && order.pix
              ? '<div class="panel"><div class="card-head"><h3>' + VT.icons.get('pix', 18, { filled: true }) + ' Pague com Pix</h3>' +
                  '<span class="badge badge-warn">Expira em 30 min</span></div>' +
                '<div class="card-pad center">' +
                  '<div class="pix-qr">' + order.pix.qr + '</div>' +
                  '<div class="strong">' + F.brl(order.total) + '</div>' +
                  '<div class="tiny muted mt-2">Chave: ' + esc(order.pix.key) + '</div>' +
                  '<div class="pix-code mt-4"><code id="pixCode">' + esc(order.pix.code) + '</code>' +
                    '<button class="btn btn-primary btn-sm" data-copy-pix>' + VT.icons.get('copy', 15) + ' Copiar</button></div>' +
                  '<div class="tiny dim mt-3">Aponte a câmera do seu banco ou cole o código.</div>' +
                '</div></div>'
              : '') +

            (order.payment === 'boleto' && order.boleto
              ? '<div class="panel"><div class="card-head"><h3>' + VT.icons.get('barcode', 18) + ' Boleto bancário</h3>' +
                  '<span class="badge badge-warn">Vence em ' + F.date(order.boleto.dueDate) + '</span></div>' +
                '<div class="card-pad">' +
                  '<div class="boleto-box">' +
                    '<div class="tiny muted">Linha digitável</div>' +
                    '<div class="boleto-code" id="boletoCode">' + esc(order.boleto.line) + '</div>' +
                    '<div class="row gap-2" style="justify-content:center">' +
                      '<button class="btn btn-primary btn-sm" data-copy-boleto>' + VT.icons.get('copy', 15) + ' Copiar código</button>' +
                      '<button class="btn btn-outline btn-sm" data-print>' + VT.icons.get('printer', 15) + ' Imprimir</button>' +
                    '</div>' +
                  '</div>' +
                  '<div class="tiny dim mt-3">Após o pagamento, a compensação leva até 2 dias úteis.</div>' +
                '</div></div>'
              : '') +

            /* itens */
            '<div class="panel">' +
              '<div class="card-head"><h3>' + VT.icons.get('package', 18) + ' ' + order.itemCount + ' ' +
                F.plural(order.itemCount, 'item', 'itens') + '</h3>' +
                '<span class="badge badge-info">' + esc(VT.payments.PAY_LABEL[order.payment]) + '</span></div>' +
              '<div class="card-pad">' +
                order.items.map(function (it) {
                  return '<div class="cart-item" style="grid-template-columns:70px 1fr">' +
                    '<div class="cart-thumb" style="width:70px;height:70px">' + VT.art.product(it.art, it.hue) + '</div>' +
                    '<div class="row-b gap-3">' +
                      '<div style="min-width:0">' +
                        '<a class="small strong trunc" href="#/produto/' + esc(it.slug) + '" data-link>' + esc(it.name) + '</a>' +
                        '<div class="tiny dim">' + it.qty + ' x ' + F.brl(it.price) +
                          (it.variant ? ' · ' + esc(it.variant.value) : '') + '</div>' +
                      '</div>' +
                      '<span class="small strong">' + F.brl(it.price * it.qty) + '</span>' +
                    '</div></div>';
                }).join('') +
                '<div class="divider my-4"></div>' +
                '<div class="sum-line"><span>Produtos</span><span class="v">' + F.brl(order.subtotal) + '</span></div>' +
                (order.discount ? '<div class="sum-line disc"><span>Cupom ' + esc(order.coupon) + '</span><span class="v">− ' + F.brl(order.discount) + '</span></div>' : '') +
                '<div class="sum-line"><span>Frete (' + esc(order.shippingName) + ')</span><span class="v">' + (order.shipping ? F.brl(order.shipping) : 'grátis') + '</span></div>' +
                '<div class="sum-line big"><span>Total</span><span class="v">' + F.brl(order.total) + '</span></div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="col gap-4">' +
            '<div class="panel"><div class="card-head"><h3>' + VT.icons.get('truck', 18) + ' Entrega</h3></div>' +
              '<div class="card-pad">' +
                '<div class="small strong">' + esc(order.customer.name) + '</div>' +
                '<div class="small muted" style="line-height:1.7">' +
                  esc(order.address.logradouro) + ', ' + esc(order.address.numero) +
                  (order.address.complemento ? ' — ' + esc(order.address.complemento) : '') + '<br>' +
                  esc(order.address.bairro) + ' · ' + esc(order.address.cidade) + '/' + esc(order.address.uf) + '<br>' +
                  'CEP ' + esc(order.address.cep) +
                '</div>' +
                '<div class="divider my-4"></div>' +
                '<div class="small"><b>Previsão:</b> ' + F.date(order.eta.from) + ' a ' + F.date(order.eta.to) + '</div>' +
                '<div class="timeline mt-5">' +
                  order.timeline.map(function (tl) {
                    var cls = tl.done ? 'done' : (isPending ? '' : 'now');
                    return '<div class="tl-item ' + cls + '">' +
                      '<div class="tl-t">' + esc(tl.t) + '</div>' +
                      '<div class="tl-d">' + (tl.d ? F.date(tl.d, { time: true }) : 'aguardando') + '</div>' +
                      '</div>';
                  }).join('') +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="panel"><div class="card-head"><h3>' + VT.icons.get('help', 18) + ' Precisa de ajuda?</h3></div>' +
              '<div class="card-pad col gap-3">' +
                '<a class="btn btn-outline btn-block btn-sm" href="#/conta/pedidos" data-link>' +
                  VT.icons.get('receipt', 15) + ' Acompanhar meus pedidos</a>' +
                '<a class="btn btn-outline btn-block btn-sm" href="#/institucional/contato" data-link>' +
                  VT.icons.get('chat', 15) + ' Falar com o suporte</a>' +
                '<a class="btn btn-primary btn-block btn-sm" href="#/categoria" data-link>' +
                  VT.icons.get('bag', 15) + ' Continuar comprando</a>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<section class="section-sm">' +
          U.sectionHead('Aproveite', 'Complete seu pedido') +
          '<div class="prod-grid">' +
            VT.catalog.query({ sort: 'rating' }).slice(0, 4).map(function (p) { return U.productCard(p); }).join('') +
          '</div>' +
        '</section>' +
      '</div>';
    },

    mount: function (root, params) {
      var pixBtn = root.querySelector('[data-copy-pix]');
      if (pixBtn) {
        pixBtn.addEventListener('click', function () {
          var code = root.querySelector('#pixCode').textContent;
          D.copy(code).then(function () {
            VT.toast.ok('Código Pix copiado!', 'Cole no app do seu banco para pagar.');
          }).catch(function () { VT.toast.err('Não foi possível copiar'); });
        });
      }
      var bolBtn = root.querySelector('[data-copy-boleto]');
      if (bolBtn) {
        bolBtn.addEventListener('click', function () {
          D.copy(root.querySelector('#boletoCode').textContent).then(function () {
            VT.toast.ok('Linha digitável copiada!');
          });
        });
      }
      var printBtn = root.querySelector('[data-print]');
      if (printBtn) printBtn.addEventListener('click', function () { w.print(); });
    }
  };

  /* expõe o selecionado para o gerador de métodos */
  Object.defineProperty(VT, '_paySel', {
    get: function () { return VT.pages.checkout && VT.pages.checkout._paySel; }
  });
  VT.pages.checkout._paySel = 'pix';

  /* mantém o método selecionado sincronizado com `data` */
  var _mount = VT.pages.checkout.mount;
  VT.pages.checkout.mount = function (root) {
    VT.pages.checkout._paySel = data.payment;
    _mount.call(this, root);
  };
})(window);
