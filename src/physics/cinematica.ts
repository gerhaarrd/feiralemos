// Movimento uniformemente variado (aceleração constante). Unidades SI.

/** v = v₀ + a·t */
export function velocidade(v0: number, a: number, t: number): number {
  return v0 + a * t;
}

/** Δs = v₀·t + a·t²/2 */
export function deslocamento(v0: number, a: number, t: number): number {
  return v0 * t + 0.5 * a * t * t;
}

/** Torricelli: v² = v₀² + 2·a·Δs. Devolve |v| (0 se o corpo para antes). */
export function velocidadeTorricelli(v0: number, a: number, ds: number): number {
  const v2 = v0 * v0 + 2 * a * ds;
  return v2 <= 0 ? 0 : Math.sqrt(v2);
}

/** Torricelli resolvida para a: desaceleração constante que leva de v₀ a 0 na distância Δs. */
export function aceleracaoParaParar(v0: number, ds: number): number {
  return ds > 0 ? (v0 * v0) / (2 * ds) : Infinity;
}
