/* ============================================================
   VITRINE PRO — art.js
   Gera a "fotografia" dos produtos como SVG procedural.
   Zero arquivos de imagem, zero requisições: tudo nasce em
   tempo de execução a partir do nome da categoria + matiz.
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};

  var W = '#ffffff';
  function op(v) { return 'fill="' + W + '" opacity="' + v + '"'; }

  /* ---------------- silhuetas ---------------- */
  var SIL = {
    headphones: function () {
      return '<path d="M-88 26A88 88 0 0 1 88 26" fill="none" stroke="' + W + '" stroke-width="17" stroke-linecap="round" opacity=".95"/>' +
        '<rect x="-116" y="12" width="48" height="92" rx="23" ' + op('.95') + '/>' +
        '<rect x="68" y="12" width="48" height="92" rx="23" ' + op('.95') + '/>' +
        '<rect x="-104" y="28" width="24" height="60" rx="12" fill="#0b1020" opacity=".16"/>' +
        '<rect x="80" y="28" width="24" height="60" rx="12" fill="#0b1020" opacity=".16"/>';
    },
    earbuds: function () {
      return '<rect x="-74" y="-6" width="148" height="96" rx="36" ' + op('.95') + '/>' +
        '<rect x="-74" y="16" width="148" height="8" fill="#0b1020" opacity=".08"/>' +
        '<circle cx="-32" cy="-56" r="27" ' + op('.95') + '/>' +
        '<circle cx="32" cy="-56" r="27" ' + op('.78') + '/>' +
        '<path d="M-32 -80l-6 26M32 -80l6 26" stroke="' + W + '" stroke-width="7" stroke-linecap="round" opacity=".8"/>' +
        '<circle cx="0" cy="42" r="7" fill="#0b1020" opacity=".14"/>';
    },
    speaker: function () {
      return '<rect x="-58" y="-104" width="116" height="208" rx="28" ' + op('.96') + '/>' +
        '<circle cx="0" cy="-42" r="31" fill="#0b1020" opacity=".17"/>' +
        '<circle cx="0" cy="-42" r="12" fill="#0b1020" opacity=".26"/>' +
        '<circle cx="0" cy="50" r="44" fill="#0b1020" opacity=".15"/>' +
        '<circle cx="0" cy="50" r="22" fill="#0b1020" opacity=".24"/>' +
        '<circle cx="0" cy="50" r="7" fill="#0b1020" opacity=".3"/>';
    },
    watch: function () {
      return '<rect x="-27" y="-108" width="54" height="66" rx="16" ' + op('.7') + '/>' +
        '<rect x="-27" y="44" width="54" height="66" rx="16" ' + op('.7') + '/>' +
        '<rect x="-64" y="-74" width="128" height="148" rx="38" ' + op('.98') + '/>' +
        '<rect x="-49" y="-59" width="98" height="118" rx="26" fill="#0b1020" opacity=".2"/>' +
        '<rect x="-38" y="-48" width="76" height="96" rx="20" ' + op('.28') + '/>' +
        '<rect x="52" y="-24" width="8" height="26" rx="4" ' + op('.9') + '/>';
    },
    band: function () {
      return '<rect x="-24" y="-112" width="48" height="224" rx="22" ' + op('.75') + '/>' +
        '<rect x="-58" y="-46" width="116" height="92" rx="26" ' + op('.98') + '/>' +
        '<rect x="-45" y="-34" width="90" height="68" rx="18" fill="#0b1020" opacity=".2"/>' +
        '<rect x="-34" y="-24" width="68" height="20" rx="6" ' + op('.35') + '/>' +
        '<rect x="-34" y="6" width="44" height="14" rx="6" ' + op('.25') + '/>';
    },
    keyboard: function () {
      var keys = '', r, c;
      for (r = 0; r < 4; r++) {
        for (c = 0; c < 11; c++) {
          var kw = r === 3 && c === 5 ? 92 : 18;
          keys += '<rect x="' + (-101 + c * 19) + '" y="' + (-24 + r * 21) + '" width="' + kw + '" height="15" rx="4" fill="#0b1020" opacity="' + (r === 0 ? '.2' : '.16') + '"/>';
          if (r === 3 && c === 5) c += 4;
        }
      }
      return '<rect x="-116" y="-44" width="232" height="100" rx="16" ' + op('.96') + '/>' + keys +
        '<rect x="-116" y="-44" width="232" height="9" rx="4" fill="#0b1020" opacity=".05"/>';
    },
    mouse: function () {
      return '<rect x="-54" y="-96" width="108" height="192" rx="54" ' + op('.96') + '/>' +
        '<path d="M0 -96v52" stroke="#0b1020" opacity=".13" stroke-width="5"/>' +
        '<rect x="-7" y="-50" width="14" height="34" rx="7" fill="#0b1020" opacity=".18"/>' +
        '<path d="M-54 -6h108" stroke="#0b1020" opacity=".07" stroke-width="4"/>';
    },
    monitor: function () {
      return '<rect x="-122" y="-84" width="244" height="152" rx="14" ' + op('.96') + '/>' +
        '<rect x="-108" y="-70" width="216" height="124" rx="8" fill="#0b1020" opacity=".26"/>' +
        '<rect x="-96" y="-58" width="192" height="100" rx="4" ' + op('.14') + '/>' +
        '<rect x="-18" y="68" width="36" height="36" ' + op('.9') + '/>' +
        '<rect x="-62" y="102" width="124" height="13" rx="6" ' + op('.9') + '/>';
    },
    laptop: function () {
      return '<rect x="-108" y="-84" width="216" height="138" rx="12" ' + op('.96') + '/>' +
        '<rect x="-96" y="-72" width="192" height="114" rx="6" fill="#0b1020" opacity=".26"/>' +
        '<path d="M-128 54h256l14 20a8 8 0 0 1-7 12H-121a8 8 0 0 1-7-12z" ' + op('.95') + '/>' +
        '<rect x="-38" y="62" width="76" height="9" rx="4" fill="#0b1020" opacity=".13"/>';
    },
    chair: function () {
      return '<path d="M-72 -114q72 -22 144 0l-10 132h-124z" ' + op('.92') + '/>' +
        '<path d="M-46 -94q46 -12 92 0" stroke="#0b1020" opacity=".1" stroke-width="6" fill="none"/>' +
        '<path d="M-42 -56q42 -10 84 0" stroke="#0b1020" opacity=".08" stroke-width="6" fill="none"/>' +
        '<rect x="-88" y="18" width="176" height="38" rx="18" ' + op('.98') + '/>' +
        '<rect x="-10" y="54" width="20" height="48" ' + op('.85') + '/>' +
        '<path d="M-74 110h148" stroke="' + W + '" stroke-width="11" stroke-linecap="round" opacity=".85"/>' +
        '<path d="M0 110l-52 -30M0 110l52 -30" stroke="' + W + '" stroke-width="9" stroke-linecap="round" opacity=".7"/>';
    },
    camera: function () {
      return '<path d="M-42 -58l16 -28h52l16 28z" ' + op('.9') + '/>' +
        '<rect x="-112" y="-58" width="224" height="132" rx="20" ' + op('.96') + '/>' +
        '<circle cx="0" cy="8" r="48" fill="#0b1020" opacity=".22"/>' +
        '<circle cx="0" cy="8" r="30" fill="#0b1020" opacity=".32"/>' +
        '<circle cx="0" cy="8" r="14" ' + op('.3') + '/>' +
        '<circle cx="72" cy="-32" r="10" fill="#0b1020" opacity=".22"/>' +
        '<rect x="-96" y="-44" width="34" height="10" rx="5" ' + op('.7') + '/>';
    },
    drone: function () {
      return '<path d="M-40 -6l-46 -40M40 -6l46 -40M-40 34l-46 40M40 34l46 40" stroke="' + W + '" stroke-width="8" stroke-linecap="round" opacity=".8"/>' +
        '<ellipse cx="-92" cy="-52" rx="34" ry="10" ' + op('.8') + '/>' +
        '<ellipse cx="92" cy="-52" rx="34" ry="10" ' + op('.8') + '/>' +
        '<ellipse cx="-92" cy="80" rx="34" ry="10" ' + op('.65') + '/>' +
        '<ellipse cx="92" cy="80" rx="34" ry="10" ' + op('.65') + '/>' +
        '<path d="M-44 -24h88l10 74h-108z" ' + op('.97') + '/>' +
        '<circle cx="0" cy="18" r="20" fill="#0b1020" opacity=".24"/>' +
        '<circle cx="0" cy="18" r="9" fill="#0b1020" opacity=".34"/>';
    },
    smartphone: function () {
      return '<rect x="-64" y="-114" width="128" height="228" rx="28" ' + op('.96') + '/>' +
        '<rect x="-53" y="-101" width="106" height="202" rx="20" fill="#0b1020" opacity=".28"/>' +
        '<rect x="-44" y="-92" width="88" height="184" rx="14" ' + op('.16') + '/>' +
        '<rect x="-20" y="-97" width="40" height="8" rx="4" fill="#0b1020" opacity=".3"/>' +
        '<circle cx="34" cy="-76" r="8" fill="#0b1020" opacity=".3"/>';
    },
    tablet: function () {
      return '<rect x="-96" y="-118" width="192" height="236" rx="20" ' + op('.96') + '/>' +
        '<rect x="-84" y="-104" width="168" height="208" rx="12" fill="#0b1020" opacity=".28"/>' +
        '<rect x="-74" y="-94" width="148" height="188" rx="8" ' + op('.16') + '/>' +
        '<circle cx="0" cy="-112" r="4" fill="#0b1020" opacity=".25"/>';
    },
    backpack: function () {
      return '<path d="M-32 -98a34 34 0 0 1 64 0" fill="none" stroke="' + W + '" stroke-width="15" stroke-linecap="round" opacity=".8"/>' +
        '<path d="M-86 -40a86 86 0 0 1 172 0v116a44 44 0 0 1 -44 44h-84a44 44 0 0 1 -44 -44z" ' + op('.95') + '/>' +
        '<rect x="-46" y="-8" width="92" height="80" rx="20" fill="#0b1020" opacity=".16"/>' +
        '<rect x="-30" y="6" width="60" height="10" rx="5" fill="#0b1020" opacity=".2"/>' +
        '<path d="M-86 44h172" stroke="#0b1020" opacity=".08" stroke-width="6"/>';
    },
    bottle: function () {
      return '<rect x="-15" y="-124" width="30" height="36" rx="7" ' + op('.85') + '/>' +
        '<path d="M-44 -92q0 -16 12 -24l32 -10v34z" ' + op('.9') + '/>' +
        '<rect x="-57" y="-62" width="114" height="184" rx="28" ' + op('.96') + '/>' +
        '<rect x="-57" y="14" width="114" height="66" rx="20" fill="#0b1020" opacity=".13"/>' +
        '<rect x="-38" y="-24" width="76" height="52" rx="8" fill="#0b1020" opacity=".1"/>';
    },
    coffee: function () {
      return '<path d="M-82 -96h124l-14 44h-96z" ' + op('.9') + '/>' +
        '<rect x="-72" y="-52" width="104" height="30" rx="8" ' + op('.96') + '/>' +
        '<rect x="-30" y="-6" width="60" height="52" rx="8" ' + op('.95') + '/>' +
        '<path d="M30 6a14 14 0 0 1 0 28" fill="none" stroke="' + W + '" stroke-width="7" opacity=".9"/>' +
        '<rect x="-64" y="46" width="88" height="14" rx="7" ' + op('.9') + '/>' +
        '<rect x="-46" y="-84" width="52" height="12" rx="6" fill="#0b1020" opacity=".14"/>';
    },
    mic: function () {
      return '<rect x="-20" y="-104" width="40" height="120" rx="20" ' + op('.6') + '/>' +
        '<rect x="-44" y="-92" width="88" height="152" rx="44" ' + op('.96') + '/>' +
        '<g fill="#0b1020" opacity=".16">' +
        '<rect x="-30" y="-74" width="60" height="7" rx="3.5"/><rect x="-30" y="-58" width="60" height="7" rx="3.5"/>' +
        '<rect x="-30" y="-42" width="60" height="7" rx="3.5"/><rect x="-30" y="-26" width="60" height="7" rx="3.5"/>' +
        '<rect x="-30" y="-10" width="60" height="7" rx="3.5"/><rect x="-30" y="6" width="60" height="7" rx="3.5"/>' +
        '</g>' +
        '<path d="M0 62v40" stroke="' + W + '" stroke-width="12" stroke-linecap="round" opacity=".85"/>' +
        '<path d="M-58 106h116" stroke="' + W + '" stroke-width="12" stroke-linecap="round" opacity=".85"/>';
    },
    lamp: function () {
      return '<path d="M-72 34l30 -112h84l30 112z" ' + op('.96') + '/>' +
        '<path d="M-52 26l22 -80h60l22 80z" ' + op('.3') + '/>' +
        '<rect x="-7" y="32" width="14" height="82" ' + op('.85') + '/>' +
        '<rect x="-50" y="110" width="100" height="14" rx="7" ' + op('.92') + '/>';
    },
    book: function () {
      return '<path d="M-98 -80h72a22 22 0 0 1 22 22v142h-94z" ' + op('.9') + '/>' +
        '<path d="M98 -80h-72a22 22 0 0 0 -22 22v142h94z" ' + op('.72') + '/>' +
        '<rect x="-88" y="-88" width="14" height="180" rx="4" fill="#0b1020" opacity=".2"/>' +
        '<rect x="-30" y="-40" width="58" height="9" rx="4" fill="#0b1020" opacity=".14"/>' +
        '<rect x="-30" y="-18" width="40" height="9" rx="4" fill="#0b1020" opacity=".12"/>' +
        '<rect x="8" y="-40" width="58" height="9" rx="4" fill="#0b1020" opacity=".12"/>' +
        '<rect x="8" y="-18" width="40" height="9" rx="4" fill="#0b1020" opacity=".1"/>';
    },
    shoe: function () {
      return '<path d="M-114 52q0 -74 46 -74l38 8q34 8 62 34q22 20 22 40v14h-168z" ' + op('.95') + '/>' +
        '<path d="M-114 70h168" stroke="#0b1020" opacity=".14" stroke-width="12"/>' +
        '<path d="M-40 -14q22 10 30 40" stroke="#0b1020" opacity=".12" stroke-width="6" fill="none"/>' +
        '<path d="M-8 -8q20 12 26 38" stroke="#0b1020" opacity=".1" stroke-width="6" fill="none"/>' +
        '<path d="M-110 -22q30 -8 52 6" stroke="' + W + '" stroke-width="9" fill="none" opacity=".9"/>';
    },
    glasses: function () {
      return '<path d="M-104 -12l-22 -20M104 -12l22 -20" stroke="' + W + '" stroke-width="11" stroke-linecap="round" opacity=".8"/>' +
        '<rect x="-100" y="-46" width="96" height="92" rx="30" ' + op('.92') + '/>' +
        '<rect x="4" y="-46" width="96" height="92" rx="30" ' + op('.92') + '/>' +
        '<rect x="-4" y="-8" width="8" height="14" rx="4" ' + op('.9') + '/>' +
        '<rect x="-88" y="-34" width="72" height="68" rx="22" fill="#0b1020" opacity=".16"/>' +
        '<rect x="16" y="-34" width="72" height="68" rx="22" fill="#0b1020" opacity=".16"/>';
    },
    shirt: function () {
      return '<path d="M-72 -84l-32 22 24 32 20 -14v124h120v-124l20 14 24 -32 -32 -22 -40 22z" ' + op('.95') + '/>' +
        '<path d="M-40 -62l-6 46 40 22 40 -22 -6 -46" fill="none" stroke="#0b1020" opacity=".12" stroke-width="7"/>' +
        '<path d="M-20 40h40" stroke="#0b1020" opacity=".08" stroke-width="8"/>';
    },
    gamepad: function () {
      return '<path d="M-112 -14a74 74 0 0 1 74 -44h80a74 74 0 0 1 74 44a94 74 0 0 1 -108 106h-12a94 74 0 0 1 -108 -106z" ' + op('.96') + '/>' +
        '<circle cx="-58" cy="14" r="9" fill="#0b1020" opacity=".2"/>' +
        '<rect x="-70" y="2" width="24" height="8" rx="4" fill="#0b1020" opacity=".2"/>' +
        '<rect x="-63" y="-5" width="8" height="24" rx="4" fill="#0b1020" opacity=".2"/>' +
        '<circle cx="56" cy="2" r="10" fill="#0b1020" opacity=".18"/>' +
        '<circle cx="82" cy="24" r="10" fill="#0b1020" opacity=".18"/>' +
        '<circle cx="30" cy="24" r="10" fill="#0b1020" opacity=".18"/>' +
        '<circle cx="56" cy="46" r="10" fill="#0b1020" opacity=".18"/>';
    },
    cpu: function () {
      return '<rect x="-72" y="-72" width="144" height="144" rx="18" ' + op('.96') + '/>' +
        '<rect x="-44" y="-44" width="88" height="88" rx="10" fill="#0b1020" opacity=".18"/>' +
        '<rect x="-30" y="-30" width="60" height="60" rx="6" ' + op('.3') + '/>' +
        '<g stroke="' + W + '" stroke-width="7" stroke-linecap="round" opacity=".85">' +
        '<path d="M-40 -72v-24M-12 -72v-24M16 -72v-24M44 -72v-24M-40 72v24M-12 72v24M16 72v24M44 72v24M-72 -40h-24M-72 -12h-24M-72 16h-24M-72 44h-24M72 -40h24M72 -12h24M72 16h24M72 44h24"/>' +
        '</g>';
    },
    generic: function () {
      return '<circle cx="0" cy="0" r="86" ' + op('.9') + '/>' +
        '<rect x="-56" y="-56" width="112" height="112" rx="24" ' + op('.35') + '/>' +
        '<circle cx="34" cy="-40" r="26" ' + op('.5') + '/>';
    }
  };

  /* paletas por matiz */
  function palette(h) {
    return {
      a: 'hsl(' + h + ' 78% 62%)',
      b: 'hsl(' + ((h + 42) % 360) + ' 72% 48%)',
      c: 'hsl(' + ((h + 300) % 360) + ' 70% 58%)'
    };
  }

  function hashStr(s) {
    var h = 0, i;
    s = String(s);
    for (i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  var cache = {};

  /**
   * SVG de produto.
   * @param {string} key  nome da silhueta (ver SIL)
   * @param {number|string} hueOrSeed matiz (0-360) ou string para gerar matiz
   * @param {object} [opts] { w, h, radius, decor }
   */
  function product(key, hueOrSeed, opts) {
    opts = opts || {};
    var hue = typeof hueOrSeed === 'number' ? hueOrSeed : (hashStr(hueOrSeed) % 360);
    var ck = key + '|' + hue + '|' + (opts.decor || '');
    if (cache[ck]) return cache[ck];

    var p = palette(hue);
    var id = 'a' + hashStr(ck).toString(36);
    var body = (SIL[key] || SIL.generic)();

    var decor = '';
    if (opts.decor !== false) {
      decor =
        '<circle cx="52" cy="58" r="150" fill="#fff" opacity=".10"/>' +
        '<circle cx="352" cy="330" r="180" fill="#fff" opacity=".08"/>' +
        '<circle cx="330" cy="60" r="70" fill="#fff" opacity=".10"/>' +
        '<circle cx="40" cy="360" r="90" fill="#fff" opacity=".07"/>' +
        '<path d="M0 300q120 -70 250 -20t150 -60v180H0z" fill="#000" opacity=".07"/>';
    }

    var svg =
      '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="ilustração do produto">' +
      '<defs>' +
        '<linearGradient id="' + id + 'bg" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="' + p.a + '"/>' +
          '<stop offset="1" stop-color="' + p.b + '"/>' +
        '</linearGradient>' +
        '<radialGradient id="' + id + 'gl" cx="50%" cy="35%" r="70%">' +
          '<stop offset="0" stop-color="#fff" stop-opacity=".38"/>' +
          '<stop offset="1" stop-color="#fff" stop-opacity="0"/>' +
        '</radialGradient>' +
      '</defs>' +
      '<rect width="400" height="400" fill="url(#' + id + 'bg)"/>' +
      '<rect width="400" height="400" fill="url(#' + id + 'gl)"/>' +
      decor +
      '<ellipse cx="200" cy="322" rx="104" ry="20" fill="#000" opacity=".13"/>' +
      '<g transform="translate(200 206) scale(' + (opts.scale || 1) + ')">' + body + '</g>' +
      '</svg>';

    cache[ck] = svg;
    return svg;
  }

  /** Fundo abstrato para banners/hero. */
  function banner(text, hue) {
    hue = hue == null ? 250 : hue;
    var id = 'b' + hashStr(text + hue).toString(36);
    var p = palette(hue);
    return '<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + p.a + '"/><stop offset="1" stop-color="' + p.b + '"/></linearGradient></defs>' +
      '<rect width="600" height="400" fill="url(#' + id + ')"/>' +
      '<circle cx="80" cy="80" r="180" fill="#fff" opacity=".12"/>' +
      '<circle cx="540" cy="330" r="200" fill="#fff" opacity=".09"/>' +
      '<circle cx="470" cy="70" r="90" fill="#fff" opacity=".14"/>' +
      '<circle cx="300" cy="200" r="140" fill="#fff" opacity=".06"/>' +
      '</svg>';
  }

  /** QR Code fictício (apenas representação visual do Pix). */
  function qr(seed, modules) {
    modules = modules || 25;
    var r = VT.rng(String(seed)), x, y, cells = '', size = 240, unit = size / modules;
    function finder(cx, cy) {
      return '<rect x="' + cx * unit + '" y="' + cy * unit + '" width="' + unit * 7 + '" height="' + unit * 7 + '" fill="#fff"/>' +
        '<rect x="' + cx * unit + '" y="' + cy * unit + '" width="' + unit * 7 + '" height="' + unit * 7 + '" fill="none" stroke="#000" stroke-width="' + unit + '"/>' +
        '<rect x="' + (cx + 2) * unit + '" y="' + (cy + 2) * unit + '" width="' + unit * 3 + '" height="' + unit * 3 + '" fill="#000"/>';
    }
    for (y = 0; y < modules; y++) {
      for (x = 0; x < modules; x++) {
        var inFinder = (x < 8 && y < 8) || (x > modules - 9 && y < 8) || (x < 8 && y > modules - 9);
        if (inFinder) continue;
        if (y === 6 || x === 6) continue;
        if (r.chance(.46)) cells += '<rect x="' + x * unit + '" y="' + y * unit + '" width="' + unit + '" height="' + unit + '" fill="#000"/>';
      }
    }
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" role="img" aria-label="QR Code do Pix">' +
      '<rect width="' + size + '" height="' + size + '" fill="#fff"/>' + cells +
      finder(0, 0) + finder(modules - 7, 0) + finder(0, modules - 7) +
      '<rect x="' + (modules - 9) * unit + '" y="' + (modules - 9) * unit + '" width="' + unit * 9 + '" height="' + unit * 9 + '" fill="#fff"/>' +
      '<rect x="' + (modules - 8) * unit + '" y="' + (modules - 8) * unit + '" width="' + unit * 7 + '" height="' + unit * 7 + '" fill="none" stroke="#000" stroke-width="' + unit + '"/>' +
      '<circle cx="' + (modules - 4.5) * unit + '" cy="' + (modules - 4.5) * unit + '" r="' + unit * 2 + '" fill="#000"/>' +
      '</svg>';
  }

  VT.art = { product: product, banner: banner, qr: qr, silhouettes: Object.keys(SIL) };
})(window);
