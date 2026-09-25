/* ============================================================
   VITRINE PRO — shipping.js
   Regras de frete por região (a partir do CEP) e simulação de
   cálculo. Substitua `quote()` pela API dos Correios/Melhor
   Envio/Loggi em produção.
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};

  /* faixas de CEP por UF */
  var RANGES = [
    [1000, 19999, 'SP', 'sudeste'], [20000, 28999, 'RJ', 'sudeste'], [29000, 29999, 'ES', 'sudeste'],
    [30000, 39999, 'MG', 'sudeste'], [40000, 48999, 'BA', 'nordeste'], [49000, 49999, 'SE', 'nordeste'],
    [50000, 56999, 'PE', 'nordeste'], [57000, 57999, 'AL', 'nordeste'], [58000, 58999, 'PB', 'nordeste'],
    [59000, 59999, 'RN', 'nordeste'], [60000, 63999, 'CE', 'nordeste'], [64000, 64999, 'PI', 'nordeste'],
    [65000, 65999, 'MA', 'nordeste'], [66000, 68899, 'PA', 'norte'], [68900, 68999, 'AP', 'norte'],
    [69000, 69299, 'AM', 'norte'], [69300, 69399, 'RR', 'norte'], [69400, 69899, 'AM', 'norte'],
    [69900, 69999, 'AC', 'norte'], [70000, 73699, 'DF', 'centro-oeste'], [73700, 76799, 'GO', 'centro-oeste'],
    [76800, 76999, 'RO', 'norte'], [77000, 77999, 'TO', 'norte'], [78000, 78899, 'MT', 'centro-oeste'],
    [79000, 79999, 'MS', 'centro-oeste'], [80000, 87999, 'PR', 'sul'], [88000, 89999, 'SC', 'sul'],
    [90000, 99999, 'RS', 'sul']
  ];

  var REGIONS = {
    'sudeste': { name: 'Sudeste', mult: 1, extra: 0, days: '2 a 5 dias úteis' },
    'sul': { name: 'Sul', mult: 1.18, extra: 1, days: '3 a 6 dias úteis' },
    'centro-oeste': { name: 'Centro-Oeste', mult: 1.34, extra: 2, days: '4 a 8 dias úteis' },
    'nordeste': { name: 'Nordeste', mult: 1.52, extra: 3, days: '5 a 10 dias úteis' },
    'norte': { name: 'Norte', mult: 1.78, extra: 4, days: '6 a 12 dias úteis' }
  };

  function onlyDigits(cep) {
    return String(cep || '').replace(/\D+/g, '');
  }

  /** Identifica UF/região a partir do CEP. */
  function regionOf(cep) {
    var d = onlyDigits(cep);
    if (d.length < 5) return null;
    var prefix = parseInt(d.slice(0, 5), 10) || parseInt(d.padEnd(5, '0'), 10);
    var i;
    for (i = 0; i < RANGES.length; i++) {
      if (prefix >= RANGES[i][0] && prefix <= RANGES[i][1]) {
        var uf = RANGES[i][2], key = RANGES[i][3];
        var r = REGIONS[key];
        /* capital/ região metropolitana é um pouco mais rápida */
        var metro = prefix >= 1000 && prefix <= 9999;
        return {
          uf: uf, key: key, name: r.name,
          mult: metro ? Math.max(1, r.mult - .12) : r.mult,
          extra: metro ? Math.max(0, r.extra - 1) : r.extra,
          days: r.days
        };
      }
    }
    return { uf: '—', key: 'sudeste', name: 'Brasil', mult: 1.2, extra: 2, days: '3 a 8 dias úteis' };
  }

  /**
   * Cotação completa para um CEP.
   * @returns {object} { region, options: [{id,name,price,days}], freeFrom, missing }
   */
  function quote(cep, subtotal) {
    var region = regionOf(cep);
    var cfg = VT.store ? VT.store.settings() : { freeShipFrom: 299, shipBase: 24.9 };
    var base = cfg.shipBase || 24.9;
    var mult = region ? region.mult : 1.2;
    var extra = region ? region.extra : 2;
    var free = subtotal >= (cfg.freeShipFrom || 299);

    var options = [
      { id: 'economy', name: 'Econômico', price: free ? 0 : round(base * .75 * mult), days: 6 + extra, desc: 'Envio consolidado' },
      { id: 'standard', name: 'Padrão', price: free ? 0 : round(base * mult), days: 4 + extra, desc: 'Entrega mais escolhida' },
      { id: 'express', name: 'Expresso', price: free ? round(base * 1.1 * mult) : round(base * 2.1 * mult), days: 1 + extra, desc: 'Receba em até 2 dias úteis' }
    ];

    return {
      region: region,
      options: options,
      freeFrom: cfg.freeShipFrom,
      missing: Math.max(0, round((cfg.freeShipFrom || 299) - (subtotal || 0))),
      eta: region ? region.days : '3 a 8 dias úteis'
    };
  }

  function round(v) { return Math.round(v * 100) / 100; }

  /** Previsão de entrega em dias corridos a partir de hoje. */
  function etaRange(days) {
    var from = VT.format.addDays(Date.now(), days);
    var to = VT.format.addDays(Date.now(), days + 1);
    return { from: from, to: to, text: VT.format.dateShort(from) + ' a ' + VT.format.dateShort(to) };
  }

  VT.shipping = { regionOf: regionOf, quote: quote, etaRange: etaRange, REGIONS: REGIONS };
})(window);
