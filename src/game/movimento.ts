// Movimento lateral do astronauta na cabine (funções puras).

export interface ConfigMovimento {
  /** unidades do viewBox por segundo */
  velocidade: number;
  minX: number;
  maxX: number;
}

export interface ResultadoPasso {
  x: number;
  /** -1 esquerda, 1 direita, 0 parado */
  direcao: -1 | 0 | 1;
  /** true no quadro em que o alvo (clique) foi alcançado */
  chegou: boolean;
}

export function limitar(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}

/**
 * Avança um quadro. Teclas têm prioridade; sem teclas, anda em direção ao
 * alvo definido por clique (se houver).
 */
export function passoMovimento(
  x: number,
  direcaoTeclas: -1 | 0 | 1,
  alvo: number | null,
  dt: number,
  cfg: ConfigMovimento,
): ResultadoPasso {
  const passo = cfg.velocidade * dt;

  if (direcaoTeclas !== 0) {
    return { x: limitar(x + direcaoTeclas * passo, cfg.minX, cfg.maxX), direcao: direcaoTeclas, chegou: false };
  }
  if (alvo === null) return { x, direcao: 0, chegou: false };

  const destino = limitar(alvo, cfg.minX, cfg.maxX);
  const delta = destino - x;
  if (Math.abs(delta) <= passo) return { x: destino, direcao: 0, chegou: true };
  const direcao = delta > 0 ? 1 : -1;
  return { x: x + direcao * passo, direcao, chegou: false };
}

/** Item mais próximo de x dentro do alcance, ou null. */
export function maisProximo<T extends { x: number }>(x: number, itens: T[], alcance: number): T | null {
  let melhor: T | null = null;
  let menor = alcance;
  for (const item of itens) {
    const d = Math.abs(item.x - x);
    if (d <= menor) {
      menor = d;
      melhor = item;
    }
  }
  return melhor;
}
