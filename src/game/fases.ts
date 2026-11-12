// Dados das fases e dos módulos. Nada de UI aqui.

export type ModuloId = 'columbia' | 'eagle';
export type EstacaoId = 'dsky' | 'navegacao' | 'propulsao' | 'controles' | 'bancada';
export type VistaJanela = 'plataforma' | 'terra' | 'lua' | 'superficie' | 'retorno';

export interface Estacao {
  id: EstacaoId;
  rotulo: string;
  /** Centro do painel, em unidades do viewBox da cabine (0–1280). */
  x: number;
}

export interface Modulo {
  id: ModuloId;
  nome: string;
  placa: string;
  estacoes: Estacao[];
  janelaX: number;
  /** Onde o astronauta começa. */
  entradaX: number;
}

export interface Fase {
  id: 'lancamento' | 'viagem' | 'pouso' | 'gravidade' | 'retorno';
  titulo: string;
  formula: string;
  /** Programa do computador de bordo mostrado no campo PROG do DSKY. */
  programa: string;
  modulo: ModuloId;
  /** Painel onde a tarefa da fase acontece. */
  estacao: EstacaoId;
  objetivo: string;
  /** Curiosidade histórica mostrada ao concluir a fase. */
  fato: string;
  janela: VistaJanela;
  /** false = astronauta flutua (sem peso aparente). */
  gravidade: boolean;
}

export const MODULOS: Record<ModuloId, Modulo> = {
  columbia: {
    id: 'columbia',
    nome: 'Columbia',
    placa: 'CSM-107 · COLUMBIA · MÓDULO DE COMANDO',
    janelaX: 800,
    entradaX: 400,
    estacoes: [
      { id: 'propulsao', rotulo: 'Propulsão', x: 240 },
      { id: 'dsky', rotulo: 'DSKY', x: 560 },
      { id: 'navegacao', rotulo: 'Navegação', x: 1040 },
    ],
  },
  eagle: {
    id: 'eagle',
    nome: 'Eagle',
    placa: 'LM-5 · EAGLE · MÓDULO LUNAR',
    janelaX: 480,
    entradaX: 860,
    estacoes: [
      { id: 'controles', rotulo: 'Controles de descida', x: 240 },
      { id: 'dsky', rotulo: 'DSKY', x: 720 },
      { id: 'bancada', rotulo: 'Bancada de amostras', x: 1040 },
    ],
  },
};

export const FASES: Fase[] = [
  {
    id: 'lancamento',
    titulo: 'Lançamento',
    formula: 'F = m · a',
    programa: '11',
    modulo: 'columbia',
    estacao: 'dsky',
    objetivo: 'Vá até o DSKY e ajuste o empuxo do Saturn V.',
    fato: 'Na decolagem, o Saturn V queimava cerca de 13 toneladas de combustível por segundo.',
    janela: 'plataforma',
    gravidade: true,
  },
  {
    id: 'viagem',
    titulo: 'Viagem Terra–Lua',
    formula: 'vm = Δs / Δt',
    programa: '23',
    modulo: 'columbia',
    estacao: 'navegacao',
    objetivo: 'Vá até a mesa de navegação e calcule a velocidade média.',
    fato: 'A viagem real até a órbita da Lua levou cerca de 76 horas: pouco mais de três dias.',
    janela: 'terra',
    gravidade: false,
  },
  {
    id: 'pouso',
    titulo: 'Pouso do Eagle',
    formula: 'v = v₀ + a · t',
    programa: '63',
    modulo: 'eagle',
    estacao: 'controles',
    objetivo: 'Assuma os controles de descida e pouse suavemente.',
    fato: 'Armstrong pousou com cerca de 25 segundos de combustível. O alarme 1202 era o computador avisando que tinha tarefas demais.',
    janela: 'lua',
    gravidade: true,
  },
  {
    id: 'gravidade',
    titulo: 'Gravidade lunar',
    formula: 'P = m · g',
    programa: '68',
    modulo: 'eagle',
    estacao: 'bancada',
    objetivo: 'Vá até a bancada de amostras e compare os pesos.',
    fato: 'A Apollo 11 trouxe 21,5 kg de rochas lunares. Na Lua, elas pesavam o mesmo que 3,5 kg pesam aqui.',
    janela: 'superficie',
    gravidade: true,
  },
  {
    id: 'retorno',
    titulo: 'Decolagem e retorno',
    formula: 'θ de reentrada',
    programa: '12',
    modulo: 'columbia',
    estacao: 'dsky',
    objetivo: 'Use o DSKY para decolar da Lua e acertar a reentrada na Terra.',
    fato: 'A cápsula entrou na atmosfera a cerca de 11 km/s e pousou no Pacífico em 24 de julho de 1969.',
    janela: 'retorno',
    gravidade: false,
  },
];

export function estacaoDaFase(fase: Fase): Estacao {
  const estacao = MODULOS[fase.modulo].estacoes.find((e) => e.id === fase.estacao);
  if (!estacao) throw new Error(`Fase ${fase.id}: estação ${fase.estacao} não existe em ${fase.modulo}`);
  return estacao;
}
