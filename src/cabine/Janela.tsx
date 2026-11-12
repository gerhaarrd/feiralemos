import type { VistaJanela } from '../game/fases';

const ESTRELAS: [number, number, number][] = [
  [-80, -70, 1.6], [-45, -88, 1], [-10, -60, 1.3], [35, -82, 1.8], [70, -55, 1], [88, -20, 1.4],
  [-88, -10, 1], [-60, 30, 1.5], [55, 15, 1], [-30, 75, 1.2], [80, 70, 1.6], [10, 90, 1],
];

/** Céu estrelado; as estrelas deslizam devagar (a nave gira lentamente). */
function Ceu({ t }: { t: number }) {
  const desvio = (t * 4) % 220;
  return (
    <>
      <rect x={-110} y={-110} width={220} height={220} className="f-tinta" />
      {[0, 220].map((copia) => (
        <g key={copia} transform={`translate(${copia - desvio} 0)`}>
          {ESTRELAS.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} className="f-creme" />
          ))}
        </g>
      ))}
    </>
  );
}

/** Progresso 0→1 da vista ao longo da fase, com desaceleração no fim. */
function progresso(t: number, duracao = 45): number {
  const p = Math.min(1, Math.max(0, t / duracao));
  return 1 - (1 - p) * (1 - p);
}

function Terra({ r, cx, cy }: { r: number; cx: number; cy: number }) {
  const e = r / 60;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${e})`}>
      <circle r={60} className="f-chumbo" />
      <path d="M-38,-30 q14,-18 34,-8 q8,14 -6,26 q-4,18 -18,14 q-16,-10 -10,-32z" className="f-verde" opacity={0.55} />
      <path d="M12,6 q18,-8 30,6 q2,18 -14,28 q-16,-4 -16,-34z" className="f-verde" opacity={0.55} />
      <path d="M-50,8 q30,-12 58,0 M-20,-44 q28,-6 50,10 M-30,40 q26,8 52,-6" fill="none" stroke="var(--creme)" strokeWidth={5} strokeLinecap="round" opacity={0.85} />
      <circle r={60} fill="none" stroke="var(--tinta)" strokeWidth={2} />
    </g>
  );
}

function Lua({ r, cx, cy }: { r: number; cx: number; cy: number }) {
  const e = r / 60;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${e})`}>
      <circle r={60} className="f-creme" />
      {[[-22, -18, 13], [20, 8, 17], [-8, 30, 9], [28, -30, 7], [-36, 14, 6]].map(([x, y, raio], i) => (
        <circle key={i} cx={x} cy={y} r={raio} className="f-chumbo" opacity={0.5} />
      ))}
    </g>
  );
}

/** Conteúdo da janela, desenhado numa caixa de -100 a 100. Quem usa aplica o recorte. */
export function Janela({ vista, t }: { vista: VistaJanela; t: number }) {
  const p = progresso(t);
  switch (vista) {
    case 'plataforma':
      return (
        <>
          <rect x={-110} y={-110} width={220} height={220} className="f-creme" />
          <rect x={-110} y={50} width={220} height={60} className="f-ambar" opacity={0.6} />
          {/* torre de lançamento */}
          <g stroke="var(--vermelho)" strokeWidth={5} fill="none">
            <path d="M-50,110 V-110 M-10,110 V-110" />
            {[-90, -50, -10, 30, 70].map((y) => (
              <path key={y} d={`M-50,${y} L-10,${y + 40} M-10,${y} L-50,${y + 40} M-50,${y} H-10`} strokeWidth={3} />
            ))}
            <path d="M-10,-30 H70 M-10,-18 H70" />
          </g>
        </>
      );
    case 'terra':
      return (
        <>
          <Ceu t={t} />
          <Terra r={100 - 68 * p} cx={10} cy={18} />
        </>
      );
    case 'lua':
      return (
        <>
          <Ceu t={t} />
          <Lua r={18 + 62 * p} cx={-6} cy={10} />
        </>
      );
    case 'superficie':
      return (
        <>
          <Ceu t={0} />
          <Terra r={16} cx={48} cy={-50} />
          <path d="M-110,30 Q-40,10 20,26 T110,18 V110 H-110 Z" className="f-creme" />
          <path d="M-110,62 Q-20,44 110,60 V110 H-110 Z" className="f-chumbo" opacity={0.45} />
          {[[-50, 48, 20, 5], [40, 70, 28, 7], [-10, 90, 16, 4]].map(([x, y, rx, ry], i) => (
            <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} className="f-chumbo" opacity={0.7} />
          ))}
        </>
      );
    case 'retorno':
      return (
        <>
          <Ceu t={t} />
          <Terra r={22 + 76 * p} cx={34 * p} cy={52 * p} />
        </>
      );
  }
}
