import { G_TERRA, aceleracao } from './formulas';

/** Empuxo real aproximado do 1º estágio do Saturn V na decolagem. */
export const EMPUXO_SATURN_V_KN = 35_100;
export const EMPUXO_MAXIMO_KN = 40_000;

/**
 * Aceleração de subida na decolagem: o empuxo acelera o foguete (F/m) e a
 * gravidade puxa de volta (g). Só sobe se o resultado for positivo.
 */
export function aceleracaoDeSubida(empuxoN: number, massaKg: number, g = G_TERRA): number {
  return aceleracao(empuxoN, massaKg) - g;
}
