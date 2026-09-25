/* ============================================================
   VITRINE PRO — catalog.js
   Categorias e catálogo de demonstração.
   Em produção, substitua `products` por uma chamada à sua API.
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};
  var F = VT.format;

  /* ------------------------- categorias ------------------------- */
  var categories = [
    { id: 'audio', name: 'Áudio & Som', ico: 'headphones', emoji: '🎧', hue: 265, desc: 'Fones, caixas e tudo que toca alto' },
    { id: 'wearables', name: 'Wearables', ico: 'watch', emoji: '⌚', hue: 205, desc: 'Relógios, pulseiras e smartwatches' },
    { id: 'comp', name: 'Computação', ico: 'laptop', emoji: '💻', hue: 222, desc: 'Notebooks, PCs e upgrades' },
    { id: 'perifericos', name: 'Periféricos', ico: 'keyboard', emoji: '⌨️', hue: 150, desc: 'Teclados, mouses e acessórios de setup' },
    { id: 'moveis', name: 'Móveis & Ergonomia', ico: 'chair', emoji: '🪑', hue: 28, desc: 'Cadeiras, mesas e organização' },
    { id: 'foto', name: 'Foto & Vídeo', ico: 'camera', emoji: '📷', hue: 338, desc: 'Câmeras, drones e iluminação' },
    { id: 'mobile', name: 'Celulares & Tablets', ico: 'smartphone', emoji: '📱', hue: 188, desc: 'Smartphones, tablets e energia' },
    { id: 'casa', name: 'Casa & Cozinha', ico: 'coffee', emoji: '🏠', hue: 14, desc: 'Café, luz e utilidades do dia a dia' },
    { id: 'esporte', name: 'Esporte & Aventura', ico: 'shoe', emoji: '🏃', hue: 105, desc: 'Corrida, trilha e treino' },
    { id: 'games', name: 'Games', ico: 'gamepad', emoji: '🎮', hue: 288, desc: 'Controles, monitores e setups gamers' }
  ];

  /* ------------------------- produtos ------------------------- */
  /** normaliza a entrada compacta em um produto completo */
  function p(o) {
    return {
      id: o.id,
      slug: F.slug(o.name),
      name: o.name,
      brand: o.b,
      cat: o.c,
      art: o.a,
      hue: o.h,
      price: o.p,
      old: o.o || 0,
      rating: o.r || 4.5,
      reviews: o.v || 120,
      stock: o.s == null ? 40 : o.s,
      tags: o.t || [],
      desc: o.d || '',
      specs: o.x || {},
      colors: o.k || null,
      sizes: o.z || null,
      isNew: !!o.n,
      isBest: !!o.bs,
      featured: !!o.f,
      createdAt: o.ca || null
    };
  }

  var products = [

    /* ===== ÁUDIO & SOM ===== */
    p({ id: 'au-01', c: 'audio', a: 'headphones', h: 265, b: 'Aurora', n: true, bs: true, f: true,
        name: 'Fone Over-Ear Aurora ANC Pro', p: 1299, o: 1699, r: 4.8, v: 1284, s: 62,
        t: ['anc', 'bluetooth', 'premium'],
        d: 'Cancelamento ativo de ruído híbrido com 4 microfones, 42 horas de bateria e driver de 40 mm em grafeno. Espuma memory foam revestida em proteína vegetal e estrutura em alumínio escovado.',
        x: { 'Tipo': 'Over-ear fechado', 'Driver': '40 mm grafeno', 'ANC': 'Híbrido até 42 dB', 'Bateria': '42 h (ANC off) / 30 h (ANC on)', 'Conexão': 'Bluetooth 5.3 · LDAC · P2', 'Peso': '268 g', 'Garantia': '24 meses' },
        k: [{ n: 'Preto Fosco', c: '#1f2430' }, { n: 'Areia', c: '#d9cbb8' }, { n: 'Azul Noite', c: '#283a5e' }] }),

    p({ id: 'au-02', c: 'audio', a: 'earbuds', h: 285, b: 'Nimbus', bs: true,
        name: 'Fone In-Ear Nimbus Buds 3', p: 499, o: 699, r: 4.6, v: 2310, s: 180,
        t: ['anc', 'bluetooth', 'portátil'],
        d: 'Som equilibrado com ANC adaptativo, estojo de carregamento sem fio e 31 horas de autonomia total. Resistência IPX5 para treino e chuva.',
        x: { 'Tipo': 'In-ear', 'Driver': '11 mm', 'ANC': 'Adaptativo 35 dB', 'Bateria': '8 h + 23 h no estojo', 'Resistência': 'IPX5', 'Conexão': 'Bluetooth 5.3' },
        k: [{ n: 'Branco', c: '#f4f5f8' }, { n: 'Preto', c: '#1f2430' }] }),

    p({ id: 'au-03', c: 'audio', a: 'speaker', h: 22, b: 'Vexa', f: true,
        name: 'Caixa de Som Vexa Boom 360', p: 899, o: 1099, r: 4.7, v: 742, s: 44,
        t: ['bluetooth', 'resistente', 'festa'],
        d: 'Áudio 360° com 60 W RMS, graves reforçados por radiador passivo duplo e 20 horas de bateria. IP67: à prova d’água e de poeira.',
        x: { 'Potência': '60 W RMS', 'Bateria': '20 h', 'Resistência': 'IP67', 'Alcance': '30 m', 'Recursos': 'Emparelhamento estéreo, RGB' } }),

    p({ id: 'au-04', c: 'audio', a: 'speaker', h: 210, b: 'Orbe',
        name: 'Soundbar Orbe Cinema 5.1', p: 2190, o: 2599, r: 4.5, v: 318, s: 21,
        t: ['home theater', 'dolby'],
        d: 'Sistema 5.1 canais com subwoofer sem fio de 8", Dolby Atmos virtualizado e calibração automática de sala por microfone.',
        x: { 'Canais': '5.1', 'Potência': '420 W', 'Subwoofer': '8" sem fio', 'Entradas': 'HDMI eARC · Óptica · BT 5.2', 'Recursos': 'Dolby Atmos, DTS:X' } }),

    p({ id: 'au-05', c: 'audio', a: 'mic', h: 250, b: 'Zenit', n: true,
        name: 'Microfone Zenit Stream Condenser', p: 749, o: 899, r: 4.7, v: 486, s: 73,
        t: ['streaming', 'usb'],
        d: 'Cápsula condensadora de 25 mm com padrão cardioide, resolução 24 bits/96 kHz e saída de fone de ouvido com monitoramento zero-latency.',
        x: { 'Cápsula': 'Condensador 25 mm', 'Padrão polar': 'Cardioide', 'Resolução': '24 bit / 96 kHz', 'Conexão': 'USB-C', 'Acessórios': 'Suporte mesa, anti-pop' } }),

    p({ id: 'au-06', c: 'audio', a: 'headphones', h: 130, b: 'Halo',
        name: 'Headset Gamer Halo Recon 7.1', p: 649, o: 799, r: 4.4, v: 1544, s: 0,
        t: ['gamer', 'surround'],
        d: 'Surround 7.1 virtual, microfone removível com cancelamento de ruído e estrutura em aço com almofadas em tecido respirável.',
        x: { 'Driver': '50 mm neodímio', 'Surround': '7.1 virtual', 'Microfone': 'Removível, cardioide', 'Conexão': 'USB + P3', 'Iluminação': 'RGB endereçável' } }),

    /* ===== WEARABLES ===== */
    p({ id: 'we-01', c: 'wearables', a: 'watch', h: 205, b: 'Nordek', bs: true, f: true,
        name: 'Smartwatch Nordek Pulse X', p: 1499, o: 1899, r: 4.7, v: 2033, s: 51,
        t: ['gps', 'amoled', 'esporte'],
        d: 'Tela AMOLED de 1,43" sempre ativa, GPS duplo, oxímetro, ECG e até 14 dias de bateria no modo econômico. Caixa em titânio grau 5.',
        x: { 'Tela': 'AMOLED 1,43" 466x466', 'Sensores': 'FC, SpO₂, ECG, temperatura', 'GPS': 'Dupla banda L1+L5', 'Bateria': '14 dias', 'Resistência': '5 ATM + IP68', 'Caixa': 'Titânio 46 mm' },
        k: [{ n: 'Titânio', c: '#8d9199' }, { n: 'Preto', c: '#1f2430' }, { n: 'Azul', c: '#2f5fa8' }] }),

    p({ id: 'we-02', c: 'wearables', a: 'watch', h: 190, b: 'Nordek',
        name: 'Smartwatch Nordek Pulse Lite', p: 799, r: 4.5, v: 981, s: 96,
        t: ['gps', 'custo-benefício'],
        d: 'A tela AMOLED de 1,32", GPS integrado, 120 modos esportivos e 9 dias de bateria em um corpo de apenas 34 g.',
        x: { 'Tela': 'AMOLED 1,32"', 'Sensores': 'FC, SpO₂, sono', 'GPS': 'Integrado', 'Bateria': '9 dias', 'Peso': '34 g' } }),

    p({ id: 'we-03', c: 'wearables', a: 'watch', h: 38, b: 'Kalm',
        name: 'Relógio Kalm Classic Automático', p: 1890, r: 4.9, v: 214, s: 12,
        t: ['luxo', 'mecânico'],
        d: 'Movimento automático japonês de 21 joias com reserva de 41 horas, vidro de safira e pulseira em couro legítimo costurado à mão.',
        x: { 'Movimento': 'Automático 21 joias', 'Reserva': '41 h', 'Vidro': 'Safira', 'Caixa': 'Aço 316L 40 mm', 'Resistência': '5 ATM' } }),

    p({ id: 'we-04', c: 'wearables', a: 'band', h: 160, b: 'Axion',
        name: 'Pulseira Fitness Axion Fit 5', p: 349, o: 449, r: 4.3, v: 1673, s: 210,
        t: ['fitness', 'custo-benefício'],
        d: 'Monitora frequência cardíaca 24h, sono, estresse e 110 modalidades de treino. Tela colorida de 1,1" e 12 dias de bateria.',
        x: { 'Tela': 'TFT 1,1"', 'Sensores': 'FC, SpO₂', 'Bateria': '12 dias', 'Resistência': 'IP68' } }),

    p({ id: 'we-05', c: 'wearables', a: 'watch', h: 320, b: 'Pulsar', n: true,
        name: 'Smartwatch Infantil Pulsar Kids', p: 429, r: 4.4, v: 356, s: 120,
        t: ['infantil', 'gps'],
        d: 'Chip 4G com chamadas de vídeo, cerca virtual por GPS, botão SOS e sem acesso à internet aberta. Indicado de 4 a 12 anos.',
        x: { 'Tela': 'IPS 1,4"', 'Localização': 'GPS + Wi-Fi + LBS', 'Chip': '4G (nano SIM)', 'Bateria': '4 dias', 'Recursos': 'SOS, cerca virtual, vídeo chamada' } }),

    /* ===== COMPUTAÇÃO ===== */
    p({ id: 'cp-01', c: 'comp', a: 'laptop', h: 222, b: 'Vexa', bs: true, f: true,
        name: 'Notebook Vexa Air 14"', p: 5499, o: 6299, r: 4.8, v: 892, s: 27,
        t: ['produtividade', 'leve'],
        d: 'Processador de 12 núcleos, 16 GB de memória e SSD de 512 GB em um corpo de alumínio com apenas 1,19 kg. Tela IPS 2.8K de 120 Hz com 100% sRGB.',
        x: { 'Processador': '12 núcleos / 16 threads', 'Memória': '16 GB LPDDR5', 'Armazenamento': 'SSD 512 GB NVMe', 'Tela': '14" IPS 2.8K 120 Hz', 'Peso': '1,19 kg', 'Bateria': 'até 15 h', 'Portas': '2x USB-C, HDMI, leitor SD' },
        k: [{ n: 'Cinza Espacial', c: '#6b7280' }, { n: 'Prata', c: '#c9ced6' }] }),

    p({ id: 'cp-02', c: 'comp', a: 'monitor', h: 235, b: 'Mox', f: true,
        name: 'Monitor Mox Vision 27" 4K', p: 2399, o: 2899, r: 4.7, v: 611, s: 34,
        t: ['4k', 'design', 'produtividade'],
        d: 'Painel IPS 4K com 99% sRGB, HDR400 e suporte com ajuste de altura, inclinação e rotação. Entrada USB-C com 90 W de carregamento.',
        x: { 'Tela': '27" IPS 4K (3840x2160)', 'Cor': '99% sRGB · HDR400', 'Taxa': '60 Hz', 'USB-C': '90 W Power Delivery', 'Ajustes': 'Altura, tilt, pivot' } }),

    p({ id: 'cp-03', c: 'comp', a: 'cpu', h: 200, b: 'Axion', n: true,
        name: 'Mini PC Axion Cube', p: 2899, r: 4.5, v: 189, s: 40,
        t: ['compacto', 'produtividade'],
        d: 'Um computador completo em 0,6 litro: 8 núcleos, 16 GB, SSD de 512 GB, Wi-Fi 6E e saída para até três monitores 4K.',
        x: { 'Processador': '8 núcleos', 'Memória': '16 GB DDR5', 'Armazenamento': 'SSD 512 GB', 'Rede': 'Wi-Fi 6E · 2.5 GbE', 'Saídas': '2x HDMI, 1x USB-C DP' } }),

    p({ id: 'cp-04', c: 'comp', a: 'cpu', h: 145, b: 'Nimbus',
        name: 'SSD Nimbus 1 TB NVMe Gen4', p: 549, o: 699, r: 4.8, v: 3122, s: 320,
        t: ['upgrade', 'armazenamento'],
        d: 'Leitura sequencial de 7.400 MB/s e gravação de 6.800 MB/s. Dissipador de grafeno compatível com notebooks e desktops.',
        x: { 'Interface': 'PCIe 4.0 x4 · NVMe 2.0', 'Leitura': '7.400 MB/s', 'Gravação': '6.800 MB/s', 'TBW': '600 TB', 'Garantia': '5 anos' } }),

    p({ id: 'cp-05', c: 'comp', a: 'laptop', h: 300, b: 'Halo',
        name: 'Notebook Gamer Halo Titan 16', p: 8999, o: 9999, r: 4.6, v: 274, s: 9,
        t: ['gamer', 'rtx', 'alta performance'],
        d: 'GPU dedicada de 8 GB, tela QHD de 240 Hz e sistema de refrigeração com câmara de vapor e cinco heat pipes.',
        x: { 'Processador': '16 núcleos', 'GPU': '8 GB GDDR6', 'Tela': '16" QHD 240 Hz', 'Memória': '32 GB DDR5', 'Armazenamento': 'SSD 1 TB' } }),

    p({ id: 'cp-06', c: 'comp', a: 'generic', h: 260, b: 'Orbe',
        name: 'Hub USB-C Orbe 8 em 1', p: 299, r: 4.4, v: 1298, s: 155,
        t: ['acessório', 'produtividade'],
        d: 'HDMI 4K 60 Hz, leitor de cartões SD/microSD, duas portas USB-A 3.2, USB-C PD 100 W, Ethernet gigabit e P2.',
        x: { 'HDMI': '4K 60 Hz', 'USB-A': '2x 3.2 Gen2', 'PD': '100 W', 'Rede': 'Gigabit', 'Leitor': 'SD + microSD' } }),

    /* ===== PERIFÉRICOS ===== */
    p({ id: 'pf-01', c: 'perifericos', a: 'keyboard', h: 150, b: 'Zenit', bs: true, f: true,
        name: 'Teclado Mecânico Zenit K87', p: 549, o: 699, r: 4.8, v: 2487, s: 88,
        t: ['mecânico', 'rgb', 'sem fio'],
        d: 'Layout TKL com switches hot-swap de 5 pinos, espuma acústica dupla, conectividade tri-modos (2.4G, BT 5.1 e USB-C) e bateria de 4.000 mAh.',
        x: { 'Layout': 'TKL 87 teclas', 'Switches': 'Hot-swap 5 pinos', 'Conexão': '2.4G · BT 5.1 · USB-C', 'Bateria': '4.000 mAh', 'Extras': 'Knob de volume, RGB por tecla' },
        k: [{ n: 'Preto', c: '#1f2430' }, { n: 'Branco', c: '#f4f5f8' }, { n: 'Verde', c: '#2f8f5b' }] }),

    p({ id: 'pf-02', c: 'perifericos', a: 'mouse', h: 175, b: 'Vexa',
        name: 'Mouse Sem Fio Vexa Swift', p: 249, o: 319, r: 4.5, v: 1876, s: 240,
        t: ['sem fio', 'silencioso'],
        d: 'Sensor de 12.000 DPI, cliques silenciosos, 70 dias de bateria e conexão dual (2.4G + Bluetooth) para alternar entre dois computadores.',
        x: { 'Sensor': '12.000 DPI', 'Bateria': '70 dias', 'Conexão': '2.4G + BT 5.0', 'Peso': '78 g' } }),

    p({ id: 'pf-03', c: 'perifericos', a: 'mouse', h: 330, b: 'Halo', n: true,
        name: 'Mouse Gamer Halo Fang 8K', p: 499, r: 4.7, v: 623, s: 67,
        t: ['gamer', 'alta performance'],
        d: 'Polling rate de 8.000 Hz, sensor óptico de 30.000 DPI, switches ópticos de 100 milhões de cliques e apenas 55 g.',
        x: { 'Sensor': '30.000 DPI', 'Polling': '8.000 Hz', 'Switches': 'Ópticos 100 M', 'Peso': '55 g', 'Conexão': '2.4G sem fio' } }),

    p({ id: 'pf-04', c: 'perifericos', a: 'keyboard', h: 200, b: 'Kalm',
        name: 'Teclado Sem Fio Kalm Slim', p: 189, r: 4.2, v: 934, s: 310,
        t: ['silencioso', 'escritório'],
        d: 'Perfil baixo com teclas tipo tesoura silenciosas, conexão Bluetooth para três dispositivos e bateria recarregável de 6 meses.',
        x: { 'Perfil': 'Baixo (scissor)', 'Conexão': 'BT multiponto 3', 'Bateria': '6 meses', 'Layout': 'ABNT2' } }),

    p({ id: 'pf-05', c: 'perifericos', a: 'camera', h: 250, b: 'Orbe',
        name: 'Webcam Orbe Stream 4K', p: 699, o: 849, r: 4.4, v: 512, s: 78,
        t: ['streaming', '4k'],
        d: 'Sensor Sony de 1/2,8" com gravação em 4K30, autofoco por IA, correção de luz automática e microfones duplos com cancelamento de ruído.',
        x: { 'Resolução': '4K30 / 1080p60', 'Sensor': 'Sony 1/2,8"', 'Foco': 'AF por IA', 'Microfone': 'Duplo estéreo', 'Conexão': 'USB-C' } }),

    p({ id: 'pf-06', c: 'perifericos', a: 'keyboard', h: 100, b: 'Zenit',
        name: 'Teclado Mecânico Compacto Zenit K61', p: 429, r: 4.6, v: 743, s: 95,
        t: ['mecânico', 'compacto'],
        d: '60% com switches lineares lubrificados de fábrica, placa em gasket mount e som encorpado. Ideal para mesas pequenas.',
        x: { 'Layout': '60% (61 teclas)', 'Switches': 'Lineares lubrificados', 'Montagem': 'Gasket', 'Conexão': 'USB-C destacável' } }),

    /* ===== MÓVEIS & ERGONOMIA ===== */
    p({ id: 'mv-01', c: 'moveis', a: 'chair', h: 18, b: 'Halo', bs: true, f: true,
        name: 'Cadeira Gamer Halo Throne', p: 1899, o: 2299, r: 4.6, v: 1632, s: 38,
        t: ['gamer', 'ergonômica'],
        d: 'Espuma de alta densidade, apoio lombar ajustável, braços 4D, reclínio de até 165° e base em alumínio com rodízios silenciosos.',
        x: { 'Reclínio': 'até 165°', 'Braços': '4D', 'Apoio lombar': 'Ajustável', 'Base': 'Alumínio', 'Suporta': 'até 150 kg' },
        k: [{ n: 'Preto/Vermelho', c: '#8b1e2d' }, { n: 'Preto/Cinza', c: '#4b5563' }] }),

    p({ id: 'mv-02', c: 'moveis', a: 'chair', h: 210, b: 'Kalm',
        name: 'Cadeira Ergonômica Kalm Executive', p: 2790, r: 4.8, v: 421, s: 17,
        t: ['ergonômica', 'premium', 'escritório'],
        d: 'Encosto em malha elástica com suporte lombar dinâmico, apoio de cabeça 3D, mecanismo synchro e garantia de 6 anos.',
        x: { 'Encosto': 'Malha elástica', 'Apoio cabeça': '3D', 'Mecanismo': 'Synchro 4 posições', 'Braços': '4D', 'Garantia': '6 anos' } }),

    p({ id: 'mv-03', c: 'moveis', a: 'generic', h: 40, b: 'Orbe', n: true,
        name: 'Mesa Standing Desk Orbe Rise', p: 2190, o: 2490, r: 4.7, v: 298, s: 23,
        t: ['escritório', 'altura ajustável'],
        d: 'Mesa elétrica com dois motores, ajuste de 71 a 121 cm, memória para 4 alturas e tampo de 140x70 cm em MDF com acabamento em linho.',
        x: { 'Altura': '71 – 121 cm', 'Motores': '2 (silenciosos)', 'Memórias': '4 posições', 'Tampo': '140 x 70 cm', 'Capacidade': '100 kg' } }),

    p({ id: 'mv-04', c: 'moveis', a: 'generic', h: 250, b: 'Vexa',
        name: 'Suporte de Monitor Vexa Articulado', p: 349, r: 4.5, v: 1119, s: 140,
        t: ['setup', 'acessório'],
        d: 'Braço articulado com pistão a gás para monitores de 17" a 32" até 9 kg. Libera espaço na mesa e melhora a postura.',
        x: { 'Compatível': '17" – 32"', 'Carga': 'até 9 kg', 'VESA': '75 e 100 mm', 'Fixação': 'Mesa (clamp ou furo)' } }),

    p({ id: 'mv-05', c: 'moveis', a: 'generic', h: 30, b: 'Terra',
        name: 'Estante Modular Terra 5 Prateleiras', p: 899, r: 4.3, v: 231, s: 52,
        t: ['organização', 'casa'],
        d: 'Estrutura em aço com pintura epóxi e prateleiras em MDF de 25 mm. Módulos empilháveis que crescem junto com você.',
        x: { 'Dimensões': '180 x 90 x 35 cm', 'Material': 'Aço + MDF 25 mm', 'Módulos': '5 prateleiras', 'Carga': '40 kg por prateleira' } }),

    /* ===== FOTO & VÍDEO ===== */
    p({ id: 'ft-01', c: 'foto', a: 'camera', h: 338, b: 'Lumen', f: true,
        name: 'Câmera Mirrorless Lumen M50', p: 6499, o: 7299, r: 4.9, v: 187, s: 8,
        t: ['mirrorless', '4k', 'premium'],
        d: 'Sensor APS-C de 32 MP, estabilização no corpo em 5 eixos, vídeo 4K 60 fps em 10 bits e visor eletrônico de 2,36 M pontos.',
        x: { 'Sensor': 'APS-C 32 MP', 'Estabilização': 'IBIS 5 eixos', 'Vídeo': '4K 60 fps 10 bit', 'Visor': 'EVF 2,36 M', 'Tela': '3" articulada', 'Conexão': 'Wi-Fi · BT · USB-C' } }),

    p({ id: 'ft-02', c: 'foto', a: 'drone', h: 200, b: 'Lumen', bs: true,
        name: 'Drone Lumen Air Mini 4K', p: 4299, o: 4999, r: 4.7, v: 342, s: 19,
        t: ['drone', '4k', 'portátil'],
        d: 'Apenas 249 g, com câmera 4K em gimbal de 3 eixos, 34 minutos de voo, retorno automático e detecção de obstáculos em três direções.',
        x: { 'Peso': '249 g', 'Câmera': '4K30 · 12 MP', 'Gimbal': '3 eixos', 'Voo': '34 min', 'Alcance': '10 km', 'Sensores': '3 direções' } }),

    p({ id: 'ft-03', c: 'foto', a: 'generic', h: 260, b: 'Lumen',
        name: 'Lente Lumen 35 mm f/1.8', p: 2190, r: 4.8, v: 156, s: 26,
        t: ['lente', 'premium'],
        d: 'Distância focal versátil com abertura f/1.8, foco interno ultrarrápido e construção selada contra poeira e umidade.',
        x: { 'Distância focal': '35 mm (eq. 52 mm)', 'Abertura': 'f/1.8 – f/16', 'Elementos': '11 em 8 grupos', 'Foco mínimo': '0,25 m', 'Peso': '285 g' } }),

    p({ id: 'ft-04', c: 'foto', a: 'generic', h: 120, b: 'Terra',
        name: 'Tripé Terra Carbon Pro', p: 549, r: 4.6, v: 463, s: 71,
        t: ['tripé', 'leve'],
        d: 'Fibra de carbono de 8 camadas, altura de 42 a 165 cm, cabeça ball head de 360° e peso de apenas 1,3 kg.',
        x: { 'Material': 'Fibra de carbono', 'Altura': '42 – 165 cm', 'Peso': '1,3 kg', 'Carga': 'até 12 kg' } }),

    p({ id: 'ft-05', c: 'foto', a: 'lamp', h: 42, b: 'Nimbus',
        name: 'Ring Light Nimbus 12"', p: 189, o: 259, r: 4.4, v: 2210, s: 190,
        t: ['iluminação', 'streaming'],
        d: 'Anel de 12" com 30 W, ajuste de 3.200 K a 6.500 K, 10 níveis de brilho e suporte de mesa com tripé de 2 m.',
        x: { 'Potência': '30 W', 'Temperatura': '3.200 – 6.500 K', 'Brilho': '10 níveis', 'Altura': 'até 2 m' } }),

    /* ===== CELULARES & TABLETS ===== */
    p({ id: 'mb-01', c: 'mobile', a: 'smartphone', h: 188, b: 'Vexa', bs: true, f: true,
        name: 'Smartphone Vexa Note 12 Pro', p: 3299, o: 3799, r: 4.7, v: 3411, s: 64,
        t: ['5g', 'câmera', 'premium'],
        d: 'Tela AMOLED de 6,7" a 120 Hz, câmera principal de 108 MP com OIS, bateria de 5.000 mAh e carregamento de 67 W (0 a 100% em 38 min).',
        x: { 'Tela': '6,7" AMOLED 120 Hz', 'Processador': 'Octa-core 4 nm', 'Câmeras': '108 MP + 8 MP UW + 2 MP', 'Bateria': '5.000 mAh', 'Carga': '67 W', 'Memória': '12 GB + 256 GB' },
        k: [{ n: 'Grafite', c: '#2b2f36' }, { n: 'Azul Oceano', c: '#1e5f8f' }, { n: 'Verde Menta', c: '#5f9e7d' }] }),

    p({ id: 'mb-02', c: 'mobile', a: 'smartphone', h: 160, b: 'Nimbus',
        name: 'Smartphone Nimbus Lite 5G', p: 1899, o: 2199, r: 4.5, v: 1876, s: 128,
        t: ['5g', 'custo-benefício'],
        d: 'Tela de 6,5" a 90 Hz, câmera de 64 MP, 8 GB de memória e bateria de 5.000 mAh com carregamento de 33 W.',
        x: { 'Tela': '6,5" IPS 90 Hz', 'Processador': 'Octa-core 6 nm', 'Câmeras': '64 MP + 8 MP', 'Bateria': '5.000 mAh · 33 W', 'Memória': '8 GB + 256 GB' } }),

    p({ id: 'mb-03', c: 'mobile', a: 'tablet', h: 218, b: 'Orbe', n: true,
        name: 'Tablet Orbe Pad 11', p: 2499, r: 4.6, v: 521, s: 44,
        t: ['tablet', 'produtividade'],
        d: 'Tela de 11" 2K a 120 Hz, som estéreo com 4 alto-falantes, suporte a caneta e teclado magnético (vendidos separadamente).',
        x: { 'Tela': '11" IPS 2K 120 Hz', 'Processador': 'Octa-core', 'Memória': '8 GB + 128 GB', 'Áudio': '4 alto-falantes', 'Bateria': '8.000 mAh' } }),

    p({ id: 'mb-04', c: 'mobile', a: 'generic', h: 260, b: 'Axion',
        name: 'Carregador Turbo Axion 65 W GaN', p: 199, r: 4.7, v: 2688, s: 260,
        t: ['carregador', 'acessório'],
        d: 'Nitreto de gálio com três portas (2x USB-C + 1x USB-A), 65 W de potência total e carregamento PD 3.0 / PPS.',
        x: { 'Potência': '65 W', 'Portas': '2x USB-C + 1x USB-A', 'Protocolos': 'PD 3.0, PPS, QC 4+', 'Tecnologia': 'GaN III' } }),

    p({ id: 'mb-05', c: 'mobile', a: 'generic', h: 15, b: 'Axion',
        name: 'Power Bank Axion 20.000 mAh', p: 299, o: 399, r: 4.5, v: 1432, s: 175,
        t: ['bateria', 'viagem'],
        d: 'Capacidade para 4 cargas completas, saída de 22,5 W, display digital e duas saídas USB + uma USB-C bidirecional.',
        x: { 'Capacidade': '20.000 mAh', 'Saída': '22,5 W', 'Portas': '2x USB-A + 1x USB-C', 'Display': 'Digital' } }),

    /* ===== CASA & COZINHA ===== */
    p({ id: 'cs-01', c: 'casa', a: 'coffee', h: 14, b: 'Kalm', f: true,
        name: 'Cafeteira Espresso Kalm Barista', p: 1899, o: 2299, r: 4.8, v: 764, s: 31,
        t: ['café', 'premium'],
        d: 'Bomba italiana de 20 bar, moedor cônico integrado com 30 níveis, vaporizador profissional e PID para controle de temperatura.',
        x: { 'Pressão': '20 bar', 'Moedor': 'Cônico 30 níveis', 'Reservatório': '1,8 L', 'PID': 'Sim', 'Potência': '1.350 W' } }),

    p({ id: 'cs-02', c: 'casa', a: 'bottle', h: 190, b: 'Terra', bs: true,
        name: 'Garrafa Térmica Terra 750 ml', p: 149, o: 199, r: 4.6, v: 4207, s: 420,
        t: ['térmica', 'sustentável'],
        d: 'Parede dupla em aço inox 304, mantém líquidos quentes por 12 h e gelados por 24 h. Sem BPA e com tampa à prova de vazamento.',
        x: { 'Capacidade': '750 ml', 'Material': 'Inox 304 duplo', 'Quente': '12 h', 'Frio': '24 h', 'BPA free': 'Sim' } }),

    p({ id: 'cs-03', c: 'casa', a: 'lamp', h: 45, b: 'Lumen', n: true,
        name: 'Luminária Inteligente Lumen Aura', p: 399, r: 4.5, v: 683, s: 97,
        t: ['smart home', 'iluminação'],
        d: '16 milhões de cores, 1.100 lúmens, controle por app e voz, rotinas de nascer/pôr do sol e sincronia com música.',
        x: { 'Fluxo': '1.100 lm', 'Cores': 'RGB + branco 2.700–6.500 K', 'Conexão': 'Wi-Fi 2.4 GHz', 'Vida útil': '25.000 h', 'Assistentes': 'Alexa, Google, Siri' } }),

    p({ id: 'cs-04', c: 'casa', a: 'generic', h: 25, b: 'Nimbus',
        name: 'Air Fryer Nimbus Digital 5 L', p: 549, o: 699, r: 4.7, v: 3982, s: 132,
        t: ['cozinha', 'saúde'],
        d: 'Cesta de 5 litros com revestimento cerâmico, 12 programas automáticos e tecnologia de circulação de ar a 200 °C.',
        x: { 'Capacidade': '5 L', 'Potência': '1.500 W', 'Programas': '12', 'Temperatura': '80 – 200 °C', 'Cesta': 'Antiaderente cerâmica' } }),

    p({ id: 'cs-05', c: 'casa', a: 'generic', h: 100, b: 'Vexa',
        name: 'Liquidificador Vexa Power 1.200 W', p: 349, r: 4.3, v: 1147, s: 165,
        t: ['cozinha'],
        d: 'Motor de 1.200 W com 8 velocidades e função pulsar, jarra de vidro de 3 L e lâminas em aço inox removíveis.',
        x: { 'Potência': '1.200 W', 'Velocidades': '8 + pulsar', 'Jarra': 'Vidro 3 L', 'Lâminas': 'Inox removível' } }),

    /* ===== ESPORTE & AVENTURA ===== */
    p({ id: 'es-01', c: 'esporte', a: 'shoe', h: 105, b: 'Pulsar', bs: true, f: true,
        name: 'Tênis de Corrida Pulsar Flow 3', p: 699, o: 899, r: 4.7, v: 2154, s: 210,
        t: ['corrida', 'conforto'],
        d: 'Entressola em espuma supercrítica com retorno de 82% de energia, cabedal em knit reciclado e placa de propulsão em PEBA.',
        x: { 'Pisada': 'Neutra', 'Drop': '8 mm', 'Peso': '232 g', 'Cabedal': 'Knit reciclado', 'Entressola': 'Espuma supercrítica' },
        z: [{ n: '38' }, { n: '39' }, { n: '40' }, { n: '41' }, { n: '42' }, { n: '43' }] }),

    p({ id: 'es-02', c: 'esporte', a: 'backpack', h: 130, b: 'Terra',
        name: 'Mochila Terra Trail 30 L', p: 349, r: 4.6, v: 876, s: 118,
        t: ['trilha', 'viagem'],
        d: 'Nylon ripstop 600D com costuras seladas, capa de chuva integrada, compartimento para hidratação e apoio lombar em espuma EVA.',
        x: { 'Capacidade': '30 L', 'Material': 'Nylon 600D', 'Capa de chuva': 'Integrada', 'Hidratação': 'Até 3 L', 'Peso': '980 g' } }),

    p({ id: 'es-03', c: 'esporte', a: 'bottle', h: 175, b: 'Terra',
        name: 'Garrafa Esportiva Terra 1 L', p: 99, r: 4.4, v: 3120, s: 340,
        t: ['treino', 'sustentável'],
        d: 'Squeeze em Tritan livre de BPA, bico esportivo com trava e faixa antiderrapante. Vai na lava-louças.',
        x: { 'Capacidade': '1 L', 'Material': 'Tritan BPA free', 'Bico': 'Esportivo com trava' } }),

    p({ id: 'es-04', c: 'esporte', a: 'glasses', h: 265, b: 'Kalm',
        name: 'Óculos de Sol Kalm Sport', p: 299, o: 399, r: 4.5, v: 612, s: 88,
        t: ['corrida', 'proteção'],
        d: 'Lente espelhada com proteção UV400, armação em TR90 flexível e apoio nasal ajustável. Apenas 24 g.',
        x: { 'Lente': 'UV400 espelhada', 'Armação': 'TR90', 'Peso': '24 g', 'Tratamento': 'Antirrisco' } }),

    p({ id: 'es-05', c: 'esporte', a: 'shirt', h: 190, b: 'Axion',
        name: 'Camiseta Dry-Fit Axion Training', p: 129, r: 4.3, v: 1587, s: 0,
        t: ['treino', 'conforto'],
        d: 'Tecido de poliamida com elastano, secagem rápida, proteção UV50+ e costuras planas que não machucam.',
        x: { 'Tecido': '90% poliamida / 10% elastano', 'Proteção': 'UV50+', 'Tecnologia': 'Secagem rápida' },
        z: [{ n: 'P' }, { n: 'M' }, { n: 'G' }, { n: 'GG' }] }),

    /* ===== GAMES ===== */
    p({ id: 'gm-01', c: 'games', a: 'gamepad', h: 288, b: 'Vexa', bs: true,
        name: 'Controle Sem Fio Vexa Pro', p: 449, o: 549, r: 4.7, v: 2903, s: 143,
        t: ['gamer', 'sem fio'],
        d: 'Analógicos com sensor Hall (sem drift), gatilhos adaptativos, 4 botões traseiros programáveis e 40 h de bateria.',
        x: { 'Analógicos': 'Sensor Hall', 'Gatilhos': 'Adaptativos', 'Botões extras': '4 traseiros', 'Bateria': '40 h', 'Compatível': 'PC, Android, TV' } }),

    p({ id: 'gm-02', c: 'games', a: 'monitor', h: 268, b: 'Mox', f: true,
        name: 'Monitor Gamer Mox 27" 240 Hz', p: 1999, o: 2499, r: 4.8, v: 921, s: 39,
        t: ['gamer', 'alta performance'],
        d: 'Painel IPS QHD de 240 Hz com 1 ms GtG, HDR600, FreeSync Premium e suporte com ajuste completo.',
        x: { 'Tela': '27" IPS QHD', 'Taxa': '240 Hz', 'Resposta': '1 ms GtG', 'HDR': '600', 'Sync': 'FreeSync Premium' } }),

    p({ id: 'gm-03', c: 'games', a: 'gamepad', h: 30, b: 'Zenit',
        name: 'Volante Gamer Zenit R3', p: 1299, o: 1499, r: 4.6, v: 287, s: 22,
        t: ['sim racing', 'gamer'],
        d: 'Volante com force feedback de 8 N·m, pedal de carga com célula de carga e câmbio em H de 6 marchas.',
        x: { 'Force feedback': '8 N·m', 'Rotação': '900°', 'Pedais': '3 com célula de carga', 'Câmbio': 'H de 6 marchas' } }),

    p({ id: 'gm-04', c: 'games', a: 'tablet', h: 300, b: 'Pulsar', n: true,
        name: 'Console Portátil Pulsar Pocket', p: 1799, r: 4.5, v: 634, s: 46,
        t: ['portátil', 'gamer'],
        d: 'Tela de 7" a 120 Hz, processador de 8 núcleos, 16 GB de memória e SSD de 512 GB. Roda seu catálogo com emulação nativa.',
        x: { 'Tela': '7" IPS 120 Hz', 'Processador': '8 núcleos', 'Memória': '16 GB', 'Armazenamento': 'SSD 512 GB', 'Bateria': '6 h' } }),

    p({ id: 'gm-05', c: 'games', a: 'generic', h: 250, b: 'Halo',
        name: 'Mousepad XL Halo Speed', p: 129, r: 4.6, v: 2745, s: 300,
        t: ['gamer', 'acessório'],
        d: 'Superfície de microfibra de trama fechada, base em borracha natural antiderrapante e bordas costuradas. 90 x 40 cm.',
        x: { 'Dimensões': '900 x 400 x 4 mm', 'Superfície': 'Microfibra speed', 'Base': 'Borracha natural', 'Borda': 'Costurada' } })
  ];

  /* ------------------------- índices e consultas ------------------------- */
  var byId = {}, bySlug = {}, byCat = {};
  products.forEach(function (pr) {
    byId[pr.id] = pr;
    bySlug[pr.slug] = pr;
    (byCat[pr.cat] = byCat[pr.cat] || []).push(pr);
  });
  var catById = {};
  categories.forEach(function (c) {
    catById[c.id] = c;
    c.count = (byCat[c.id] || []).length;
  });

  /** Marcas disponíveis, com contagem. */
  var brands = [];
  (function () {
    var m = {};
    products.forEach(function (p) { m[p.brand] = (m[p.brand] || 0) + 1; });
    brands = Object.keys(m).sort(function (a, b) { return m[b] - m[a]; })
      .map(function (k) { return { name: k, count: m[k] }; });
  })();

  var priceRange = (function () {
    var min = Infinity, max = 0;
    products.forEach(function (p) { min = Math.min(min, p.price); max = Math.max(max, p.price); });
    return { min: Math.floor(min), max: Math.ceil(max) };
  })();

  /** Consulta com filtros (usada pelo catálogo e pela busca). */
  function query(opts) {
    opts = opts || {};
    var out = products.slice();
    var q = (opts.q || '').trim().toLowerCase();

    if (opts.cat) out = out.filter(function (p) { return p.cat === opts.cat; });
    if (opts.brands && opts.brands.length) {
      out = out.filter(function (p) { return opts.brands.indexOf(p.brand) !== -1; });
    }
    if (opts.minPrice != null) out = out.filter(function (p) { return p.price >= opts.minPrice; });
    if (opts.maxPrice != null) out = out.filter(function (p) { return p.price <= opts.maxPrice; });
    if (opts.minRating) out = out.filter(function (p) { return p.rating >= opts.minRating; });
    if (opts.onSale) out = out.filter(function (p) { return p.old > 0; });
    if (opts.inStock) out = out.filter(function (p) { return p.stock > 0; });
    if (opts.ids) out = out.filter(function (p) { return opts.ids.indexOf(p.id) !== -1; });
    if (opts.tags && opts.tags.length) {
      out = out.filter(function (p) {
        return opts.tags.some(function (t) { return p.tags.indexOf(t) !== -1; });
      });
    }
    if (q) {
      out = out.filter(function (p) {
        var hay = (p.name + ' ' + p.brand + ' ' + p.desc + ' ' + p.tags.join(' ') + ' ' +
          (catById[p.cat] ? catById[p.cat].name : '')).toLowerCase();
        return q.split(/\s+/).every(function (term) { return hay.indexOf(term) !== -1; });
      });
    }

    var sort = opts.sort || 'relevance';
    var SORTERS = {
      relevance: function (a, b) { return (b.isBest ? 1 : 0) - (a.isBest ? 1 : 0) || b.rating - a.rating; },
      price_asc: function (a, b) { return a.price - b.price; },
      price_desc: function (a, b) { return b.price - a.price; },
      rating: function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; },
      reviews: function (a, b) { return b.reviews - a.reviews; },
      name: function (a, b) { return a.name.localeCompare(b.name, 'pt-BR'); },
      newest: function (a, b) { return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || b.rating - a.rating; },
      discount: function (a, b) { return F.discount(b.old, b.price) - F.discount(a.old, a.price); }
    };
    out.sort(SORTERS[sort] || SORTERS.relevance);
    return out;
  }

  /** Produtos relacionados: mesma categoria, depois mesma marca. */
  function related(prod, n) {
    n = n || 4;
    var same = byCat[prod.cat].filter(function (p) { return p.id !== prod.id; });
    var others = products.filter(function (p) { return p.id !== prod.id && p.cat !== prod.cat; });
    var pool = same.concat(others).sort(function (a, b) {
      var sa = (a.cat === prod.cat ? 2 : 0) + (a.brand === prod.brand ? 1 : 0);
      var sb = (b.cat === prod.cat ? 2 : 0) + (b.brand === prod.brand ? 1 : 0);
      return sb - sa;
    });
    return pool.slice(0, n);
  }

  /** Sugestões de busca (nomes + marcas + categorias). */
  function suggest(term, n) {
    n = n || 8;
    var t = term.trim().toLowerCase();
    if (!t) {
      return products.slice().sort(function (a, b) { return b.reviews - a.reviews; }).slice(0, n);
    }
    var hits = [], seen = {};
    function add(item, score) {
      if (seen[item.key]) return;
      seen[item.key] = 1;
      hits.push({ item: item, score: score });
    }
    products.forEach(function (p) {
      var ln = p.name.toLowerCase();
      var pos = ln.indexOf(t);
      if (pos === 0) add({ key: 'p' + p.id, type: 'product', product: p }, 3);
      else if (pos > 0) add({ key: 'p' + p.id, type: 'product', product: p }, 2);
      else if (p.brand.toLowerCase().indexOf(t) === 0) add({ key: 'p' + p.id, type: 'product', product: p }, 1);
    });
    categories.forEach(function (c) {
      if (c.name.toLowerCase().indexOf(t) !== -1) add({ key: 'c' + c.id, type: 'category', category: c }, 2.5);
    });
    brands.forEach(function (b) {
      if (b.name.toLowerCase().indexOf(t) === 0) add({ key: 'b' + b.name, type: 'brand', brand: b.name }, 1.5);
    });
    hits.sort(function (a, b) { return b.score - a.score; });
    return hits.slice(0, n).map(function (h) { return h.item; });
  }

  /** Conta quantos produtos casam com cada faceta (para os filtros). */
  function facetCounts(opts) {
    var base = query(opts);
    var out = { brands: {}, cats: {}, ratings: [0, 0, 0, 0] };
    base.forEach(function (p) {
      out.brands[p.brand] = (out.brands[p.brand] || 0) + 1;
      out.cats[p.cat] = (out.cats[p.cat] || 0) + 1;
      var i = Math.floor(p.rating) - 2;
      if (i >= 0 && i < 4) out.ratings[i] += 1;
    });
    return out;
  }

  VT.catalog = {
    categories: categories,
    catById: catById,
    products: products,
    brands: brands,
    priceRange: priceRange,
    byId: byId,
    bySlug: bySlug,
    byCat: byCat,
    query: query,
    related: related,
    suggest: suggest,
    facetCounts: facetCounts
  };
})(window);
