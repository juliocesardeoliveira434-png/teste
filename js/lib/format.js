/* ============================================================
   VITRINE PRO — format.js
   Formatação e validação no padrão brasileiro (pt-BR).
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};

  /* ---------------- moeda ---------------- */
  function brl(v, opts) {
    opts = opts || {};
    var n = Number(v) || 0;
    var s = n.toFixed(2).replace('.', ',');
    var parts = s.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    var out = parts.join(',');
    return opts.noSymbol ? out : 'R$ ' + out;
  }

  function brlCompact(v) {
    var n = Number(v) || 0;
    if (n >= 1e6) return 'R$ ' + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',') + ' mi';
    if (n >= 1e3) return 'R$ ' + (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace('.', ',') + ' mil';
    return brl(n);
  }

  function num(v, dec) {
    var n = Number(v) || 0;
    return n.toFixed(dec == null ? 0 : dec).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function pct(v, dec) {
    return (Number(v) || 0).toFixed(dec == null ? 1 : dec).replace('.', ',') + '%';
  }

  function discount(oldP, newP) {
    if (!oldP || oldP <= newP) return 0;
    return Math.round((1 - newP / oldP) * 100);
  }

  /* ---------------- datas ---------------- */
  var MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var MESF = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var WEEK = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

  function date(d, opts) {
    opts = opts || {};
    var dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt)) return '—';
    if (opts.long) return dt.getDate() + ' de ' + MESF[dt.getMonth()] + ' de ' + dt.getFullYear();
    if (opts.time) return pad(dt.getDate()) + '/' + pad(dt.getMonth() + 1) + '/' + dt.getFullYear() + ' ' + pad(dt.getHours()) + ':' + pad(dt.getMinutes());
    return pad(dt.getDate()) + '/' + pad(dt.getMonth() + 1) + '/' + dt.getFullYear();
  }

  function dateShort(d) {
    var dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt)) return '—';
    return pad(dt.getDate()) + ' ' + MES[dt.getMonth()];
  }

  function timeAgo(d) {
    var t = d instanceof Date ? d.getTime() : new Date(d).getTime();
    var s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return 'agora mesmo';
    if (s < 3600) return Math.floor(s / 60) + ' min atrás';
    if (s < 86400) return Math.floor(s / 3600) + ' h atrás';
    var days = Math.floor(s / 86400);
    if (days === 1) return 'ontem';
    if (days < 30) return days + ' dias atrás';
    return date(d);
  }

  function addDays(date, n) {
    var d = new Date(date instanceof Date ? date.getTime() : date);
    d.setDate(d.getDate() + n);
    return d;
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function weekday(d) { return WEEK[new Date(d).getDay()]; }

  /* ---------------- texto ---------------- */
  function onlyDigits(s) { return String(s == null ? '' : s).replace(/\D+/g, ''); }

  function maskCEP(v) {
    var d = onlyDigits(v).slice(0, 8);
    return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
  }
  function maskPhone(v) {
    var d = onlyDigits(v).slice(0, 11);
    if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  }
  function maskCPF(v) {
    var d = onlyDigits(v).slice(0, 11);
    return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2').replace(/(\d{3})-(\d{2})(\d)/, '$1-$2');
  }
  function maskCNPJ(v) {
    var d = onlyDigits(v).slice(0, 14);
    return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  function maskCPFCNPJ(v) {
    var d = onlyDigits(v);
    return d.length > 11 ? maskCNPJ(v) : maskCPF(v);
  }
  function maskCard(v) {
    var d = onlyDigits(v).slice(0, 19);
    return d.replace(/(.{4})/g, '$1 ').trim();
  }
  function maskExpiry(v) {
    var d = onlyDigits(v).slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
  }

  function validCPF(v) {
    var c = onlyDigits(v);
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    var sum = 0, i, r;
    for (i = 0; i < 9; i++) sum += parseInt(c[i], 10) * (10 - i);
    r = (sum * 10) % 11; if (r === 10) r = 0;
    if (r !== parseInt(c[9], 10)) return false;
    sum = 0;
    for (i = 0; i < 10; i++) sum += parseInt(c[i], 10) * (11 - i);
    r = (sum * 10) % 11; if (r === 10) r = 0;
    return r === parseInt(c[10], 10);
  }
  function validCNPJ(v) {
    var c = onlyDigits(v);
    if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
    var size = c.length - 2, pos = size - 7, i, sum, r, res;
    for (i = size, sum = 0; i >= 1; i--) { sum += parseInt(c[size - i], 10) * pos--; if (pos < 2) pos = 9; }
    r = sum % 11; res = r < 2 ? 0 : 11 - r;
    if (res !== parseInt(c[12], 10)) return false;
    size = 13; pos = size - 7;
    for (i = size, sum = 0; i >= 1; i--) { sum += parseInt(c[size - i], 10) * pos--; if (pos < 2) pos = 9; }
    r = sum % 11; res = r < 2 ? 0 : 11 - r;
    return res === parseInt(c[13], 10);
  }
  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(String(v || '').trim());
  }
  function validCEP(v) { return onlyDigits(v).length === 8; }

  /** Algoritmo de Luhn — validação de número de cartão. */
  function luhn(num) {
    var d = onlyDigits(num);
    if (d.length < 13) return false;
    var sum = 0, alt = false, i;
    for (i = d.length - 1; i >= 0; i--) {
      var n = parseInt(d[i], 10);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n; alt = !alt;
    }
    return sum % 10 === 0;
  }

  /* ---------------- cartões ---------------- */
  var BRANDS = [
    { id: 'visa', name: 'Visa', re: /^4/, len: [13, 16, 19], cvv: 3, color: '#1a1f71' },
    { id: 'master', name: 'Mastercard', re: /^(5[1-5]|2[2-7])/, len: [16], cvv: 3, color: '#eb001b' },
    { id: 'amex', name: 'American Express', re: /^3[47]/, len: [15], cvv: 4, color: '#006fcf' },
    { id: 'elo', name: 'Elo', re: /^(4011|4312|4389|4514|4576|5041|5067|5090|6277|6362|6363|6504|6516|6550)/, len: [16], cvv: 3, color: '#f5b719' },
    { id: 'hipercard', name: 'Hipercard', re: /^(38|60)/, len: [16], cvv: 3, color: '#8b0000' },
    { id: 'diners', name: 'Diners Club', re: /^3(?:0[0-5]|[68])/, len: [14, 16], cvv: 3, color: '#0079be' },
    { id: 'discover', name: 'Discover', re: /^(6011|65|64[4-9])/, len: [16], cvv: 3, color: '#f76b1c' },
    { id: 'jcb', name: 'JCB', re: /^35/, len: [16], cvv: 3, color: '#0e77bd' },
    { id: 'aura', name: 'Aura', re: /^50/, len: [16], cvv: 3, color: '#f9a825' }
  ];
  function cardBrand(num) {
    var d = onlyDigits(num);
    if (!d) return null;
    for (var i = 0; i < BRANDS.length; i++) if (BRANDS[i].re.test(d)) return BRANDS[i];
    return null;
  }

  /* ---------------- parcelamento ---------------- */
  /**
   * Gera a tabela de parcelamento com juros compostos (prática de mercado BR).
   * @param {number} total valor à vista
   * @param {number} maxInstallments máximo de parcelas
   * @param {number} freeInstallments parcelas sem juros
   * @param {number} monthlyRate taxa mensal (ex.: 0.0199 = 1,99% a.m.)
   */
  function installments(total, maxInstallments, freeInstallments, monthlyRate) {
    var out = [], n;
    maxInstallments = maxInstallments || 12;
    freeInstallments = freeInstallments || 0;
    monthlyRate = monthlyRate || 0;
    for (n = 1; n <= maxInstallments; n++) {
      var value, totalAmount, rate = 0;
      if (n <= freeInstallments || monthlyRate <= 0) {
        value = total / n; totalAmount = total;
      } else {
        // Price: PMT = PV * i / (1 - (1+i)^-n)
        var f = Math.pow(1 + monthlyRate, n);
        value = total * (monthlyRate * f) / (f - 1);
        totalAmount = value * n;
        rate = monthlyRate;
      }
      out.push({
        count: n,
        value: Math.round(value * 100) / 100,
        total: Math.round(totalAmount * 100) / 100,
        interestFree: n <= freeInstallments || monthlyRate <= 0,
        rate: rate,
        diff: Math.round((totalAmount - total) * 100) / 100
      });
    }
    return out;
  }

  /* ---------------- diversos ---------------- */
  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2)
      .map(function (p) { return p[0] || ''; }).join('').toUpperCase();
  }
  function slug(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function plural(n, one, many) { return n === 1 ? one : (many || one + 's'); }
  function truncate(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; }
  function randomDigits(n) {
    var s = '';
    for (var i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
    return s;
  }
  function orderCode(prefix) {
    return (prefix || 'VT') + '-' + new Date().getFullYear().toString().slice(2) +
      pad(new Date().getMonth() + 1) + '-' + randomDigits(5);
  }

  VT.format = {
    brl: brl, brlCompact: brlCompact, num: num, pct: pct, discount: discount,
    date: date, dateShort: dateShort, timeAgo: timeAgo, addDays: addDays, weekday: weekday,
    onlyDigits: onlyDigits, maskCEP: maskCEP, maskPhone: maskPhone, maskCPF: maskCPF,
    maskCNPJ: maskCNPJ, maskCPFCNPJ: maskCPFCNPJ, maskCard: maskCard, maskExpiry: maskExpiry,
    validCPF: validCPF, validCNPJ: validCNPJ, validEmail: validEmail, validCEP: validCEP,
    luhn: luhn, cardBrand: cardBrand, BRANDS: BRANDS, installments: installments,
    initials: initials, slug: slug, plural: plural, truncate: truncate,
    randomDigits: randomDigits, orderCode: orderCode, pad: pad, MES: MES, MESF: MESF
  };
})(window);
