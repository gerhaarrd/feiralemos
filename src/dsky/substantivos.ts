import type { Substantivo } from './Dsky';

/** Substantivo 36: relógio da missão (tempo desde o início do jogo). */
export function criarRelogio(inicioMs: () => number): Substantivo {
  return {
    codigo: '36',
    nome: 'Relógio da missão',
    registros: ['horas', 'minutos', 'segundos × 100'],
    ler: () => {
      const s = Math.max(0, (performance.now() - inicioMs()) / 1000);
      return [Math.floor(s / 3600), Math.floor(s / 60) % 60, Math.floor((s % 60) * 100)];
    },
  };
}
