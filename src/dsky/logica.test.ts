import { describe, expect, it } from 'vitest';
import { DSKY_INICIAL, formatarDigitacao, formatarRegistro, teclar, type Comando, type EstadoDsky, type Tecla } from './logica';

const catalogo = { '62': { editavel: true }, '36': { editavel: false } };

function digitar(teclas: Tecla[], inicial: EstadoDsky = DSKY_INICIAL) {
  let estado = inicial;
  const comandos: Comando[] = [];
  for (const t of teclas) {
    const r = teclar(estado, t, catalogo);
    estado = r.estado;
    if (r.comando) comandos.push(r.comando);
  }
  return { estado, comandos };
}

describe('DSKY', () => {
  it('V16 N36 ENTRA monitora o substantivo', () => {
    const { estado, comandos } = digitar(['VERBO', '1', '6', 'SUBST', '3', '6', 'ENTRA']);
    expect(estado.monitorando).toBe('36');
    expect(estado.erro).toBe(false);
    expect(comandos).toEqual([{ tipo: 'MONITORAR', substantivo: '36' }]);
  });

  it('V21 N62 ENTRA 35100 ENTRA carrega o valor e passa a monitorar', () => {
    const meio = digitar(['VERBO', '2', '1', 'SUBST', '6', '2', 'ENTRA']);
    expect(meio.estado).toMatchObject({ entrada: 'dado', carregando: '62' });
    const fim = digitar(['3', '5', '1', '0', '0', 'ENTRA'], meio.estado);
    expect(fim.comandos).toEqual([{ tipo: 'CARREGAR', substantivo: '62', valor: 35100 }]);
    expect(fim.estado).toMatchObject({ entrada: 'nenhuma', carregando: null, monitorando: '62' });
  });

  it('aceita sinal negativo e LIMPA durante a digitação', () => {
    const meio = digitar(['VERBO', '2', '1', 'SUBST', '6', '2', 'ENTRA', '9', '9', 'LIMPA', '-', '4', '2']);
    expect(meio.estado).toMatchObject({ sinal: '-', dado: '42' });
    expect(digitar(['ENTRA'], meio.estado).comandos[0]).toMatchObject({ valor: -42 });
  });

  it('acende ERRO OPER em comando inválido e REINIC apaga', () => {
    expect(digitar(['VERBO', '9', '9', 'ENTRA']).estado.erro).toBe(true);
    expect(digitar(['VERBO', '1', '6', 'SUBST', '7', '7', 'ENTRA']).estado.erro).toBe(true);
    // substantivo só de leitura não aceita carga
    expect(digitar(['VERBO', '2', '1', 'SUBST', '3', '6', 'ENTRA']).estado.erro).toBe(true);
    // dígito sem campo ativo
    expect(digitar(['5']).estado.erro).toBe(true);
    expect(digitar(['5', 'REINIC']).estado.erro).toBe(false);
  });

  it('V35 liga o teste de luzes; a próxima tecla desliga', () => {
    const { estado } = digitar(['VERBO', '3', '5', 'ENTRA']);
    expect(estado.teste).toBe(true);
    expect(digitar(['REINIC'], estado).estado.teste).toBe(false);
  });

  it('formata registros com sinal e 5 dígitos', () => {
    expect(formatarRegistro(35100)).toBe('+35100');
    expect(formatarRegistro(-42)).toBe('-00042');
    expect(formatarRegistro(1234567)).toBe('+99999');
    expect(formatarRegistro(null)).toBe('_     ');
    expect(formatarDigitacao('+', '35')).toBe('+35   ');
  });
});
