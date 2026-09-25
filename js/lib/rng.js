/* ============================================================
   VITRINE PRO — rng.js
   Gerador pseudoaleatório determinístico (mulberry32).
   Usado para gerar dados de demonstração estáveis entre sessões.
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};

  function hash(str) {
    var h = 1779033703 ^ String(str).length, i;
    for (i = 0; i < String(str).length; i++) {
      h = Math.imul(h ^ String(str).charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }

  /** Cria um gerador com semente (string ou número). */
  function rng(seed) {
    var gen = hash(String(seed == null ? 'vitrine' : seed));
    var a = gen();
    function next() {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    return {
      next: next,
      /** número float entre min e max */
      float: function (min, max) { return min + next() * (max - min); },
      /** inteiro entre min e max (inclusive) */
      int: function (min, max) { return Math.floor(min + next() * (max - min + 1)); },
      /** booleano com probabilidade p */
      chance: function (p) { return next() < (p == null ? .5 : p); },
      /** item aleatório de um array */
      pick: function (arr) { return arr[Math.floor(next() * arr.length)]; },
      /** n itens aleatórios (com reposição) */
      picks: function (arr, n) {
        var out = [], i;
        for (i = 0; i < n; i++) out.push(arr[Math.floor(next() * arr.length)]);
        return out;
      },
      /** embaralha uma cópia do array */
      shuffle: function (arr) {
        var a2 = arr.slice(), i, j, t;
        for (i = a2.length - 1; i > 0; i--) {
          j = Math.floor(next() * (i + 1));
          t = a2[i]; a2[i] = a2[j]; a2[j] = t;
        }
        return a2;
      },
      /** chave aleatória de um objeto */
      weighted: function (pairs) {
        var total = pairs.reduce(function (s, p) { return s + p[1]; }, 0), r = next() * total, acc = 0, i;
        for (i = 0; i < pairs.length; i++) { acc += pairs[i][1]; if (r <= acc) return pairs[i][0]; }
        return pairs[pairs.length - 1][0];
      }
    };
  }

  VT.rng = rng;
})(window);
