// Fórmulas didáticas usadas nas fases. Funções puras, unidades SI salvo indicação.
// São modelos simplificados: os cálculos reais da NASA eram muito mais complexos.

export const G_TERRA = 9.81; // m/s²
export const G_LUA = 1.62; // m/s²
export const DISTANCIA_TERRA_LUA_KM = 384_400;
export const MASSA_SATURN_V_KG = 2_900_000;

/** 2ª lei de Newton: a = F / m. */
export function aceleracao(forcaN: number, massaKg: number): number {
  if (massaKg <= 0) throw new RangeError('massa deve ser positiva');
  return forcaN / massaKg;
}

/** Velocidade média: vm = Δs / Δt. */
export function velocidadeMedia(distancia: number, tempo: number): number {
  if (tempo <= 0) throw new RangeError('tempo deve ser positivo');
  return distancia / tempo;
}

/** Peso: P = m · g. */
export function peso(massaKg: number, g: number): number {
  return massaKg * g;
}
