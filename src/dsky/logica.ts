// Lógica do DSKY (função pura). Modelo didático do teclado/visor do computador
// de bordo do Apollo: o operador digita VERBO (a ação) + SUBSTANTIVO (o dado).

export const DIGITOS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;
export type Digito = (typeof DIGITOS)[number];
export type Tecla = 'VERBO' | 'SUBST' | 'ENTRA' | 'LIMPA' | 'REINIC' | '+' | '-' | Digito;

export const VERBO_MONITORAR = '16';
export const VERBO_CARREGAR = '21';
export const VERBO_TESTE = '35';

/** O que a lógica precisa saber de cada substantivo disponível. */
export type Catalogo = Record<string, { editavel: boolean }>;

export type Comando =
  | { tipo: 'MONITORAR'; substantivo: string }
  | { tipo: 'CARREGAR'; substantivo: string; valor: number };

export interface EstadoDsky {
  verbo: string;
  substantivo: string;
  /** Campo que está recebendo dígitos. */
  entrada: 'nenhuma' | 'verbo' | 'substantivo' | 'dado';
  /** Dado em digitação: sinal + até 5 dígitos. */
  sinal: '+' | '-';
  dado: string;
  /** Substantivo cujos valores aparecem nos registros. */
  monitorando: string | null;
  /** Substantivo aguardando um valor (verbo 21). */
  carregando: string | null;
  /** Lâmpada ERRO OPER. */
  erro: boolean;
  /** Teste de luzes (verbo 35). */
  teste: boolean;
}

export const DSKY_INICIAL: EstadoDsky = {
  verbo: '',
  substantivo: '',
  entrada: 'nenhuma',
  sinal: '+',
  dado: '',
  monitorando: null,
  carregando: null,
  erro: false,
  teste: false,
};

const ehDigito = (t: Tecla): t is Digito => (DIGITOS as readonly string[]).includes(t);

function executar(e: EstadoDsky, catalogo: Catalogo): { estado: EstadoDsky; comando: Comando | null } {
  const base: EstadoDsky = { ...e, entrada: 'nenhuma', carregando: null };
  const falha = { estado: { ...base, erro: true }, comando: null };

  if (e.verbo === VERBO_TESTE) return { estado: { ...base, teste: true }, comando: null };

  const info = catalogo[e.substantivo];
  if (e.verbo === VERBO_MONITORAR) {
    if (!info) return falha;
    return {
      estado: { ...base, monitorando: e.substantivo },
      comando: { tipo: 'MONITORAR', substantivo: e.substantivo },
    };
  }
  if (e.verbo === VERBO_CARREGAR) {
    if (!info?.editavel) return falha;
    return {
      estado: { ...base, entrada: 'dado', carregando: e.substantivo, sinal: '+', dado: '' },
      comando: null,
    };
  }
  return falha;
}

export function teclar(
  anterior: EstadoDsky,
  tecla: Tecla,
  catalogo: Catalogo,
): { estado: EstadoDsky; comando: Comando | null } {
  // Qualquer tecla encerra o teste de luzes.
  const e: EstadoDsky = anterior.teste ? { ...anterior, teste: false } : anterior;
  const so = (estado: EstadoDsky) => ({ estado, comando: null });

  if (tecla === 'REINIC') return so({ ...e, erro: false });
  if (tecla === 'VERBO') return so({ ...e, entrada: 'verbo', verbo: '', carregando: null });
  if (tecla === 'SUBST') return so({ ...e, entrada: 'substantivo', substantivo: '', carregando: null });

  if (tecla === 'LIMPA') {
    if (e.entrada === 'verbo') return so({ ...e, verbo: '' });
    if (e.entrada === 'substantivo') return so({ ...e, substantivo: '' });
    if (e.entrada === 'dado') return so({ ...e, sinal: '+', dado: '' });
    return so(e);
  }

  if (tecla === '+' || tecla === '-') {
    if (e.entrada === 'dado' && e.dado === '') return so({ ...e, sinal: tecla });
    return so({ ...e, erro: true });
  }

  if (ehDigito(tecla)) {
    if (e.entrada === 'verbo') return so(e.verbo.length < 2 ? { ...e, verbo: e.verbo + tecla } : e);
    if (e.entrada === 'substantivo') {
      return so(e.substantivo.length < 2 ? { ...e, substantivo: e.substantivo + tecla } : e);
    }
    if (e.entrada === 'dado') return so(e.dado.length < 5 ? { ...e, dado: e.dado + tecla } : e);
    return so({ ...e, erro: true });
  }

  // ENTRA
  if (e.entrada === 'dado' && e.carregando) {
    if (e.dado === '') return so({ ...e, erro: true });
    const valor = Number(e.dado) * (e.sinal === '-' ? -1 : 1);
    return {
      estado: { ...e, entrada: 'nenhuma', carregando: null, monitorando: e.carregando, dado: '', sinal: '+' },
      comando: { tipo: 'CARREGAR', substantivo: e.carregando, valor },
    };
  }
  if (e.verbo.length < 2) return so({ ...e, erro: true });
  return executar(e, catalogo);
}

/** Registro vazio: "_" marca a posição do sinal apagada. */
export const REGISTRO_VAZIO = '_     ';

/** Número -> texto de 6 posições do registro: sinal + 5 dígitos. */
export function formatarRegistro(valor: number | null): string {
  if (valor === null || !Number.isFinite(valor)) return REGISTRO_VAZIO;
  const inteiro = Math.max(-99999, Math.min(99999, Math.round(valor)));
  return (inteiro < 0 ? '-' : '+') + String(Math.abs(inteiro)).padStart(5, '0');
}

/** Texto do registro enquanto o operador digita um dado. */
export function formatarDigitacao(sinal: '+' | '-', dado: string): string {
  return sinal + dado.padEnd(5, ' ');
}
