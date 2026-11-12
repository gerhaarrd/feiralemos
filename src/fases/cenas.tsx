import type { ComponentType } from 'react';
import type { Substantivo } from '../dsky/Dsky';
import type { Fase } from '../game/fases';
import { Fase1Lancamento } from './Fase1Lancamento';
import { Fase2Viagem } from './Fase2Viagem';
import { Fase3Pouso } from './Fase3Pouso';
import { Fase4Gravidade } from './Fase4Gravidade';
import { Fase5Retorno } from './Fase5Retorno';

/** Contrato de toda cena de fase: recebe a fase e avisa quando a tarefa termina. */
export interface PropsCena {
  fase: Fase;
  /** Substantivos do DSKY disponíveis em qualquer fase (ex.: relógio da missão). */
  substantivosGerais: Substantivo[];
  aoConcluir: () => void;
}

/** Um componente por fase. */
export const CENAS: Record<Fase['id'], ComponentType<PropsCena>> = {
  lancamento: Fase1Lancamento,
  viagem: Fase2Viagem,
  pouso: Fase3Pouso,
  gravidade: Fase4Gravidade,
  retorno: Fase5Retorno,
};
