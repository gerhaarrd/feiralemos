/** Número no formato brasileiro (vírgula decimal, ponto de milhar). */
export function br(n: number, casas = 0): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}
