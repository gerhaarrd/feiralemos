// Modelo didático do pouso do Eagle: movimento vertical com empuxo regulável,
// deslocamento lateral simples e combustível limitado.

import { deslocamento, velocidade } from './cinematica';
import { G_LUA } from './formulas';

export const POUSO = {
  g: G_LUA,
  /** Aceleração do motor de descida com empuxo total (m/s²). */
  aMotorMax: 4.2,
  /** Fração do tanque gasta por segundo com empuxo total. */
  consumoMax: 0.03,
  /** Aceleração lateral ao inclinar o módulo (m/s²). */
  aLateral: 9,
  /** O piloto automático de atitude freia aos poucos o movimento lateral (1/s). */
  amortecimentoLateral: 0.8,
  h0: 120,
  /** Teto da simulação: acima disso o computador não deixa subir. */
  hMax: 165,
  v0: -6,
  combustivel0: 1,
  /** Limites para um pouso suave (m/s). */
  vPousoMax: 4,
  vxPousoMax: 3,
  xMin: -60,
  xMax: 170,
  /** Faixa plana e sem pedras. Fora dela: cratera e rochas. */
  zonaSegura: [28, 165] as readonly [number, number],
  /** Instante (s) em que soa o alarme 1202 e o piloto pode assumir. */
  tAlarme: 3.5,
} as const;

export type ResultadoPouso = 'pousou' | 'colisao' | 'tombou' | 'area-insegura';

export interface EstadoPouso {
  t: number;
  /** Altitude (m). */
  h: number;
  /** Velocidade vertical (m/s); negativa = descendo. */
  v: number;
  /** Posição e velocidade laterais (m, m/s). */
  x: number;
  vx: number;
  /** Fração do tanque, 0 a 1. */
  combustivel: number;
  /** Empuxo aplicado no último passo, 0 a 1. */
  empuxo: number;
  modo: 'auto' | 'manual';
  resultado: ResultadoPouso | null;
}

export interface ComandoPouso {
  /** Empuxo pedido pelo piloto, 0 a 1 (ignorado no modo automático). */
  empuxo: number;
  lateral: -1 | 0 | 1;
}

export function estadoInicialPouso(): EstadoPouso {
  return {
    t: 0,
    h: POUSO.h0,
    v: POUSO.v0,
    x: 0,
    vx: 0,
    combustivel: POUSO.combustivel0,
    empuxo: 0,
    modo: 'auto',
    resultado: null,
  };
}

const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Aceleração vertical resultante: motor para cima, gravidade lunar para baixo. */
export function aceleracaoVertical(empuxo: number): number {
  return empuxo * POUSO.aMotorMax - POUSO.g;
}

/** Velocidade de descida confortável para cada altitude: mais devagar perto do solo. */
export function velocidadeSegura(h: number): number {
  return -Math.max(2, h / 20);
}

/** Piloto automático: segue a velocidade de descida segura. */
export function empuxoAutomatico(h: number, v: number): number {
  const vAlvo = velocidadeSegura(h);
  return limitar((POUSO.g + 1.2 * (vAlvo - v)) / POUSO.aMotorMax, 0, 1);
}

export function avaliarPouso(v: number, vx: number, x: number): ResultadoPouso {
  if (Math.abs(v) > POUSO.vPousoMax) return 'colisao';
  if (Math.abs(vx) > POUSO.vxPousoMax) return 'tombou';
  if (x < POUSO.zonaSegura[0] || x > POUSO.zonaSegura[1]) return 'area-insegura';
  return 'pousou';
}

export function assumirControle(e: EstadoPouso): EstadoPouso {
  return e.resultado ? e : { ...e, modo: 'manual' };
}

/** Avança a simulação em dt segundos. */
export function passoPouso(e: EstadoPouso, cmd: ComandoPouso, dt: number): EstadoPouso {
  if (e.resultado) return e;

  const temCombustivel = e.combustivel > 0;
  const manual = e.modo === 'manual';
  const empuxo = !temCombustivel ? 0 : manual ? limitar(cmd.empuxo, 0, 1) : empuxoAutomatico(e.h, e.v);
  const lateral = manual && temCombustivel ? cmd.lateral : 0;

  const a = aceleracaoVertical(empuxo);
  let v = velocidade(e.v, a, dt);
  let h = e.h + deslocamento(e.v, a, dt);
  if (h > POUSO.hMax) {
    h = POUSO.hMax;
    v = Math.min(v, 0);
  }

  const ax = lateral * POUSO.aLateral - e.vx * POUSO.amortecimentoLateral;
  let vx = e.vx + ax * dt;
  let x = e.x + vx * dt;
  if (x < POUSO.xMin || x > POUSO.xMax) {
    x = limitar(x, POUSO.xMin, POUSO.xMax);
    vx = 0;
  }

  const proximo: EstadoPouso = {
    ...e,
    t: e.t + dt,
    h,
    v,
    x,
    vx,
    empuxo,
    combustivel: Math.max(0, e.combustivel - empuxo * POUSO.consumoMax * dt),
  };
  if (h <= 0) return { ...proximo, h: 0, resultado: avaliarPouso(v, vx, x) };
  return proximo;
}
