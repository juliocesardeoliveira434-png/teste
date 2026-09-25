/* ============================================================
   VITRINE PRO — cep.js
   Consulta de CEP. Nesta versão de demonstração os dados são
   gerados localmente (determinísticos) para funcionar offline.
   Em produção: troque `lookup()` por fetch('https://viacep.com.br/ws/'+cep+'/json/').
   ============================================================ */
(function (w) {
  'use strict';
  var VT = w.VT = w.VT || {};

  /* cidades por faixa de CEP (amostra) */
  var CITY_BY_PREFIX = {
    '01': ['São Paulo', 'SP'], '02': ['São Paulo', 'SP'], '08': ['São Paulo', 'SP'],
    '13': ['Campinas', 'SP'], '15': ['Sorocaba', 'SP'], '18': ['Presidente Prudente', 'SP'],
    '20': ['Rio de Janeiro', 'RJ'], '24': ['Niterói', 'RJ'], '29': ['Vitória', 'ES'],
    '30': ['Belo Horizonte', 'MG'], '31': ['Belo Horizonte', 'MG'], '34': ['Uberlândia', 'MG'],
    '38': ['Uberaba', 'MG'], '384': ['Uberlândia', 'MG'], '3840': ['Uberlândia', 'MG'],
    '40': ['Salvador', 'BA'], '49': ['Aracaju', 'SE'],
    '50': ['Recife', 'PE'], '57': ['Maceió', 'AL'], '58': ['João Pessoa', 'PB'],
    '59': ['Natal', 'RN'], '60': ['Fortaleza', 'CE'], '64': ['Teresina', 'PI'],
    '65': ['São Luís', 'MA'], '66': ['Belém', 'PA'], '69': ['Manaus', 'AM'],
    '70': ['Brasília', 'DF'], '74': ['Goiânia', 'GO'], '78': ['Cuiabá', 'MT'],
    '79': ['Campo Grande', 'MS'], '80': ['Curitiba', 'PR'], '86': ['Londrina', 'PR'],
    '88': ['Florianópolis', 'SC'], '90': ['Porto Alegre', 'RS'], '95': ['Caxias do Sul', 'RS'],
    '38.4': ['Uberlândia', 'MG']
  };

  var LOGRADOUROS = ['Rua das Acácias', 'Avenida Brasil', 'Rua Professor Alceu Alves', 'Avenida Afonso Pena',
    'Rua Bahia', 'Avenida Paulista', 'Rua XV de Novembro', 'Travessa das Flores', 'Alameda Santos',
    'Rua Paraná', 'Rua Sergipe', 'Avenida João Naves de Ávila', 'Rua Duque de Caxias', 'Praça da Matriz'];
  var BAIRROS = ['Centro', 'Jardim América', 'Vila Mariana', 'Santa Mônica', 'Boa Vista', 'Laranjeiras',
    'Bela Vista', 'Vila Nova', 'Jardim Europa', 'Centro Sul', 'Bairro Industrial', 'Parque das Nações'];

  /**
   * Consulta um CEP.
   * @param {string} cep
   * @returns {Promise<object>} endereço { cep, logradouro, bairro, cidade, uf, regiao, ddd }
   */
  function lookup(cep) {
    var d = String(cep || '').replace(/\D+/g, '');
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (d.length !== 8) {
          reject(new Error('CEP incompleto'));
          return;
        }
        var r = VT.rng('cep-' + d);
        var city = CITY_BY_PREFIX[d.slice(0, 4)] || CITY_BY_PREFIX[d.slice(0, 3)] ||
          CITY_BY_PREFIX[d.slice(0, 2)] || ['São Paulo', 'SP'];
        var region = VT.shipping.regionOf(d);
        resolve({
          cep: d.slice(0, 5) + '-' + d.slice(3 + 2),
          logradouro: r.pick(LOGRADOUROS),
          bairro: r.pick(BAIRROS),
          cidade: city[0],
          uf: city[1],
          regiao: region ? region.name : 'Brasil',
          ddd: r.pick(['11', '21', '31', '34', '41', '48', '51', '62', '71', '81', '85', '92']),
          numero: String(r.int(10, 1899)),
          complemento: ''
        });
      }, 420 + Math.random() * 380);
    });
  }

  /** Lista de CEPs válidos para o autocomplete de testes. */
  function samples() {
    return [
      { cep: '38400-100', label: 'Uberlândia / MG — Centro' },
      { cep: '01310-100', label: 'São Paulo / SP — Av. Paulista' },
      { cep: '20040-020', label: 'Rio de Janeiro / RJ — Centro' },
      { cep: '30130-010', label: 'Belo Horizonte / MG — Centro' },
      { cep: '80010-000', label: 'Curitiba / PR — Centro' },
      { cep: '90010-150', label: 'Porto Alegre / RS — Centro' }
    ];
  }

  VT.cep = { lookup: lookup, samples: samples };
})(window);
