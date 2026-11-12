import { describe, expect, it } from 'vitest';
import { aceleracaoParaParar, deslocamento, velocidade, velocidadeTorricelli } from './cinematica';
import { MASSA_SATURN_V_KG } from './formulas';
import { EMPUXO_SATURN_V_KN, aceleracaoDeSubida } from './lancamento';
import {
  POUSO,
  assumirControle,
  avaliarPouso,
  empuxoAutomatico,
  estadoInicialPouso,
  passoPouso,
  type ComandoPouso,
  type EstadoPouso,
} from './pouso';
import { A_SUBIDA, avaliarOrbita, avaliarReentrada, velocidadeDeDescida } from './retorno';

const DT = 1 / 60;

function simular(politica: (e: EstadoPouso) => ComandoPouso, assumirEm = Infinity): EstadoPouso {
  let e = estadoInicialPouso();
  for (let i = 0; i < 60 * 120 && !e.resultado; i++) {
    if (e.modo === 'auto' && e.t >= assumirEm) e = assumirControle(e);
    e = passoPouso(e, politica(e), DT);
  }
  return e;
}

describe('cinemática', () => {
  it('v = v₀ + a·t e Δs = v₀·t + a·t²/2', () => {
    expect(velocidade(-10, 2, 3)).toBe(-4);
    expect(deslocamento(-10, 2, 3)).toBe(-21);
  });
  it('Torricelli: queda livre de 10 m na Lua a partir do repouso', () => {
    expect(velocidadeTorricelli(0, 1.62, 10)).toBeCloseTo(5.69, 2);
    expect(aceleracaoParaParar(10, 25)).toBe(2);
  });
});

describe('lançamento', () => {
  it('o Saturn V real sobe a ~2,3 m/s²; empuxo fraco não decola', () => {
    expect(aceleracaoDeSubida(EMPUXO_SATURN_V_KN * 1000, MASSA_SATURN_V_KG)).toBeCloseTo(2.29, 2);
    expect(aceleracaoDeSubida(20_000_000, MASSA_SATURN_V_KG)).toBeLessThan(0);
  });
});

describe('pouso', () => {
  it('sem assumir o controle, o computador pousa suave mas na cratera', () => {
    const fim = simular(() => ({ empuxo: 0, lateral: 0 }));
    expect(fim.resultado).toBe('area-insegura');
    expect(Math.abs(fim.v)).toBeLessThanOrEqual(POUSO.vPousoMax);
    expect(fim.t).toBeLessThan(50);
    expect(fim.combustivel).toBeGreaterThan(0.3);
  });

  it('assumindo o controle e desviando para a área plana, pousa', () => {
    const fim = simular(
      (e) => ({
        empuxo: empuxoAutomatico(e.h, e.v),
        lateral: e.x < 50 ? 1 : e.vx > 1.5 ? -1 : 0,
      }),
      POUSO.tAlarme + 1,
    );
    expect(fim.resultado).toBe('pousou');
    expect(fim.t).toBeLessThan(60);
  });

  it('motor desligado: bate forte', () => {
    const fim = simular(() => ({ empuxo: 0, lateral: 0 }), 0);
    expect(fim.resultado).toBe('colisao');
  });

  it('pairar gasta o tanque e depois cai', () => {
    const fim = simular((e) => ({ empuxo: e.v < 0 ? 1 : POUSO.g / POUSO.aMotorMax, lateral: 0 }), 0);
    expect(fim.combustivel).toBe(0);
    expect(fim.resultado).toBe('colisao');
  });

  it('chegar com muita velocidade lateral tomba o módulo', () => {
    expect(avaliarPouso(-1, POUSO.vxPousoMax + 1, 100)).toBe('tombou');
    expect(avaliarPouso(-1, 0, 0)).toBe('area-insegura');
    expect(avaliarPouso(-1, 0, 100)).toBe('pousou');
  });
});

describe('retorno', () => {
  it('queima de ~433 s leva à velocidade orbital', () => {
    expect(avaliarOrbita(velocidade(0, A_SUBIDA, 433))).toBe('ok');
    expect(avaliarOrbita(velocidade(0, A_SUBIDA, 300))).toBe('lento');
    expect(avaliarOrbita(velocidade(0, A_SUBIDA, 600))).toBe('rapido');
  });
  it('corredor de reentrada', () => {
    expect(avaliarReentrada(4)).toBe('ricocheteia');
    expect(avaliarReentrada(6.5)).toBe('ok');
    expect(avaliarReentrada(9)).toBe('ingreme');
    expect(velocidadeDeDescida(11_000, 6.5)).toBeCloseTo(1245, 0);
  });
});
