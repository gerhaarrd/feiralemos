// Visor de 7 segmentos desenhado em SVG (sem fonte externa).

const FORMAS: Record<string, [number, number, number, number]> = {
  a: [4, 1, 12, 3],
  b: [16, 3, 3, 13],
  c: [16, 18, 3, 13],
  d: [4, 30, 12, 3],
  e: [1, 18, 3, 13],
  f: [1, 3, 3, 13],
  g: [4, 15.5, 12, 3],
  h: [8.5, 9, 3, 16], // barra vertical do sinal "+"
};

const ACESOS: Record<string, string> = {
  '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc',
  '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg',
  '+': 'gh', '-': 'g', '_': '', ' ': '',
};

const LARGURA_CELULA = 24;

interface Props {
  /** Dígitos, "+", "-", espaço (dígito apagado) ou "_" (sinal apagado). */
  texto: string;
  altura?: number;
  pisca?: boolean;
}

export function Segmentos({ texto, altura = 32, pisca = false }: Props) {
  const largura = texto.length * LARGURA_CELULA;
  return (
    <svg
      className={`segmentos${pisca ? ' segmentos--pisca' : ''}`}
      viewBox={`0 0 ${largura} 34`}
      height={altura}
      width={(altura * largura) / 34}
      role="img"
      aria-label={texto.replace('_', ' ').trim() || 'vazio'}
    >
      {[...texto].map((ch, i) => {
        const candidatos = '+-_'.includes(ch) ? 'gh' : 'abcdefg';
        const acesos = ACESOS[ch] ?? '';
        return (
          <g key={i} transform={`translate(${i * LARGURA_CELULA + 2} 0) skewX(-5)`}>
            {[...candidatos].map((s) => {
              const [x, y, w, h] = FORMAS[s];
              return <rect key={s} x={x} y={y} width={w} height={h} rx={1} className={acesos.includes(s) ? 'seg seg--aceso' : 'seg'} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}
