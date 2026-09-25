/* ============================================================
   VITRINE PRO — pages/institutional.js
   Páginas institucionais: sobre, contato, FAQ, termos,
   privacidade, frete e devoluções.
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};
  var F = VT.format, D = VT.dom, S = VT.store, U = VT.ui;
  var esc = D.esc;

  VT.pages = VT.pages || {};

  var PAGES = {
    sobre: {
      title: 'Sobre nós',
      eyebrow: 'Nossa história',
      lead: 'A Vitrine nasceu de uma constatação simples: montar uma loja online de verdade ainda é difícil, caro e demorado demais.',
      body: [
        ['h2', 'O que fazemos'],
        ['p', 'Construímos uma plataforma de e-commerce completa que roda em qualquer lugar — computador, tablet ou celular — e que você consegue colocar no ar em minutos, sem precisar contratar desenvolvedor.'],
        ['p', 'Cuidamos de todo o caminho: catálogo, busca, carrinho, checkout com os meios de pagamento que o brasileiro usa, painel administrativo com relatórios e uma camada de configuração que permite deixar a loja com a sua cara.'],
        ['h2', 'Como trabalhamos'],
        ['p', 'Acreditamos em software honesto: sem taxas escondidas, sem fidelidade, sem surpresa na fatura. Você paga um valor fixo por mês e sabe exatamente o que está contratando.'],
        ['p', 'Nosso time é distribuído pelo Brasil e atende em português, em horário comercial, com gente de verdade do outro lado da tela.'],
        ['h2', 'Números'],
        ['ul', ['Mais de 2.400 lojas ativas', 'R$ 780 milhões processados em 2025', '99,94% de disponibilidade média', 'Nota 4,8/5 no Reclame Aqui']]
      ]
    },
    contato: {
      title: 'Fale com a gente',
      eyebrow: 'Contato',
      lead: 'Dúvida, sugestão ou problema com um pedido? Escolha o canal e respondemos rápido.',
      form: true
    },
    faq: {
      title: 'Perguntas frequentes',
      eyebrow: 'FAQ',
      lead: 'As dúvidas que mais recebemos — respondidas sem juridiquês.',
      faq: true
    },
    envio: {
      title: 'Frete e devoluções',
      eyebrow: 'Logística',
      lead: 'Prazos, valores e como funciona a devolução do seu pedido.',
      body: [
        ['h2', 'Prazos e modalidades'],
        ['p', 'Trabalhamos com transportadoras parceiras e com os Correios. O prazo começa a contar a partir da aprovação do pagamento, não da data da compra.'],
        ['ul', [
          'Econômico: 6 a 12 dias úteis — frete grátis acima de ' + F.brl(299),
          'Padrão: 4 a 8 dias úteis, com código de rastreio',
          'Expresso: 1 a 3 dias úteis para capitais e regiões metropolitanas'
        ]],
        ['h2', 'Devolução por arrependimento'],
        ['p', 'Você tem 7 dias corridos, contados do recebimento, para desistir da compra — é seu direito garantido pelo Código de Defesa do Consumidor.'],
        ['p', 'Abra um chamado na área do cliente, embale o produto na caixa original com todos os acessórios e manuais, e nós pagamos o frete da devolução.'],
        ['h2', 'Produto com defeito'],
        ['p', 'Se o item apresentar defeito de fabricação, a troca é imediata. Após 30 dias, acionamos a garantia do fabricante e acompanhamos todo o processo junto com você.'],
        ['h2', 'Reembolso'],
        ['p', 'Pagamentos por Pix e cartão são estornados em até 5 dias úteis após a chegada do produto ao nosso centro de distribuição. Boletos pagos são reembolsados via transferência bancária, em até 10 dias úteis.']
      ]
    },
    termos: {
      title: 'Termos de uso',
      eyebrow: 'Jurídico',
      lead: 'As regras de convivência entre você, a loja e a plataforma.',
      body: [
        ['h2', '1. Aceitação'],
        ['p', 'Ao acessar ou comprar nesta loja, você declara que leu e concorda com estes termos. Se não concordar, pedimos que não utilize o site.'],
        ['h2', '2. Cadastro'],
        ['p', 'Você é responsável pela veracidade dos dados informados e por manter sua senha em sigilo. A loja não solicita senha por telefone, e-mail ou WhatsApp, em nenhuma hipótese.'],
        ['h2', '3. Preços e ofertas'],
        ['p', 'Os preços são válidos apenas para compras realizadas neste site e podem mudar sem aviso prévio. Ofertas são limitadas ao estoque disponível.'],
        ['h2', '4. Pagamento'],
        ['p', 'Trabalhamos com Pix, cartão de crédito e boleto bancário. Pedidos com pagamento não identificado em até 3 dias úteis são cancelados automaticamente.'],
        ['h2', '5. Entrega'],
        ['p', 'O prazo informado no checkout é uma estimativa. Atrasos causados por eventos climáticos, greves ou extravio por parte da transportadora não geram indenização, mas acompanhamos o caso até a resolução.'],
        ['h2', '6. Demonstração'],
        ['p', 'Esta instalação é um ambiente de demonstração. Nenhum pagamento é processado, nenhum dado é transmitido a terceiros e todo o catálogo é fictício.']
      ]
    },
    privacidade: {
      title: 'Política de privacidade',
      eyebrow: 'Seus dados',
      lead: 'O que coletamos, por que coletamos e o que fazemos com isso — de forma direta.',
      body: [
        ['h2', 'Dados que coletamos'],
        ['p', 'Nome, e-mail, CPF/CNPJ, telefone e endereço — sempre para viabilizar a compra, emitir nota fiscal e entregar o produto.'],
        ['h2', 'Para que usamos'],
        ['ul', [
          'Processar pedidos e emitir nota fiscal',
          'Enviar avisos de pagamento, envio e entrega',
          'Prevenir fraudes e proteger sua conta',
          'Enviar ofertas, apenas se você autorizou'
        ]],
        ['h2', 'Com quem compartilhamos'],
        ['p', 'Apenas com quem é indispensável: transportadoras (para entregar), meios de pagamento (para processar) e a Receita Federal (para a nota fiscal). Jamais vendemos seus dados.'],
        ['h2', 'Seus direitos (LGPD)'],
        ['p', 'Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados a qualquer momento pelo canal de atendimento.'],
        ['h2', 'Cookies'],
        ['p', 'Usamos cookies essenciais para manter o carrinho e a sessão. Nesta demonstração, tudo fica armazenado apenas no seu navegador (localStorage).']
      ]
    }
  };

  var FAQS = [
    ['Meu pedido não chegou. E agora?', 'Abra um chamado na área do cliente com o número do pedido. Investigamos com a transportadora em até 2 dias úteis e, se houver extravio, reenviamos ou reembolsamos.'],
    ['Posso trocar o produto por outro?', 'Sim. Dentro de 7 dias do recebimento você pode trocar por outro item do catálogo ou pedir o reembolso integral.'],
    ['O produto vem com nota fiscal?', 'Sempre. A nota é emitida automaticamente com os dados do cadastro e enviada por e-mail em até 24 horas.'],
    ['Vocês parcelam em quantas vezes?', 'Até 12x, com as primeiras parcelas sem juros, dependendo do valor. A tabela completa aparece no checkout antes de você confirmar.'],
    ['Consigo retirar em mãos?', 'Nesta demonstração, não — trabalhamos apenas com entrega. Em uma loja real, a retirada pode ser habilitada nas configurações.'],
    ['Meus dados estão seguros?', 'Sim. A conexão é criptografada e não armazenamos dados de cartão: eles vão direto para o gateway de pagamento.']
  ];

  VT.pages.institutional = {
    title: 'Institucional — Vitrine',

    render: function (params) {
      var key = (params && params.page) || 'sobre';
      var p = PAGES[key] || PAGES.sobre;
      var cfg = S.settings();

      var bodyHTML = '';
      if (p.body) {
        bodyHTML = '<div class="prose">' +
          p.body.map(function (b) {
            if (b[0] === 'h2') return '<h2>' + esc(b[1]) + '</h2>';
            if (b[0] === 'h3') return '<h3>' + esc(b[1]) + '</h3>';
            if (b[0] === 'ul') return '<ul>' + b[1].map(function (li) { return '<li>' + esc(li) + '</li>'; }).join('') + '</ul>';
            return '<p>' + esc(b[1]) + '</p>';
          }).join('') +
          '</div>';
      }
      if (p.faq) {
        bodyHTML = '<div class="faq-grid">' +
          FAQS.map(function (f, i) {
            return '<div class="acc' + (i === 0 ? ' open' : '') + '">' +
              '<button class="acc-btn">' + esc(f[0]) + '<span class="plus">' + VT.icons.get('plus', 18) + '</span></button>' +
              '<div class="acc-body"><div><p>' + esc(f[1]) + '</p></div></div>' +
              '</div>';
          }).join('') + '</div>';
      }
      if (p.form) {
        bodyHTML =
          '<div class="contact-grid mb-8">' +
            [['chat', 'WhatsApp', cfg.whatsapp, 'seg a sex, 9h às 18h'],
             ['mail', 'E-mail', cfg.supportEmail, 'respondemos em até 24h'],
             ['mapPin', 'Escritório', 'Uberlândia · MG', 'atendimento remoto']].map(function (c) {
              return '<div class="contact-card">' +
                '<div class="ci">' + VT.icons.get(c[0], 23) + '</div>' +
                '<div class="ct">' + esc(c[2]) + '</div>' +
                '<div class="cd">' + esc(c[1]) + ' · ' + esc(c[3]) + '</div>' +
                '</div>';
            }).join('') +
          '</div>' +
          '<div class="panel" style="max-width:640px"><div class="card-pad">' +
            '<h3 class="mb-4">Envie uma mensagem</h3>' +
            '<form class="grid-form" id="contactForm">' +
              '<div class="field col-6"><label>Nome <span class="req">*</span></label>' +
                '<input class="input" name="name" required placeholder="Seu nome"></div>' +
              '<div class="field col-6"><label>E-mail <span class="req">*</span></label>' +
                '<input class="input" type="email" name="email" required placeholder="voce@email.com"></div>' +
              '<div class="field col-6"><label>Pedido (opcional)</label>' +
                '<input class="input" name="order" placeholder="VT-26-00000"></div>' +
              '<div class="field col-6"><label>Assunto</label>' +
                '<select class="select" name="subject">' +
                  ['Dúvida sobre produto', 'Problema com pedido', 'Troca ou devolução', 'Parceria', 'Outro'].map(function (s) {
                    return '<option>' + s + '</option>';
                  }).join('') +
                '</select></div>' +
              '<div class="field col-12"><label>Mensagem <span class="req">*</span></label>' +
                '<textarea class="textarea" name="msg" required placeholder="Conte o que aconteceu…"></textarea></div>' +
              '<div class="col-12"><button class="btn btn-primary btn-lg" type="submit">Enviar mensagem</button></div>' +
            '</form>' +
          '</div></div>';
      }

      return '<div class="shell-wide"><div class="shell" style="padding-inline:0">' +
        '<div class="page-top">' +
          '<div class="eyebrow mb-2">' + esc(p.eyebrow) + '</div>' +
          '<h1>' + esc(p.title) + '</h1>' +
          '<p class="sub">' + esc(p.lead) + '</p>' +
        '</div>' +
        bodyHTML +
        '<div class="divider my-8"></div>' +
        '<div class="row gap-4 wrap">' +
          Object.keys(PAGES).map(function (k) {
            return '<a class="chip' + (k === key ? ' on' : '') + '" href="#/institucional/' + k + '" data-link>' + esc(PAGES[k].title) + '</a>';
          }).join('') +
        '</div>' +
      '</div></div>';
    },

    mount: function (root) {
      D.delegate(root, 'click', '.acc-btn', function (e, node) {
        node.parentNode.classList.toggle('open');
      });
      var form = root.querySelector('#contactForm');
      if (form) {
        var phone = form.querySelector('input[name="phone"]');
        if (phone) phone.addEventListener('input', function () { phone.value = F.maskPhone(phone.value); });
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var fv = function (n) { var e = form.querySelector('[name="' + n + '"]'); return e ? e.value.trim() : ''; };
          var name = fv('name');
          var email = fv('email');
          var msg = fv('msg');
          if (name.length < 3) { VT.toast.err('Informe seu nome'); return; }
          if (!F.validEmail(email)) { VT.toast.err('E-mail inválido'); return; }
          if (msg.length < 10) { VT.toast.err('Escreva uma mensagem um pouco maior'); return; }
          var btn = form.querySelector('button[type="submit"]');
          btn.classList.add('btn-loading');
          setTimeout(function () {
            btn.classList.remove('btn-loading');
            form.reset();
            VT.toast.ok('Mensagem enviada!', 'Respondemos em até 24 horas úteis.');
          }, 1000);
        });
      }
    }
  };
})(window);
