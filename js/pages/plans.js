/* ============================================================
   VITRINE PRO — pages/plans.js
   Planos e preços: mensal/anual, comparativo, FAQ e contratação.
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};
  var F = VT.format, D = VT.dom, S = VT.store, U = VT.ui;
  var esc = D.esc;

  VT.pages = VT.pages || {};

  var PLANS = [
    {
      id: 'starter', name: 'Starter', monthly: 49, desc: 'Para quem está começando a vender online.',
      feats: [
        ['Até 200 produtos', true], ['Loja responsiva completa', true],
        ['Checkout Pix + cartão + boleto', true], ['1 usuário no painel', true],
        ['Relatórios básicos', true], ['Cupons ilimitados', false],
        ['Domínio próprio', false], ['Integração com marketplaces', false],
        ['Suporte prioritário', false], ['API de integração', false]
      ]
    },
    {
      id: 'pro', name: 'Pro', monthly: 149, featured: true, flag: 'Mais escolhido',
      desc: 'Para lojas que cresceram e precisam de controle.',
      feats: [
        ['Produtos ilimitados', true], ['Loja responsiva completa', true],
        ['Checkout Pix + cartão + boleto', true], ['5 usuários no painel', true],
        ['Relatórios avançados + exportação', true], ['Cupons ilimitados', true],
        ['Domínio próprio', true], ['Integração com marketplaces', true],
        ['Suporte prioritário', true], ['API de integração', false]
      ]
    },
    {
      id: 'scale', name: 'Scale', monthly: 399, desc: 'Operação de alto volume com SLA.',
      feats: [
        ['Tudo do plano Pro', true], ['Usuários ilimitados', true],
        ['Múltiplas lojas (multiloja)', true], ['API completa + webhooks', true],
        ['Gerente de conta dedicado', true], ['SLA de 99,9% com multa', true],
        ['Migração assistida', true], ['Relatórios customizados', true],
        ['Antifraude avançado', true], ['Treinamento da equipe', true]
      ]
    }
  ];

  var FAQS = [
    ['Posso trocar de plano depois?', 'Sim, a qualquer momento. O valor é ajustado proporcionalmente e aparece na próxima fatura — para mais ou para menos.'],
    ['Existe fidelidade?', 'Não. Todos os planos são mensais e você pode cancelar quando quiser pelo painel, sem falar com ninguém.'],
    ['Como funciona o teste?', 'São 14 dias grátis no plano Pro, sem pedir cartão. Se não gostar, nada é cobrado.'],
    ['As taxas já estão inclusas?', 'Não. As taxas dos meios de pagamento (Pix, cartão e boleto) são cobradas diretamente pelo seu gateway e variam por adquirente.'],
    ['Consigo usar meu domínio?', 'Sim, nos planos Pro e Scale. Aponte o DNS para a gente e emitimos o certificado HTTPS automaticamente.'],
    ['E se eu vender mais que o limite?', 'Avisamos antes de chegar no limite e sugerimos o upgrade. Nunca bloqueamos sua loja no meio de uma campanha.']
  ];

  var COMPARE = [
    ['Produtos cadastrados', '200', 'Ilimitado', 'Ilimitado'],
    ['Usuários no painel', '1', '5', 'Ilimitado'],
    ['Cupons de desconto', '—', 'Ilimitado', 'Ilimitado'],
    ['Relatórios avançados', 'no', 'yes', 'yes'],
    ['Domínio próprio + HTTPS', 'no', 'yes', 'yes'],
    ['Marketplaces (Mercado Livre, Shopee)', 'no', 'yes', 'yes'],
    ['API e webhooks', 'no', 'no', 'yes'],
    ['Antifraude avançado', 'no', 'no', 'yes'],
    ['Gerente de conta', 'no', 'no', 'yes'],
    ['Suporte', 'E-mail', 'Chat + e-mail', 'Prioritário 24/7'],
    ['SLA de disponibilidade', 'no', '99,5%', '99,9% com multa']
  ];

  VT.pages.plans = {
    title: 'Planos e preços — Vitrine',

    render: function () {
      return '<div class="plans-hero">' +
          '<span class="badge badge-brand mb-4">14 dias grátis · sem cartão</span>' +
          '<h1>Escolha o plano do tamanho da sua <span class="grad-text">ambição</span></h1>' +
          '<p>Comece pequeno, cresça sem trocar de plataforma. Todos os planos incluem a loja completa.</p>' +
          '<div class="billing-toggle">' +
            '<span class="' + 'strong' + '" data-bill-label-m>Mensal</span>' +
            '<button class="switch" id="billToggle" role="switch" aria-checked="false" aria-label="Alternar cobrança">' +
              '<input type="checkbox"><span class="track"></span></button>' +
            '<span data-bill-label-a class="muted">Anual</span>' +
            '<span class="save">economize 20%</span>' +
          '</div>' +
        '</div>' +

        '<div class="shell-wide"><div class="shell" style="padding-inline:0">' +
          '<div class="plans-grid" id="plansGrid">' + plansGrid(false) + '</div>' +

          /* confiança */
          '<div class="row gap-6 wrap center mt-8" style="justify-content:center">' +
            [['shieldCheck', 'Cancelamento em 1 clique'], ['lock', 'Pagamento criptografado'],
             ['refresh', 'Migração assistida'], ['headphones', 'Suporte em português']].map(function (b) {
              return '<div class="row gap-2"><span style="color:var(--ok-ink);display:grid">' +
                VT.icons.get(b[0], 17) + '</span><span class="small muted">' + b[1] + '</span></div>';
            }).join('') +
          '</div>' +

          /* comparativo */
          '<section class="section">' +
            U.sectionHead('Compare', 'Todos os recursos lado a lado') +
            '<div class="panel" style="overflow:hidden"><div class="table-wrap">' +
              '<table class="compare-table">' +
                '<thead><tr><th>Recurso</th>' +
                  '<th>Starter</th><th class="feat-col">Pro</th><th>Scale</th>' +
                '</tr></thead>' +
                '<tbody>' +
                  COMPARE.map(function (row) {
                    return '<tr><td>' + esc(row[0]) + '</td>' +
                      row.slice(1).map(function (v, i) {
                        var isFeat = i === 1;
                        if (v === 'yes') return '<td class="' + (isFeat ? 'feat-col ' : '') + 'yes">' + VT.icons.get('checkCircle', 19, { style: 'display:inline-block' }) + '</td>';
                        if (v === 'no') return '<td class="' + (isFeat ? 'feat-col ' : '') + 'no">—</td>';
                        return '<td class="' + (isFeat ? 'feat-col ' : '') + 'strong">' + esc(v) + '</td>';
                      }).join('') +
                      '</tr>';
                  }).join('') +
                '</tbody>' +
              '</table>' +
            '</div></div>' +
          '</section>' +

          /* FAQ */
          '<section class="section-sm">' +
            U.sectionHead('Dúvidas', 'Perguntas frequentes') +
            '<div class="faq-grid">' +
              FAQS.map(function (f, i) {
                return '<div class="acc' + (i === 0 ? ' open' : '') + '">' +
                  '<button class="acc-btn">' + esc(f[0]) +
                    '<span class="plus">' + VT.icons.get('plus', 18) + '</span></button>' +
                  '<div class="acc-body"><div><p>' + esc(f[1]) + '</p></div></div>' +
                  '</div>';
              }).join('') +
            '</div>' +
          '</section>' +

          /* CTA final */
          '<section class="section-sm">' +
            '<div class="news-cta" data-reveal>' +
              '<div style="position:relative;z-index:1">' +
                '<h2>Pronto para vender hoje?</h2>' +
                '<p class="mt-3" style="color:rgba(255,255,255,.8)">Crie sua loja, importe seus produtos e receba o primeiro pedido em minutos.</p>' +
                '<div class="row gap-3 wrap mt-5">' +
                  '<button class="btn btn-accent btn-lg" data-hire="pro">' + VT.icons.get('zap', 19) + ' Começar teste grátis</button>' +
                  '<a class="btn btn-outline btn-lg" href="#/institucional/contato" data-link style="border-color:rgba(255,255,255,.4);color:#fff">Falar com consultor</a>' +
                '</div>' +
              '</div>' +
              '<div class="news-art">' + VT.icons.get('rocket', 120) + '</div>' +
            '</div>' +
          '</section>' +
        '</div></div>';
    },

    mount: function (root) {
      var yearly = false;
      var toggle = root.querySelector('#billToggle');
      var lm = root.querySelector('[data-bill-label-m]');
      var la = root.querySelector('[data-bill-label-a]');

      toggle.addEventListener('click', function () {
        yearly = !yearly;
        toggle.setAttribute('aria-checked', String(yearly));
        toggle.querySelector('input').checked = yearly;
        lm.className = yearly ? 'muted' : 'strong';
        la.className = yearly ? 'strong' : 'muted';
        root.querySelector('#plansGrid').innerHTML = plansGrid(yearly);
      });

      /* acordeão */
      D.delegate(root, 'click', '.acc-btn', function (e, node) {
        node.parentNode.classList.toggle('open');
      });

      /* contratar */
      D.delegate(root, 'click', '[data-hire]', function (e, node) {
        var id = node.dataset.hire;
        var plan = PLANS.filter(function (p) { return p.id === id; })[0];
        if (!plan) return;
        openHire(plan, yearly);
      });
    }
  };

  /* ------------------------- grade de planos ------------------------- */
  function plansGrid(yearly) {
    return PLANS.map(function (p) {
      var value = yearly ? Math.round(p.monthly * .8) : p.monthly;
      return '<div class="plan' + (p.featured ? ' feat' : '') + '" data-plan="' + p.id + '">' +
        (p.flag ? '<span class="plan-flag">' + esc(p.flag) + '</span>' : '') +
        '<div class="plan-name">' + esc(p.name) + '</div>' +
        '<div class="plan-desc">' + esc(p.desc) + '</div>' +
        (yearly ? '<div class="plan-from">de ' + F.brl(p.monthly) + '/mês</div>' : '') +
        '<div class="plan-price">' +
          '<span class="cur">R$</span>' +
          '<span class="v">' + value + '</span>' +
          '<span class="per">/mês' + (yearly ? ' · cobrado anualmente' : '') + '</span>' +
        '</div>' +
        '<ul class="plan-feats">' +
          p.feats.map(function (f) {
            return '<li class="' + (f[1] ? '' : 'off') + '">' +
              '<span class="k">' + VT.icons.get(f[1] ? 'check' : 'x', 11, { stroke: 3 }) + '</span>' +
              esc(f[0]) + '</li>';
          }).join('') +
        '</ul>' +
        '<button class="btn ' + (p.featured ? 'btn-primary' : 'btn-outline') + ' btn-lg btn-block" data-hire="' + p.id + '">' +
          (p.id === 'starter' ? 'Começar de graça' : (p.id === 'pro' ? 'Testar 14 dias' : 'Falar com vendas')) + '</button>' +
        '<div class="tiny dim center mt-3">' +
          (p.id === 'scale' ? 'implantação em até 5 dias úteis' : 'sem taxa de adesão · cancele quando quiser') +
        '</div>' +
        '</div>';
    }).join('');
  }

  /* ------------------------- modal de contratação ------------------------- */
  function openHire(plan, yearly) {
    var value = yearly ? Math.round(plan.monthly * .8) : plan.monthly;
    var total = yearly ? value * 12 : value;

    VT.modal.open({
      title: 'Assinar o plano ' + plan.name,
      sub: (yearly ? 'Cobrança anual — ' : 'Cobrança mensal — ') + F.brl(value) + '/mês',
      body:
        '<div class="row-b mb-5" style="background:var(--surface-2);border-radius:var(--r-lg);padding:var(--sp-4)">' +
          '<div><div class="strong">' + esc(plan.name) + '</div>' +
            '<div class="tiny muted">' + (yearly ? '12 meses de acesso' : 'renova automaticamente') + '</div></div>' +
          '<div class="right"><div class="price price-lg">' + F.brl(yearly ? total : value) + '</div>' +
            (yearly ? '<div class="tiny dim">' + F.brl(value) + '/mês</div>' : '') + '</div>' +
        '</div>' +

        '<div id="hireCardForm">' +
          '<div class="grid-form">' +
            '<div class="field col-12"><label>Nome da loja <span class="req">*</span></label>' +
              '<input class="input" id="hp_store" placeholder="Minha Loja"></div>' +
            '<div class="field col-6"><label>E-mail <span class="req">*</span></label>' +
              '<input class="input" type="email" id="hp_email" placeholder="voce@loja.com"></div>' +
            '<div class="field col-6"><label>CNPJ/CPF <span class="req">*</span></label>' +
              '<input class="input" id="hp_doc" placeholder="00.000.000/0000-00"></div>' +
            '<div class="field col-12"><label>Número do cartão <span class="req">*</span></label>' +
              '<input class="input" id="hp_num" placeholder="0000 0000 0000 0000" inputmode="numeric"></div>' +
            '<div class="field col-6"><label>Validade <span class="req">*</span></label>' +
              '<input class="input" id="hp_exp" placeholder="MM/AA" maxlength="5" inputmode="numeric"></div>' +
            '<div class="field col-6"><label>CVV <span class="req">*</span></label>' +
              '<input class="input" id="hp_cvv" placeholder="123" maxlength="4" inputmode="numeric"></div>' +
          '</div>' +
          '<div id="hp_err" class="mt-4"></div>' +
        '</div>' +
        '<div class="tiny dim mt-4">' + VT.icons.get('lock', 12) +
          ' Ambiente de demonstração — nenhum dado é enviado e nenhuma cobrança é realizada.</div>',

      footer: '<button class="btn btn-ghost" data-close>Cancelar</button>' +
        '<button class="btn btn-primary btn-lg" data-confirm>Confirmar assinatura</button>',

      onMount: function (node, close) {
        var num = node.querySelector('#hp_num'), exp = node.querySelector('#hp_exp'), doc = node.querySelector('#hp_doc');
        num.addEventListener('input', function () { num.value = F.maskCard(num.value); });
        exp.addEventListener('input', function () { exp.value = F.maskExpiry(exp.value); });
        doc.addEventListener('input', function () { doc.value = F.maskCPFCNPJ(doc.value); });

        node.querySelector('[data-confirm]').addEventListener('click', function () {
          var errBox = node.querySelector('#hp_err');
          var data = {
            number: num.value, name: node.querySelector('#hp_store').value,
            expiry: exp.value, cvv: node.querySelector('#hp_cvv').value,
            doc: doc.value, installments: 1
          };
          var errs = {};
          if (node.querySelector('#hp_store').value.trim().length < 2) errs.store = 'Informe o nome da loja.';
          if (!F.validEmail(node.querySelector('#hp_email').value.trim())) errs.email = 'E-mail inválido.';
          var r = VT.payments.validateCard(data);
          if (!r.ok) errs = Object.assign(errs, r.errors);

          if (Object.keys(errs).length) {
            errBox.innerHTML = '<div class="badge badge-danger" style="padding:8px 12px">' +
              VT.icons.get('alertTri', 14) + ' ' + esc(Object.values(errs)[0]) + '</div>';
            return;
          }
          errBox.innerHTML = '';
          var btn = node.querySelector('[data-confirm]');
          btn.classList.add('btn-loading');
          setTimeout(function () {
            btn.classList.remove('btn-loading');
            close();
            VT.toast.ok('Assinatura ativada!', 'Plano ' + plan.name + ' liberado por 14 dias grátis.');
          }, 1200);
        });
      }
    });
  }
})(window);
