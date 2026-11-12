// Fase 5: decolagem da Lua (v = a·t) e ângulo de reentrada na Terra.

/** Velocidade para entrar em órbita lunar baixa (m/s). */
export const V_ORBITAL_LUA = 1_680;
/** Aceleração média do estágio de subida do Eagle (m/s²): ~1.680 m/s em ~435 s. */
export const A_SUBIDA = 3.88;
/** Tolerância aceita na velocidade final (fração). */
export const TOLERANCIA_ORBITA = 0.03;

/** Velocidade de chegada à atmosfera (m/s), cerca de 11 km/s. */
export const V_REENTRADA = 11_000;
/** Corredor de reentrada, em graus abaixo do horizonte (o real era 6,5° ± 1°). */
export const CORREDOR_REENTRADA: readonly [number, number] = [5.5, 7.5];

export type ResultadoOrbita = 'lento' | 'ok' | 'rapido';
export type ResultadoReentrada = 'ricocheteia' | 'ok' | 'ingreme';

export function avaliarOrbita(vFinal: number): ResultadoOrbita {
  if (vFinal < V_ORBITAL_LUA * (1 - TOLERANCIA_ORBITA)) return 'lento';
  if (vFinal > V_ORBITAL_LUA * (1 + TOLERANCIA_ORBITA)) return 'rapido';
  return 'ok';
}

export function avaliarReentrada(anguloGraus: number): ResultadoReentrada {
  if (anguloGraus < CORREDOR_REENTRADA[0]) return 'ricocheteia';
  if (anguloGraus > CORREDOR_REENTRADA[1]) return 'ingreme';
  return 'ok';
}

/** Componente da velocidade que aponta para baixo: v · sen θ. */
export function velocidadeDeDescida(v: number, anguloGraus: number): number {
  return v * Math.sin((anguloGraus * Math.PI) / 180);
}
