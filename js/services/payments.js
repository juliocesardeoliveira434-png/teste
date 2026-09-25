/* ============================================================
   VITRINE PRO — payments.js
   Meios de pagamento brasileiros: Pix (BR Code EMV® com CRC16
   de verdade), boleto (linha digitável com DV módulo 10/11) e
   cartão de crédito (validação + parcelamento).
   A "autorização" é simulada: troque `process()` pela chamada
   ao seu gateway (Stripe, Pagar.me, Mercado Pago, Cielo...).
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};
  var F = VT.format;

  var METHODS = [
    { id: 'pix', name: 'Pix', icon: 'pix', desc: 'Aprovação imediata', off: 0 },
    { id: 'card', name: 'Cartão de crédito', icon: 'card', desc: 'Parcele em até 12x', off: 0 },
    { id: 'boleto', name: 'Boleto bancário', icon: 'barcode', desc: 'Vence em 3 dias úteis', off: 0 }
  ];

  /* ===================== Pix ===================== */
  function tlv(id, value) {
    var len = String(value.length).padStart(2, '0');
    return String(id) + len + value;
  }
  function crc16(str) {
    var crc = 0xFFFF, i, j;
    for (i = 0; i < str.length; i++) {
      crc ^= (str.charCodeAt(i) & 0xFF) << 8;
      for (j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? (((crc << 1) ^ 0x1021) & 0xFFFF) : ((crc << 1) & 0xFFFF);
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
  function normalize(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9 ]/g, '').trim().toUpperCase().slice(0, 25);
  }

  /**
   * Gera o BR Code (Pix copia e cola) com CRC16 válido.
   * @param {object} o { key, name, city, amount, txid }
   */
  function pixCode(o) {
    var amount = (Math.round((o.amount || 0) * 100) / 100).toFixed(2);
    var txid = (o.txid || 'VITRINE').replace(/[^A-Za-z0-9]/g, '').slice(0, 25).toUpperCase() || 'VITRINE';
    var payload =
      tlv('00', '01') +
      tlv('26', tlv('00', 'br.gov.bcb.pix') + tlv('01', o.key || 'loja@vitrine.com')) +
      tlv('52', '0000') +
      tlv('53', '986') +
      (Number(amount) > 0 ? tlv('54', amount) : '') +
      tlv('58', 'BR') +
      tlv('59', normalize(o.name || 'Vitrine')) +
      tlv('60', normalize(o.city || 'Uberlandia')) +
      tlv('62', tlv('05', txid)) +
      '6304';
    return payload + crc16(payload);
  }

  /** Dados completos para exibir o QR do Pix. */
  function pixCharge(order) {
    var cfg = VT.store.settings();
    var txid = order.code.replace(/\W/g, '').slice(0, 24).toUpperCase();
    var code = pixCode({
      key: cfg.pixKey,
      name: cfg.storeName,
      city: (order.address && order.address.cidade) || 'Uberlandia',
      amount: order.total,
      txid: txid
    });
    return {
      code: code,
      qr: VT.art.qr(txid + code.length, 25),
      txid: txid,
      expiresAt: new Date(Date.now() + 30 * 60000),
      key: cfg.pixKey
    };
  }

  /* ===================== Boleto ===================== */
  function mod10(str) {
    var sum = 0, weight = 2, i;
    for (i = str.length - 1; i >= 0; i--) {
      var n = parseInt(str[i], 10) * weight;
      sum += n > 9 ? (n - 9) : n;
      weight = weight === 2 ? 1 : 2;
    }
    var r = sum % 10;
    return r === 0 ? 0 : 10 - r;
  }
  function mod11(str) {
    var sum = 0, weight = 2, i;
    for (i = str.length - 1; i >= 0; i--) {
      sum += parseInt(str[i], 10) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    var r = sum % 11;
    var dv = 11 - r;
    return dv === 0 || dv === 10 || dv === 11 ? 1 : dv;
  }

  /** Fator de vencimento: dias desde 07/10/1997. */
  function dueFactor(date) {
    var base = new Date(1997, 9, 7);
    var d = new Date(date);
    return Math.floor((d.setHours(0, 0, 0, 0) - base.getTime()) / 86400000);
  }

  /**
   * Gera um boleto fictício coerente (44 dígitos + linha digitável).
   * @param {object} o { amount, dueDate, bank, agency, wallet, ourNumber, account }
   */
  function boleto(o) {
    var bank = (o.bank || '341').padStart(3, '0');
    var currency = '9';
    var factor = String(dueFactor(o.dueDate)).padStart(4, '0');
    var value = String(Math.round((o.amount || 0) * 100)).padStart(10, '0');
    var free = ((o.agency || '1234').padStart(4, '0') +
      (o.wallet || '57').padStart(2, '0') +
      (o.ourNumber || F.randomDigits(11)).padStart(11, '0') +
      (o.account || '0123456').padStart(7, '0') +
      '0').slice(0, 25);

    var partial = bank + currency + factor + value + free;
    var dvGeral = mod11(bank + currency + partial.slice(5, 9) + partial.slice(9, 19) + partial.slice(19, 44));
    var barcode = bank + currency + dvGeral + factor + value + free;

    var f1 = barcode.slice(0, 4) + barcode.slice(19, 24);
    var f2 = barcode.slice(24, 34);
    var f3 = barcode.slice(34, 44);

    var line =
      f1.slice(0, 5) + '.' + f1.slice(5) + mod10(f1) + ' ' +
      f2.slice(0, 5) + '.' + f2.slice(5) + mod10(f2) + ' ' +
      f3.slice(0, 5) + '.' + f3.slice(5) + mod10(f3) + ' ' +
      dvGeral + ' ' + factor + value;

    return {
      barcode: barcode,
      line: line,
      dueDate: o.dueDate,
      bank: bank,
      amount: o.amount
    };
  }

  /** Dados do boleto para um pedido. */
  function boletoCharge(order) {
    return boleto({
      amount: order.total,
      dueDate: F.addDays(Date.now(), 3),
      ourNumber: F.onlyDigits(order.code).slice(0, 11).padEnd(11, '0')
    });
  }

  /* ===================== Cartão ===================== */
  /**
   * Valida os dados do cartão.
   * @returns {object} { ok, errors: {}, brand }
   */
  function validateCard(data) {
    var errors = {};
    var num = F.onlyDigits(data.number || '');
    var brand = F.cardBrand(num);

    if (!num) errors.number = 'Informe o número do cartão.';
    else if (num.length < 13) errors.number = 'Número incompleto.';
    else if (!F.luhn(num)) errors.number = 'Número de cartão inválido.';

    var name = String(data.name || '').trim();
    if (name.length < 5 || name.indexOf(' ') === -1) errors.name = 'Informe o nome como está no cartão.';

    var exp = F.onlyDigits(data.expiry || '');
    if (exp.length !== 4) errors.expiry = 'Use MM/AA.';
    else {
      var mm = parseInt(exp.slice(0, 2), 10), aa = parseInt(exp.slice(2), 10);
      var now = new Date(), curY = now.getFullYear() % 100, curM = now.getMonth() + 1;
      if (mm < 1 || mm > 12) errors.expiry = 'Mês inválido.';
      else if (aa < curY || (aa === curY && mm < curM)) errors.expiry = 'Cartão vencido.';
    }

    var cvv = F.onlyDigits(data.cvv || '');
    var need = brand ? brand.cvv : 3;
    if (cvv.length !== need) errors.cvv = 'CVV deve ter ' + need + ' dígitos.';

    if (!F.onlyDigits(data.doc || '') || !(F.validCPF(data.doc) || F.validCNPJ(data.doc))) {
      errors.doc = 'CPF/CNPJ do titular inválido.';
    }
    if (!data.installments || data.installments < 1) errors.installments = 'Escolha o parcelamento.';

    return { ok: Object.keys(errors).length === 0, errors: errors, brand: brand };
  }

  /** Máscara do número para exibição no resumo. */
  function maskCard(num) {
    var d = F.onlyDigits(num);
    if (d.length < 4) return '•••• •••• •••• ••••';
    return '•••• •••• •••• ' + d.slice(-4);
  }

  /* ===================== Autorização (simulada) ===================== */
  /**
   * Processa o pagamento. Em produção, substitua por:
   *   POST /api/checkout  →  { orderId, status, gatewayTxId }
   * @returns {Promise<{ok:boolean, txid?:string, message?:string, data?:object}>}
   */
  function process(order, data) {
    return new Promise(function (resolve) {
      var delay = 900 + Math.random() * 900;
      setTimeout(function () {
        /* cartões de teste que recusam (documentado na tela) */
        if (order.payment === 'card') {
          var digits = F.onlyDigits(data.cardNumber || '');
          if (/0000$/.test(digits)) {
            resolve({ ok: false, message: 'Pagamento recusado pela operadora. Tente outro cartão.' });
            return;
          }
          if (/9999$/.test(digits)) {
            resolve({ ok: false, message: 'Saldo insuficiente no limite do cartão.' });
            return;
          }
        }
        resolve({
          ok: true,
          txid: 'TX' + F.randomDigits(4) + F.randomDigits(8).toUpperCase(),
          nsu: F.randomDigits(6),
          authCode: F.randomDigits(6),
          paidAt: new Date(),
          method: order.payment
        });
      }, delay);
    });
  }

  /* ===================== Fábrica de pedidos ===================== */
  /**
   * Cria o objeto de pedido imutável a partir do checkout.
   * @param {object} d { totals, customer, address, shipping, payment, card }
   */
  function createOrder(d) {
    var t = d.totals;
    var items = t.items.map(function (i) {
      return {
        id: i.product.id, name: i.product.name, slug: i.product.slug, brand: i.product.brand,
        art: i.product.art, hue: i.product.hue, price: i.unit, qty: i.qty, variant: i.variant
      };
    });
    var now = new Date();
    var order = {
      code: F.orderCode('VT'),
      createdAt: now,
      status: d.payment === 'boleto' ? 'pending' : 'paid',
      items: items,
      itemCount: t.itemCount,
      subtotal: t.subtotal,
      discount: t.discount,
      coupon: t.coupon ? t.coupon.code : null,
      shipping: t.shipping,
      shippingName: d.shipping ? d.shipping.name : '',
      shippingDays: d.shipping ? d.shipping.days : 4,
      tax: t.tax,
      total: d.payment === 'pix' ? t.pixTotal : t.total,
      payment: d.payment,
      installments: d.payment === 'card' ? (d.card ? d.card.installments : 1) : 1,
      installmentValue: d.payment === 'card' && d.card ? d.card.installmentValue : null,
      cardLast: d.payment === 'card' && d.card ? String(F.onlyDigits(d.card.number)).slice(-4) : null,
      cardBrand: d.payment === 'card' && d.card
        ? (F.cardBrand(d.card.number) ? F.cardBrand(d.card.number).name : 'Cartão') : null,
      customer: d.customer,
      address: d.address,
      tracking: null,
      deliveredAt: null,
      eta: VT.shipping.etaRange(d.shipping ? d.shipping.days : 4),
      timeline: []
    };

    order.timeline.push({ t: 'Pedido criado', d: now, done: true, icon: 'receipt' });
    if (order.status === 'paid') order.timeline.push({ t: 'Pagamento aprovado', d: now, done: true, icon: 'checkCircle' });
    else order.timeline.push({ t: 'Aguardando pagamento', d: now, done: false, icon: 'clock' });
    order.timeline.push({ t: 'Em separação', d: null, done: false, icon: 'package' });
    order.timeline.push({ t: 'Enviado', d: null, done: false, icon: 'truck' });
    order.timeline.push({ t: 'Entregue', d: null, done: false, icon: 'home' });

    if (d.payment === 'pix') order.pix = pixCharge(order);
    if (d.payment === 'boleto') order.boleto = boletoCharge(order);
    return order;
  }

  var STATUS_LABEL = {
    pending: 'Aguardando pagamento',
    paid: 'Pagamento aprovado',
    shipped: 'Em transporte',
    delivered: 'Entregue',
    cancelled: 'Cancelado'
  };
  var PAY_LABEL = { pix: 'Pix', card: 'Cartão de crédito', boleto: 'Boleto' };

  VT.payments = {
    METHODS: METHODS,
    pixCode: pixCode, pixCharge: pixCharge,
    boleto: boleto, boletoCharge: boletoCharge,
    validateCard: validateCard, maskCard: maskCard,
    process: process, createOrder: createOrder,
    STATUS_LABEL: STATUS_LABEL, PAY_LABEL: PAY_LABEL,
    crc16: crc16
  };
})(window);
