/* ============================================================
   VITRINE PRO — pages/account.js
   Login/cadastro + área do cliente (pedidos, favoritos,
   endereços e dados pessoais).
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};
  var F = VT.format, D = VT.dom, S = VT.store, U = VT.ui;
  var esc = D.esc;

  VT.pages = VT.pages || {};

  var SECTIONS = [
    { id: 'overview', label: 'Visão geral', icon: 'grid' },
    { id: 'pedidos', label: 'Meus pedidos', icon: 'receipt' },
    { id: 'favoritos', label: 'Favoritos', icon: 'heart' },
    { id: 'enderecos', label: 'Endereços', icon: 'mapPin' },
    { id: 'dados', label: 'Meus dados', icon: 'user' }
  ];

  VT.pages.account = {
    title: 'Minha conta — Vitrine',

    render: function (params) {
      var user = S.get('user');
      if (!user) return this.loginHTML();
      var section = (params && params.section) || 'overview';
      return this.panelHTML(user, section);
    },

    /* ------------------------- login ------------------------- */
    loginHTML: function () {
      return '<div class="auth-wrap">' +
        '<aside class="auth-side">' +
          '<div class="as-top"><span class="brand-txt">VITRINE<b>PRO</b></span></div>' +
          '<div style="position:relative;z-index:1">' +
            '<h2>Entre para acompanhar seus pedidos</h2>' +
            '<p>Histórico completo, endereços salvos, favoritos e reembolso em um clique.</p>' +
          '</div>' +
          '<ul class="as-list" style="position:relative;z-index:1">' +
            ['Rastreio de todos os pedidos', 'Endereços ilimitados salvos', 'Lista de favoritos sincronizada', 'Notas fiscais arquivadas']
              .map(function (t) {
                return '<li><span class="k">' + VT.icons.get('check', 13, { stroke: 3 }) + '</span>' + t + '</li>';
              }).join('') +
          '</ul>' +
        '</aside>' +

        '<div class="auth-form">' +
          '<div class="auth-form-in">' +
            '<h1>Bem-vindo de volta</h1>' +
            '<p class="sub">Entre com sua conta ou crie uma agora mesmo.</p>' +

            '<div class="auth-alt">' +
              '<button class="btn-oauth" data-oauth="google">' +
                '<svg viewBox="0 0 24 24" width="19" height="19"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z"/></svg>' +
                ' Continuar com Google</button>' +
              '<button class="btn-oauth" data-oauth="apple">' + VT.icons.get('smartphone', 19) + ' Continuar com Apple</button>' +
            '</div>' +

            '<div class="or-line">ou use seu e-mail</div>' +

            '<form id="loginForm" class="col gap-4">' +
              '<div class="field"><label for="lg_email">E-mail <span class="req">*</span></label>' +
                '<input class="input icon-left" type="email" id="lg_email" placeholder="voce@email.com" autocomplete="email" required>' +
                '<span class="err" id="lg_email_err"></span></div>' +
              '<div class="field"><label for="lg_pass">Senha <span class="req">*</span></label>' +
                '<div class="input-wrap">' +
                  '<input class="input icon-left" type="password" id="lg_pass" placeholder="••••••••" autocomplete="current-password" required>' +
                  '<button type="button" class="tail iconbtn" data-toggle-pass aria-label="Mostrar senha">' + VT.icons.get('eye', 18) + '</button>' +
                '</div>' +
                '<span class="err" id="lg_pass_err"></span></div>' +
              '<div class="row-b wrap gap-3">' +
                '<label class="check" style="align-items:center"><input type="checkbox" id="lg_keep" checked>' +
                  '<span class="box">' + VT.icons.get('check', 12, { stroke: 3 }) + '</span><span class="small">Manter conectado</span></label>' +
                '<a href="#" class="small" style="color:var(--brand)" data-forgot>Esqueci minha senha</a>' +
              '</div>' +
              '<button class="btn btn-primary btn-lg btn-block" type="submit">Entrar</button>' +
            '</form>' +

            '<div class="divider my-6"></div>' +
            '<p class="small muted center mb-4">Ainda não tem conta?</p>' +
            '<button class="btn btn-outline btn-block" data-open-register>Criar minha conta</button>' +

            '<div class="panel mt-6" style="padding:var(--sp-4);background:var(--brand-soft);border-color:var(--brand)">' +
              '<div class="row gap-3">' +
                '<span style="color:var(--brand-700);display:grid">' + VT.icons.get('info', 20) + '</span>' +
                '<div>' +
                  '<div class="small strong" style="color:var(--brand-700)">Ambiente de demonstração</div>' +
                  '<div class="tiny" style="color:var(--ink-2)">Use <b>demo@vitrine.com</b> com a senha <b>123456</b> — ou qualquer e-mail válido com senha de 6+ caracteres.</div>' +
                  '<button class="btn btn-xs btn-soft mt-2" data-demo-login>Entrar como demonstração</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    },

    /* ------------------------- área logada ------------------------- */
    panelHTML: function (user, section) {
      var orders = S.myOrders();
      var favs = S.get('wishlist') || [];
      var addrs = S.get('addresses') || [];
      var spent = orders.reduce(function (s, o) { return o.status === 'cancelled' ? s : s + o.total; }, 0);

      return '<div class="shell-wide"><div class="shell" style="padding-inline:0">' +
        '<div class="row-b wrap gap-3 mb-6">' +
          '<div class="row gap-4">' +
            U.avatar(user.name, user.hue || 250, 'avatar-lg') +
            '<div>' +
              '<h1 style="font-size:var(--fs-2xl)">Olá, ' + esc(user.name.split(' ')[0]) + ' 👋</h1>' +
              '<p class="muted small">' + esc(user.email) + '</p>' +
            '</div>' +
          '</div>' +
          '<button class="btn btn-ghost btn-sm" data-logout>' + VT.icons.get('logout', 16) + ' Sair da conta</button>' +
        '</div>' +

        '<div class="acct-layout">' +
          '<nav class="acct-nav">' +
            '<div>' +
              SECTIONS.map(function (s) {
                var cnt = s.id === 'pedidos' ? orders.length : (s.id === 'favoritos' ? favs.length : (s.id === 'enderecos' ? addrs.length : ''));
                return '<a class="an-link' + (section === s.id ? ' on' : '') + '" href="#/conta/' + s.id + '" data-link>' +
                  VT.icons.get(s.icon, 18) + esc(s.label) +
                  (cnt !== '' ? '<span class="cnt">' + cnt + '</span>' : '') +
                  '</a>';
              }).join('') +
            '</div>' +
          '</nav>' +

          '<div id="acctBody">' + this.sectionHTML(section, { orders: orders, favs: favs, addrs: addrs, user: user, spent: spent }) + '</div>' +
        '</div>' +
      '</div></div>';
    },

    sectionHTML: function (section, ctx) {
      var orders = ctx.orders, favs = ctx.favs, addrs = ctx.addrs, user = ctx.user;

      /* ---------- visão geral ---------- */
      if (section === 'overview') {
        var recent = orders.slice(0, 3);
        return '<div class="col gap-4">' +
          '<div class="grid-3">' +
            miniStat('Pedidos', orders.length, 'receipt', 'total de compras') +
            miniStat('Total investido', F.brl(ctx.spent), 'money', 'em ' + orders.length + ' pedidos') +
            miniStat('Favoritos', favs.length, 'heart', 'salvos para depois') +
          '</div>' +

          '<div class="panel">' +
            '<div class="card-head"><h3>Pedidos recentes</h3>' +
              '<a class="btn btn-ghost btn-sm" href="#/conta/pedidos" data-link>Ver todos</a></div>' +
            '<div class="card-pad">' +
              (recent.length
                ? recent.slice(0, 3).map(orderCard).join('')
                : U.empty('receipt', 'Nenhum pedido ainda', 'Que tal dar uma olhada no que preparamos para você?',
                    '<a class="btn btn-primary mt-4" href="#/categoria" data-link>Explorar catálogo</a>')) +
            '</div>' +
          '</div>' +

          '<div class="panel">' +
            '<div class="card-head"><h3>' + VT.icons.get('heart', 18) + ' Sua lista de desejos</h3>' +
              '<a class="btn btn-ghost btn-sm" href="#/conta/favoritos" data-link>Ver todos</a></div>' +
            '<div class="card-pad">' +
              (favs.length
                ? '<div class="prod-grid">' + favs.slice(0, 4).map(function (id) {
                    var p = S.product(id);
                    return p ? U.productCard(p) : '';
                  }).join('') + '</div>'
                : U.empty('heart', 'Nenhum favorito salvo', 'Toque no coração dos produtos para guardá-los aqui.')) +
            '</div>' +
          '</div>' +
        '</div>';
      }

      /* ---------- pedidos ---------- */
      if (section === 'pedidos') {
        return '<div class="panel">' +
          '<div class="card-head"><h3>Meus pedidos</h3>' +
            '<span class="tiny dim">' + orders.length + ' ' + F.plural(orders.length, 'pedido', 'pedidos') + '</span></div>' +
          '<div class="card-pad">' +
            (orders.length
              ? orders.map(orderCard).join('')
              : U.empty('receipt', 'Você ainda não fez pedidos',
                  'Quando comprar, o histórico completo aparece aqui — com rastreio e nota fiscal.',
                  '<a class="btn btn-primary mt-4" href="#/categoria" data-link>Começar a comprar</a>')) +
          '</div>' +
        '</div>';
      }

      /* ---------- favoritos ---------- */
      if (section === 'favoritos') {
        return '<div class="panel">' +
          '<div class="card-head"><h3>Favoritos</h3><span class="tiny dim">' + favs.length + ' salvos</span></div>' +
          '<div class="card-pad">' +
            (favs.length
              ? '<div class="prod-grid">' + favs.map(function (id) {
                  var p = S.product(id);
                  return p ? U.productCard(p) : '';
                }).join('') + '</div>'
              : U.empty('heart', 'Sua lista está vazia',
                  'Salve os produtos que você gostou para não perder de vista.',
                  '<a class="btn btn-primary mt-4" href="#/categoria" data-link>Ver catálogo</a>')) +
          '</div>' +
        '</div>';
      }

      /* ---------- endereços ---------- */
      if (section === 'enderecos') {
        return '<div class="panel">' +
          '<div class="card-head"><h3>Meus endereços</h3>' +
            '<button class="btn btn-primary btn-sm" data-add-addr>' + VT.icons.get('plus', 15) + ' Novo endereço</button></div>' +
          '<div class="card-pad">' +
            (addrs.length
              ? '<div class="grid-2 gap-4">' + addrs.map(function (a) {
                  return '<div class="addr-card' + (a.label === 'Principal' ? ' on' : '') + '">' +
                    '<div class="at">' + esc(a.label) +
                      (a.label === 'Principal' ? '<span class="badge badge-brand">Padrão</span>' : '') + '</div>' +
                    '<div class="al">' +
                      esc(a.logradouro) + ', ' + esc(a.numero) + (a.complemento ? ' — ' + esc(a.complemento) : '') + '<br>' +
                      esc(a.bairro) + ' · ' + esc(a.cidade) + '/' + esc(a.uf) + '<br>CEP ' + esc(a.cep) +
                    '</div>' +
                    '<div class="aa">' +
                      '<button class="btn btn-xs btn-ghost" data-edit-addr="' + esc(a.id) + '">Editar</button>' +
                      '<button class="btn btn-xs btn-ghost" data-del-addr="' + esc(a.id) + '" style="color:var(--danger)">Excluir</button>' +
                    '</div>' +
                  '</div>';
                }).join('') + '</div>'
              : U.empty('mapPin', 'Nenhum endereço cadastrado',
                  'Cadastre um endereço para agilizar suas próximas compras.',
                  '<button class="btn btn-primary mt-4" data-add-addr>Adicionar endereço</button>')) +
          '</div>' +
        '</div>';
      }

      /* ---------- dados ---------- */
      return '<div class="col gap-4">' +
        '<div class="panel">' +
          '<div class="card-head"><h3>Dados pessoais</h3></div>' +
          '<div class="card-pad">' +
            '<form class="grid-form" id="profileForm">' +
              '<div class="field col-6"><label for="pf_name">Nome completo</label>' +
                '<input class="input" type="text" id="pf_name" value="' + esc(user.name || '') + '"></div>' +
              '<div class="field col-6"><label for="pf_email">E-mail</label>' +
                '<input class="input" type="email" id="pf_email" value="' + esc(user.email || '') + '"></div>' +
              '<div class="field col-4"><label for="pf_doc">CPF/CNPJ</label>' +
                '<input class="input" type="text" id="pf_doc" value="' + esc(user.doc || '') + '"></div>' +
              '<div class="field col-4"><label for="pf_phone">Celular</label>' +
                '<input class="input" type="tel" id="pf_phone" value="' + esc(user.phone || '') + '"></div>' +
              '<div class="field col-4"><label for="pf_birth">Nascimento</label>' +
                '<input class="input" type="date" id="pf_birth" value="' + esc(user.birth || '') + '"></div>' +
              '<div class="field col-12">' +
                '<label class="check" style="align-items:center"><input type="checkbox" id="pf_news"' + (user.news !== false ? ' checked' : '') + '>' +
                  '<span class="box">' + VT.icons.get('check', 12, { stroke: 3 }) + '</span>' +
                  '<span class="small">Quero receber ofertas e novidades por e-mail</span></label>' +
              '</div>' +
              '<div class="col-12"><button class="btn btn-primary" type="submit">Salvar alterações</button></div>' +
            '</form>' +
          '</div>' +
        '</div>' +

        '<div class="panel">' +
          '<div class="card-head"><h3>Segurança</h3></div>' +
          '<div class="card-pad">' +
            '<div class="setting-row">' +
              '<div><div class="sr-t">Senha</div><div class="sr-d">Alterada pela última vez há mais de 90 dias</div></div>' +
              '<button class="btn btn-outline btn-sm" data-change-pass>Alterar senha</button>' +
            '</div>' +
            '<div class="setting-row">' +
              '<div><div class="sr-t">Notificações de pedido</div><div class="sr-d">Avisos de pagamento, envio e entrega</div></div>' +
              '<label class="switch"><input type="checkbox" checked><span class="track"></span></label>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="danger-zone">' +
          '<h4>Excluir minha conta</h4>' +
          '<p>Remove seus dados, endereços e histórico desta loja. Pedidos já realizados continuam arquivados por 5 anos, como exige a lei.</p>' +
          '<button class="btn btn-danger btn-sm" data-delete-account>' + VT.icons.get('trash', 15) + ' Excluir conta</button>' +
        '</div>' +
      '</div>';

      /* ---------- helpers ---------- */
      function miniStat(label, value, icon, sub) {
        return '<div class="panel" style="padding:var(--sp-5)">' +
          '<div class="row-b">' +
            '<div><div class="tiny muted">' + esc(label) + '</div>' +
              '<div class="sv" style="font-size:var(--fs-2xl)">' + esc(value) + '</div>' +
              '<div class="tiny dim">' + esc(sub) + '</div></div>' +
            '<span style="color:var(--brand);display:grid">' + VT.icons.get(icon, 22) + '</span>' +
          '</div>' +
        '</div>';
      }
      function orderCard(o) {
        var eta = o.eta ? F.date(o.eta.to) : null;
        return '<div class="order-card">' +
          '<div class="order-head">' +
            '<span class="oc">' + esc(o.code) + '</span>' +
            '<span class="od">' + esc(F.date(o.createdAt, { time: true })) + '</span>' +
            '<div style="margin-left:auto">' + U.statusBadge(o.status) + '</div>' +
          '</div>' +
          '<div class="order-body">' +
            '<div class="order-thumbs">' +
              o.items.slice(0, 3).map(function (it) {
                return '<div class="ot">' + VT.art.product(it.art || 'generic', it.hue || 250) + '</div>';
              }).join('') +
              (o.items.length > 3 ? '<div class="ot" style="display:grid;place-items:center;font-size:var(--fs-xs);font-weight:700;color:var(--ink-3)">+' + (o.items.length - 3) + '</div>' : '') +
            '</div>' +
            '<div class="otxt">' + o.itemCount + ' ' + F.plural(o.itemCount, 'item', 'itens') +
              ' · ' + esc(VT.payments.PAY_LABEL[o.payment] || o.payment) +
              (o.installments > 1 ? ' ' + o.installments + 'x' : '') +
              (o.status === 'delivered' && o.deliveredAt ? '<br>Entregue em ' + F.date(o.deliveredAt) : '') +
              (o.status === 'shipped' && eta ? '<br>Chega até ' + F.date(o.eta.to) : '') +
            '</div>' +
            '<div class="otot"><div class="price price-sm">' + F.brl(o.total) + '</div>' +
              (o.tracking ? '<div class="tiny dim mono">' + esc(o.tracking) + '</div>' : '') + '</div>' +
          '</div>' +
          '<div class="order-foot">' +
            '<button class="btn btn-xs btn-ghost" data-order-detail="' + esc(o.code) + '">' + VT.icons.get('eye', 14) + ' Detalhes</button>' +
            (o.status === 'delivered'
              ? '<button class="btn btn-xs btn-soft" data-review="' + esc(o.code) + '">' + VT.icons.get('star', 14, { filled: true }) + ' Avaliar</button>' : '') +
            (o.tracking
              ? '<button class="btn btn-xs btn-outline" data-track="' + esc(o.tracking) + '">' + VT.icons.get('truck', 14) + ' Rastrear</button>' : '') +
          '</div>' +
        '</div>';
      }
    },

    mount: function (root, params) {
      /* ================= LOGIN ================= */
      var loginForm = root.querySelector('#loginForm');
      if (loginForm) {
        var passToggle = root.querySelector('[data-toggle-pass]');
        if (passToggle) {
          passToggle.addEventListener('click', function () {
            var inp = root.querySelector('#lg_pass');
            inp.type = inp.type === 'password' ? 'text' : 'password';
          });
        }
        loginForm.addEventListener('submit', function (e) {
          e.preventDefault();
          var email = root.querySelector('#lg_email').value.trim();
          var pass = root.querySelector('#lg_pass').value;
          var okEmail = F.validEmail(email), okPass = pass.length >= 6;
          root.querySelector('#lg_email_err').textContent = okEmail ? '' : 'E-mail inválido.';
          root.querySelector('#lg_pass_err').textContent = okPass ? '' : 'A senha precisa ter ao menos 6 caracteres.';
          if (!okEmail || !okPass) return;
          var btn = loginForm.querySelector('button[type="submit"]');
          btn.classList.add('btn-loading');
          setTimeout(function () {
            btn.classList.remove('btn-loading');
            S.login({
              name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }),
              email: email, doc: '', phone: '', createdAt: new Date()
            });
            VT.toast.ok('Bem-vindo!', 'Você entrou na sua conta.');
            VT.router.reload();
          }, 800);
        });
        D.delegate(root, 'click', '[data-demo-login]', function () {
          root.querySelector('#lg_email').value = VT.seed.demoEmail;
          root.querySelector('#lg_pass').value = '123456';
          loginForm.dispatchEvent(new Event('submit', { cancelable: true }));
        });
        D.delegate(root, 'click', '[data-oauth]', function (e, node) {
          VT.toast.info('Login com ' + node.dataset.oauth, 'Integração disponível na versão com backend.');
        });
        D.delegate(root, 'click', '[data-forgot]', function (e) {
          e.preventDefault();
          VT.modal.open({
            title: 'Recuperar senha', size: 'sm',
            body: '<p class="muted small mb-4">Enviaremos um link seguro para você redefinir a senha.</p>' +
              '<input class="input" type="email" placeholder="seu@email.com" id="forgotEmail">',
            footer: '<button class="btn btn-ghost" data-close>Cancelar</button>' +
              '<button class="btn btn-primary" data-send>Enviar link</button>',
            onMount: function (node, close) {
              node.querySelector('[data-send]').addEventListener('click', function () {
                var v = node.querySelector('#forgotEmail').value.trim();
                if (!F.validEmail(v)) { VT.toast.err('E-mail inválido'); return; }
                close();
                VT.toast.ok('Link enviado!', 'Confira sua caixa de entrada (e o spam).');
              });
            }
          });
        });
        D.delegate(root, 'click', '[data-open-register]', function () { openRegister(); });
        return;
      }

      /* ================= ÁREA LOGADA ================= */
      var user = S.get('user');
      var orders = S.myOrders();
      var favs = S.get('wishlist') || [];
      var addrs = S.get('addresses') || [];
      var section = (params && params.section) || 'overview';

      D.delegate(root, 'click', '[data-logout]', function () {
        VT.modal.confirm({
          title: 'Sair da conta?', message: 'Você continuará navegando normalmente, sem acesso aos pedidos.',
          okText: 'Sair', cancelText: 'Ficar'
        }).then(function (ok) {
          if (!ok) return;
          S.logout();
          VT.toast.info('Você saiu da conta');
          VT.router.reload();
        });
      });

      /* detalhes do pedido */
      D.delegate(root, 'click', '[data-order-detail]', function (e, node) {
        var code = node.dataset.orderDetail;
        var o = null;
        orders.forEach(function (x) { if (x.code === code) o = x; });
        if (!o) return;
        VT.modal.open({
          title: 'Pedido ' + o.code, size: 'lg',
          sub: F.date(o.createdAt, { time: true }) + ' · ' + (VT.payments.PAY_LABEL[o.payment] || o.payment),
          body:
            '<div class="row-b mb-4">' + U.statusBadge(o.status) +
              '<span class="price price-lg">' + F.brl(o.total) + '</span></div>' +
            '<h5 class="mb-3">Itens</h5>' +
            o.items.map(function (it) {
              return '<div class="row gap-3 mb-3" style="align-items:center">' +
                '<div style="width:52px;height:52px;border-radius:8px;overflow:hidden;flex:none">' +
                  VT.art.product(it.art || 'generic', it.hue || 250) + '</div>' +
                '<div style="flex:1 1 auto;min-width:0"><div class="small strong trunc">' + esc(it.name) + '</div>' +
                  '<div class="tiny dim">' + it.qty + ' x ' + F.brl(it.price) + (it.variant ? ' · ' + esc(it.variant.value) : '') + '</div></div>' +
                '<span class="small strong">' + F.brl(it.price * it.qty) + '</span>' +
                '</div>';
            }).join('') +
            '<div class="divider my-4"></div>' +
            '<div class="sum-line"><span>Produtos</span><span class="v">' + F.brl(o.subtotal) + '</span></div>' +
            (o.discount ? '<div class="sum-line disc"><span>Desconto</span><span class="v">− ' + F.brl(o.discount) + '</span></div>' : '') +
            '<div class="sum-line"><span>Frete</span><span class="v">' + (o.shipping ? F.brl(o.shipping) : 'grátis') + '</span></div>' +
            '<div class="sum-line big"><span>Total</span><span class="v">' + F.brl(o.total) + '</span></div>' +
            '<div class="divider my-4"></div>' +
            '<h5 class="mb-3">Entrega</h5>' +
            '<div class="small muted">' + esc(o.address.logradouro) + ', ' + esc(o.address.numero) + ' — ' +
              esc(o.address.bairro) + ' · ' + esc(o.address.cidade) + '/' + esc(o.address.uf) + ' · CEP ' + esc(o.address.cep) + '</div>' +
            (o.tracking ? '<div class="mono small mt-3">Rastreio: <b>' + esc(o.tracking) + '</b></div>' : ''),
          footer: (o.status === 'delivered'
            ? '<button class="btn btn-soft" data-again>Comprar novamente</button>' : '') +
            '<button class="btn btn-primary" data-close>Fechar</button>',
          onMount: function (node2, close) {
            var again = node2.querySelector('[data-again]');
            if (again) again.addEventListener('click', function () {
              o.items.forEach(function (it) {
                var p = VT.catalog.byId[it.id];
                if (p) VT.cart.add(p, it.qty, it.variant || null);
              });
              close();
              VT.toast.ok('Itens adicionados ao carrinho');
            });
          }
        });
      });

      /* rastreio */
      D.delegate(root, 'click', '[data-track]', function (e, node) {
        VT.modal.open({
          title: 'Rastrear pedido', size: 'sm',
          body: '<div class="mono small mb-4">' + esc(node.dataset.track) + '</div>' +
            '<div class="timeline">' +
              '<div class="tl-item done"><div class="tl-t">Pedido aprovado</div><div class="tl-d">pagamento confirmado</div></div>' +
              '<div class="tl-item done"><div class="tl-t">Em separação</div><div class="tl-d">centro de distribuição</div></div>' +
              '<div class="tl-item now"><div class="tl-t">Em transporte</div><div class="tl-d">a caminho do seu endereço</div></div>' +
              '<div class="tl-item"><div class="tl-t">Entregue</div><div class="tl-d">aguardando</div></div>' +
            '</div>',
          footer: '<button class="btn btn-primary" data-close>Fechar</button>'
        });
      });

      /* avaliar */
      D.delegate(root, 'click', '[data-review]', function (e, node) {
        VT.modal.open({
          title: 'Avalie sua compra',
          body: '<div class="center mb-4"><div class="tiny muted mb-2">Como você avalia este pedido?</div>' +
            '<div class="row gap-2" style="justify-content:center" id="starPick">' +
              [1, 2, 3, 4, 5].map(function (n) {
                return '<button class="iconbtn" data-star="' + n + '" style="width:38px;height:38px">' +
                  VT.icons.get('star', 30, { filled: true, style: 'color:var(--line-2)' }) + '</button>';
              }).join('') +
            '</div></div>' +
            '<textarea class="textarea" id="revText" placeholder="Conte como foi sua experiência (opcional)"></textarea>',
          footer: '<button class="btn btn-ghost" data-close>Depois</button>' +
            '<button class="btn btn-primary" data-send>Enviar avaliação</button>',
          onMount: function (node2, close) {
            var picked = 0;
            var btns = D.qsa('[data-star]', node2);
            function paint(n) {
              btns.forEach(function (b, i) {
                b.innerHTML = VT.icons.get('star', 30, {
                  filled: true,
                  style: i < n ? 'color:#fbbf24' : 'color:var(--line-2)'
                });
              });
            }
            btns.forEach(function (b) {
              b.addEventListener('click', function () { picked = Number(b.dataset.star); paint(picked); });
              b.addEventListener('mouseenter', function () { paint(Number(b.dataset.star)); });
            });
            node2.querySelector('#starPick').addEventListener('mouseleave', function () { paint(picked); });
            node2.querySelector('[data-send]').addEventListener('click', function () {
              if (!picked) { VT.toast.warn('Escolha uma nota'); return; }
              close();
              VT.toast.ok('Obrigado pela avaliação!', 'Sua opinião ajuda outros compradores.');
            });
          }
        });
      });

      /* endereços */
      D.delegate(root, 'click', '[data-add-addr], [data-edit-addr]', function (e, node) {
        var id = node.dataset.editAddr;
        var a = id ? addrs.filter(function (x) { return x.id === id; })[0] : null;
        openAddress(a, function (data) {
          var list = S.get('addresses') || [];
          if (a) {
            list = list.map(function (x) { return x.id === a.id ? Object.assign({}, x, data) : x; });
          } else {
            list.unshift(Object.assign({ id: 'addr-' + Date.now(), label: list.length ? 'Endereço ' + (list.length + 1) : 'Principal' }, data));
          }
          S.set('addresses', list);
          VT.toast.ok(a ? 'Endereço atualizado' : 'Endereço cadastrado');
          VT.router.reload();
        });
      });
      D.delegate(root, 'click', '[data-del-addr]', function (e, node) {
        var id = node.dataset.delAddr;
        VT.modal.confirm({ title: 'Excluir endereço?', danger: true, okText: 'Excluir' }).then(function (ok) {
          if (!ok) return;
          S.set('addresses', (S.get('addresses') || []).filter(function (x) { return x.id !== id; }));
          VT.toast.info('Endereço removido');
          VT.router.reload();
        });
      });

      /* perfil */
      var pf = root.querySelector('#profileForm');
      if (pf) {
        var docI = root.querySelector('#pf_doc'), phI = root.querySelector('#pf_phone');
        docI.addEventListener('input', function () { docI.value = F.maskCPFCNPJ(docI.value); });
        phI.addEventListener('input', function () { phI.value = F.maskPhone(phI.value); });
        pf.addEventListener('submit', function (e) {
          e.preventDefault();
          var u = Object.assign({}, S.get('user'), {
            name: root.querySelector('#pf_name').value.trim(),
            email: root.querySelector('#pf_email').value.trim(),
            doc: docI.value, phone: phI.value,
            birth: root.querySelector('#pf_birth').value,
            news: root.querySelector('#pf_news').checked
          });
          S.login(u);
          VT.toast.ok('Dados atualizados!');
          VT.router.reload();
        });
      }
      D.delegate(root, 'click', '[data-change-pass]', function () {
        VT.modal.open({
          title: 'Alterar senha', size: 'sm',
          body: '<div class="col gap-4">' +
            '<input class="input" type="password" id="pw1" placeholder="Nova senha">' +
            '<input class="input" type="password" id="pw2" placeholder="Confirmar senha"></div>',
          footer: '<button class="btn btn-ghost" data-close>Cancelar</button>' +
            '<button class="btn btn-primary" data-save>Salvar</button>',
          onMount: function (node, close) {
            node.querySelector('[data-save]').addEventListener('click', function () {
              var a = node.querySelector('#pw1').value, b = node.querySelector('#pw2').value;
              if (a.length < 6) { VT.toast.err('Senha muito curta'); return; }
              if (a !== b) { VT.toast.err('As senhas não coincidem'); return; }
              close(); VT.toast.ok('Senha alterada com sucesso');
            });
          }
        });
      });
      D.delegate(root, 'click', '[data-delete-account]', function () {
        VT.modal.confirm({
          title: 'Excluir sua conta?',
          message: 'Esta ação é permanente. Seus endereços e favoritos serão apagados desta loja.',
          okText: 'Excluir minha conta', danger: true
        }).then(function (ok) {
          if (!ok) return;
          S.logout();
          S.set('addresses', []);
          S.set('wishlist', []);
          VT.toast.info('Conta excluída');
          location.hash = '#/';
        });
      });
    }
  };

  /* ------------------------- modais auxiliares ------------------------- */
  function openRegister() {
    VT.modal.open({
      title: 'Criar minha conta',
      sub: 'Rápido e sem burocracia',
      body:
        '<div class="grid-form">' +
          '<div class="field col-12"><label>Nome completo <span class="req">*</span></label>' +
            '<input class="input" id="rg_name" placeholder="Como está no documento"></div>' +
          '<div class="field col-6"><label>E-mail <span class="req">*</span></label>' +
            '<input class="input" type="email" id="rg_email" placeholder="voce@email.com"></div>' +
          '<div class="field col-6"><label>CPF</label><input class="input" id="rg_doc" placeholder="000.000.000-00"></div>' +
          '<div class="field col-6"><label>Senha <span class="req">*</span></label>' +
            '<input class="input" type="password" id="rg_pass" placeholder="mínimo 6 caracteres"></div>' +
          '<div class="field col-6"><label>Confirmar senha <span class="req">*</span></label>' +
            '<input class="input" type="password" id="rg_pass2"></div>' +
        '</div>',
      footer: '<button class="btn btn-ghost" data-close>Cancelar</button>' +
        '<button class="btn btn-primary" data-create>Criar conta</button>',
      onMount: function (node, close) {
        var docI = node.querySelector('#rg_doc');
        docI.addEventListener('input', function () { docI.value = F.maskCPFCNPJ(docI.value); });
        node.querySelector('[data-create]').addEventListener('click', function () {
          var name = node.querySelector('#rg_name').value.trim();
          var email = node.querySelector('#rg_email').value.trim();
          var pass = node.querySelector('#rg_pass').value;
          var pass2 = node.querySelector('#rg_pass2').value;
          if (name.length < 5) { VT.toast.err('Informe seu nome completo'); return; }
          if (!F.validEmail(email)) { VT.toast.err('E-mail inválido'); return; }
          if (pass.length < 6) { VT.toast.err('A senha precisa ter 6+ caracteres'); return; }
          if (pass !== pass2) { VT.toast.err('As senhas não coincidem'); return; }
          S.login({ name: name, email: email, doc: docI.value, phone: '', createdAt: new Date() });
          close();
          VT.toast.ok('Conta criada!', 'Bem-vindo à Vitrine.');
          VT.router.reload();
        });
      }
    });
  }

  function openAddress(addr, onSave) {
    var a = addr || {};
    VT.modal.open({
      title: addr ? 'Editar endereço' : 'Novo endereço',
      body:
        '<div class="grid-form">' +
          '<div class="field col-4"><label>CEP <span class="req">*</span></label>' +
            '<div class="row gap-2"><input class="input" id="ad_cep" value="' + esc(a.cep || '') + '" maxlength="9">' +
            '<button class="btn btn-outline" type="button" data-buscar>Buscar</button></div></div>' +
          '<div class="field col-8"><label>Endereço <span class="req">*</span></label>' +
            '<input class="input" id="ad_log" value="' + esc(a.logradouro || '') + '"></div>' +
          '<div class="field col-4"><label>Número <span class="req">*</span></label>' +
            '<input class="input" id="ad_num" value="' + esc(a.numero || '') + '"></div>' +
          '<div class="field col-8"><label>Complemento</label>' +
            '<input class="input" id="ad_comp" value="' + esc(a.complemento || '') + '"></div>' +
          '<div class="field col-6"><label>Bairro <span class="req">*</span></label>' +
            '<input class="input" id="ad_bai" value="' + esc(a.bairro || '') + '"></div>' +
          '<div class="field col-4"><label>Cidade <span class="req">*</span></label>' +
            '<input class="input" id="ad_cid" value="' + esc(a.cidade || '') + '"></div>' +
          '<div class="field col-2"><label>UF <span class="req">*</span></label>' +
            '<input class="input" id="ad_uf" value="' + esc(a.uf || '') + '" maxlength="2" style="text-transform:uppercase"></div>' +
        '</div>',
      footer: '<button class="btn btn-ghost" data-close>Cancelar</button>' +
        '<button class="btn btn-primary" data-save>Salvar endereço</button>',
      onMount: function (node, close) {
        var cepI = node.querySelector('#ad_cep');
        cepI.addEventListener('input', function () { cepI.value = F.maskCEP(cepI.value); });
        node.querySelector('[data-buscar]').addEventListener('click', function () {
          if (!F.validCEP(cepI.value)) { VT.toast.err('CEP inválido'); return; }
          VT.cep.lookup(cepI.value).then(function (r) {
            node.querySelector('#ad_log').value = r.logradouro;
            node.querySelector('#ad_bai').value = r.bairro;
            node.querySelector('#ad_cid').value = r.cidade;
            node.querySelector('#ad_uf').value = r.uf;
            if (!node.querySelector('#ad_num').value) node.querySelector('#ad_num').value = r.numero;
          });
        });
        node.querySelector('[data-save]').addEventListener('click', function () {
          var d = {
            cep: cepI.value, logradouro: node.querySelector('#ad_log').value.trim(),
            numero: node.querySelector('#ad_num').value.trim(),
            complemento: node.querySelector('#ad_comp').value.trim(),
            bairro: node.querySelector('#ad_bai').value.trim(),
            cidade: node.querySelector('#ad_cid').value.trim(),
            uf: node.querySelector('#ad_uf').value.trim().toUpperCase()
          };
          if (!F.validCEP(d.cep)) { VT.toast.err('CEP inválido'); return; }
          if (d.logradouro.length < 3) { VT.toast.err('Informe o endereço'); return; }
          if (!d.numero) { VT.toast.err('Informe o número'); return; }
          if (d.uf.length !== 2) { VT.toast.err('UF inválida'); return; }
          close();
          onSave(d);
        });
      }
    });
  }
})(window);
