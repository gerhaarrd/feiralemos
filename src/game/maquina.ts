// Máquina de estados do jogo: função pura (estado, ação) -> estado.

export type Tela = 'inicio' | 'missao' | 'fim';
/**
 * cabine = andando; tarefa = painel da fase aberto; dsky = DSKY aberto fora da
 * tarefa (consulta livre); concluida = aguardando avançar.
 */
export type StatusFase = 'cabine' | 'tarefa' | 'dsky' | 'concluida';

export interface EstadoJogo {
  tela: Tela;
  indiceFase: number;
  status: StatusFase;
  /** Muda a cada (re)início de fase; usado como `key` para remontar a cena do zero. */
  tentativa: number;
}

export type Acao =
  | { tipo: 'INICIAR_MISSAO' }
  | { tipo: 'ABRIR_TAREFA' }
  | { tipo: 'ABRIR_DSKY' }
  | { tipo: 'FECHAR_PAINEL' }
  | { tipo: 'CONCLUIR_TAREFA' }
  | { tipo: 'PROXIMA_FASE' }
  | { tipo: 'PULAR_FASE' }
  | { tipo: 'REINICIAR_FASE' }
  | { tipo: 'REINICIAR_MISSAO' }
  | { tipo: 'IR_PARA_FASE'; indice: number };

export const ESTADO_INICIAL: EstadoJogo = {
  tela: 'inicio',
  indiceFase: 0,
  status: 'cabine',
  tentativa: 0,
};

function entrarNaFase(e: EstadoJogo, indice: number): EstadoJogo {
  return { tela: 'missao', indiceFase: indice, status: 'cabine', tentativa: e.tentativa + 1 };
}

function avancar(e: EstadoJogo, totalFases: number): EstadoJogo {
  if (e.indiceFase >= totalFases - 1) return { ...e, tela: 'fim', status: 'cabine' };
  return entrarNaFase(e, e.indiceFase + 1);
}

export function criarRedutor(totalFases: number) {
  return function reduzir(e: EstadoJogo, a: Acao): EstadoJogo {
    const emMissao = e.tela === 'missao';
    switch (a.tipo) {
      case 'INICIAR_MISSAO':
        return entrarNaFase(e, 0);
      case 'ABRIR_TAREFA':
        return emMissao && e.status === 'cabine' ? { ...e, status: 'tarefa' } : e;
      case 'ABRIR_DSKY':
        return emMissao && e.status === 'cabine' ? { ...e, status: 'dsky' } : e;
      case 'FECHAR_PAINEL':
        return emMissao && (e.status === 'tarefa' || e.status === 'dsky') ? { ...e, status: 'cabine' } : e;
      case 'CONCLUIR_TAREFA':
        return emMissao && e.status === 'tarefa' ? { ...e, status: 'concluida' } : e;
      case 'PROXIMA_FASE':
        return emMissao && e.status === 'concluida' ? avancar(e, totalFases) : e;
      case 'PULAR_FASE':
        return emMissao ? avancar(e, totalFases) : e;
      case 'REINICIAR_FASE':
        return emMissao ? entrarNaFase(e, e.indiceFase) : e;
      case 'REINICIAR_MISSAO':
        return { ...ESTADO_INICIAL, tentativa: e.tentativa + 1 };
      case 'IR_PARA_FASE':
        return a.indice >= 0 && a.indice < totalFases ? entrarNaFase(e, a.indice) : e;
    }
  };
}
