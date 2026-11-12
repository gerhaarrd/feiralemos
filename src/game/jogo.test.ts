import { describe, expect, it } from 'vitest';
import { FASES, estacaoDaFase } from './fases';
import { ESTADO_INICIAL, criarRedutor } from './maquina';
import { maisProximo, passoMovimento } from './movimento';
import { aceleracao, peso, velocidadeMedia, G_LUA, G_TERRA } from '../physics/formulas';

const reduzir = criarRedutor(3);
const cfg = { velocidade: 100, minX: 0, maxX: 500 };

describe('máquina de estados', () => {
  it('percorre uma fase: cabine -> tarefa -> concluída -> próxima', () => {
    let e = reduzir(ESTADO_INICIAL, { tipo: 'INICIAR_MISSAO' });
    expect(e).toMatchObject({ tela: 'missao', indiceFase: 0, status: 'cabine' });
    e = reduzir(e, { tipo: 'ABRIR_TAREFA' });
    expect(e.status).toBe('tarefa');
    e = reduzir(e, { tipo: 'CONCLUIR_TAREFA' });
    expect(e.status).toBe('concluida');
    e = reduzir(e, { tipo: 'PROXIMA_FASE' });
    expect(e).toMatchObject({ indiceFase: 1, status: 'cabine' });
  });

  it('não avança sem concluir, mas pular avança sempre', () => {
    const e = reduzir(ESTADO_INICIAL, { tipo: 'INICIAR_MISSAO' });
    expect(reduzir(e, { tipo: 'PROXIMA_FASE' })).toBe(e);
    expect(reduzir(e, { tipo: 'PULAR_FASE' }).indiceFase).toBe(1);
  });

  it('pular na última fase leva à tela final', () => {
    const e = reduzir(ESTADO_INICIAL, { tipo: 'IR_PARA_FASE', indice: 2 });
    expect(reduzir(e, { tipo: 'PULAR_FASE' }).tela).toBe('fim');
  });

  it('reiniciar fase volta para a cabine e muda a tentativa', () => {
    let e = reduzir(ESTADO_INICIAL, { tipo: 'INICIAR_MISSAO' });
    e = reduzir(e, { tipo: 'ABRIR_TAREFA' });
    const r = reduzir(e, { tipo: 'REINICIAR_FASE' });
    expect(r).toMatchObject({ indiceFase: 0, status: 'cabine' });
    expect(r.tentativa).toBeGreaterThan(e.tentativa);
  });

  it('DSKY livre abre e fecha sem concluir a fase', () => {
    let e = reduzir(ESTADO_INICIAL, { tipo: 'INICIAR_MISSAO' });
    e = reduzir(e, { tipo: 'ABRIR_DSKY' });
    expect(e.status).toBe('dsky');
    expect(reduzir(e, { tipo: 'CONCLUIR_TAREFA' })).toBe(e);
    expect(reduzir(e, { tipo: 'FECHAR_PAINEL' }).status).toBe('cabine');
  });

  it('ignora ações fora de contexto', () => {
    expect(reduzir(ESTADO_INICIAL, { tipo: 'ABRIR_TAREFA' })).toBe(ESTADO_INICIAL);
    expect(reduzir(ESTADO_INICIAL, { tipo: 'IR_PARA_FASE', indice: 9 })).toBe(ESTADO_INICIAL);
  });
});

describe('fases', () => {
  it('toda fase aponta para uma estação que existe no seu módulo', () => {
    for (const fase of FASES) expect(() => estacaoDaFase(fase)).not.toThrow();
  });
});

describe('movimento', () => {
  it('teclas movem e respeitam os limites', () => {
    expect(passoMovimento(100, 1, null, 0.5, cfg).x).toBe(150);
    expect(passoMovimento(10, -1, null, 0.5, cfg).x).toBe(0);
  });

  it('anda até o alvo do clique e avisa quando chega', () => {
    const a = passoMovimento(100, 0, 200, 0.5, cfg);
    expect(a).toEqual({ x: 150, direcao: 1, chegou: false });
    const b = passoMovimento(a.x, 0, 200, 0.5, cfg);
    expect(b).toEqual({ x: 200, direcao: 0, chegou: true });
  });

  it('alvo fora dos limites é alcançado na borda', () => {
    expect(passoMovimento(490, 0, 900, 0.5, cfg)).toEqual({ x: 500, direcao: 0, chegou: true });
  });

  it('acha o item mais próximo dentro do alcance', () => {
    const itens = [{ x: 100 }, { x: 300 }];
    expect(maisProximo(130, itens, 50)).toBe(itens[0]);
    expect(maisProximo(200, itens, 50)).toBeNull();
  });
});

describe('fórmulas', () => {
  it('exemplo do relatório: 384.400 km em 96 h ≈ 4.004 km/h', () => {
    expect(velocidadeMedia(384_400, 96)).toBeCloseTo(4004.17, 2);
  });
  it('a = F / m e P = m · g', () => {
    expect(aceleracao(29_000_000, 2_900_000)).toBeCloseTo(10);
    expect(peso(10, G_TERRA)).toBeCloseTo(98.1);
    expect(peso(10, G_LUA)).toBeCloseTo(16.2);
  });
});
