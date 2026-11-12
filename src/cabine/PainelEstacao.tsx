import type { EstacaoId } from '../game/fases';

/** Arte de cada painel, numa caixa de 180 × 200 (origem no canto superior esquerdo). */
function Arte({ id }: { id: EstacaoId }) {
  switch (id) {
    case 'dsky':
      return (
        <>
          {/* luzes de aviso */}
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={16 + (i % 2) * 30} y={18 + Math.floor(i / 2) * 22} width={26} height={18} className={i === 1 ? 'f-ambar' : 'f-creme-esc'} />
          ))}
          {/* display eletroluminescente */}
          <rect x={86} y={16} width={78} height={76} className="f-tinta" />
          {[30, 50, 70].map((y) => (
            <text key={y} x={125} y={y + 8} textAnchor="middle" className="txt-mono f-verde" stroke="none" fontSize={17}>
              +88888
            </text>
          ))}
          {/* teclado */}
          {Array.from({ length: 15 }, (_, i) => (
            <rect key={i} x={16 + (i % 5) * 30} y={106 + Math.floor(i / 5) * 28} width={26} height={24} rx={2} className="f-tinta" />
          ))}
        </>
      );
    case 'propulsao':
      return (
        <>
          {[40, 90, 140].map((cx, i) => (
            <g key={cx}>
              <circle cx={cx} cy={48} r={22} className="f-creme" />
              <path d={`M${cx},48 l${[-12, 4, 14][i]},-15`} strokeWidth={3} />
              <circle cx={cx} cy={48} r={3} className="f-tinta" />
            </g>
          ))}
          <rect x={18} y={88} width={144} height={10} className="f-vermelho" />
          {[34, 62, 90, 118, 146].map((x, i) => (
            <g key={x}>
              <rect x={x - 8} y={116} width={16} height={56} rx={3} className="f-tinta" />
              <rect x={x - 6} y={i % 2 ? 120 : 146} width={12} height={22} rx={2} className="f-creme" />
            </g>
          ))}
        </>
      );
    case 'navegacao':
      return (
        <>
          {/* ocular do sextante */}
          <circle cx={90} cy={70} r={50} className="f-tinta" />
          <circle cx={90} cy={70} r={38} fill="none" stroke="var(--verde)" strokeWidth={1.5} />
          <path d="M90,24 V116 M44,70 H136" stroke="var(--verde)" strokeWidth={1.5} />
          {[[72, 52], [108, 60], [98, 90], [70, 84]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2.5} className="f-creme" stroke="none" />
          ))}
          <circle cx={46} cy={160} r={17} className="f-creme" />
          <path d="M46,160 l9,-11" strokeWidth={3} />
          <circle cx={134} cy={160} r={17} className="f-creme" />
          <path d="M134,160 l-12,-6" strokeWidth={3} />
          <rect x={76} y={148} width={28} height={24} className="f-ambar" />
        </>
      );
    case 'controles':
      return (
        <>
          {/* horizonte artificial ("8-ball") */}
          <circle cx={62} cy={62} r={42} className="f-tinta" />
          <path d="M22,70 A40,40 0 0,1 100,50 Z" className="f-creme" stroke="none" />
          <path d="M40,62 H84 M62,52 V72" stroke="var(--ambar)" strokeWidth={3} />
          {/* fitas de altitude e velocidade */}
          {[124, 150].map((x, i) => (
            <g key={x}>
              <rect x={x} y={20} width={18} height={84} className="f-tinta" />
              <rect x={x + 3} y={i ? 56 : 40} width={12} height={i ? 45 : 61} className={i ? 'f-ambar' : 'f-verde'} stroke="none" />
            </g>
          ))}
          {/* manche */}
          <rect x={24} y={170} width={76} height={14} rx={3} className="f-tinta" />
          <path d="M62,172 L74,126" strokeWidth={9} strokeLinecap="round" />
          <circle cx={75} cy={122} r={11} className="f-vermelho" />
          <rect x={120} y={124} width={46} height={50} rx={3} className="f-creme" />
          <path d="M128,140 H158 M128,152 H158 M128,164 H148" strokeWidth={2} />
        </>
      );
    case 'bancada':
      return (
        <>
          {/* balança */}
          <circle cx={62} cy={60} r={40} className="f-creme" />
          <path d="M62,60 l20,-24" strokeWidth={3} />
          {Array.from({ length: 9 }, (_, i) => {
            const a = (-210 + i * 30) * (Math.PI / 180);
            return <path key={i} d={`M${62 + Math.cos(a) * 31},${60 + Math.sin(a) * 31} L${62 + Math.cos(a) * 37},${60 + Math.sin(a) * 37}`} strokeWidth={2} />;
          })}
          <circle cx={62} cy={60} r={3} className="f-tinta" />
          <rect x={30} y={104} width={64} height={8} className="f-tinta" />
          {/* caixa de amostras lunares */}
          <rect x={112} y={30} width={54} height={70} rx={3} className="f-ambar" />
          <path d="M112,52 H166 M130,52 V30" strokeWidth={2} />
          {/* rochas */}
          <path d="M22,178 l10,-26 l24,-8 l20,12 l6,22 z" className="f-chumbo-esc" />
          <path d="M96,178 l8,-18 l18,-4 l14,10 l2,12 z" className="f-creme-esc" />
          <path d="M14,178 H166" strokeWidth={3} />
        </>
      );
  }
}

interface Props {
  id: EstacaoId;
  rotulo: string;
  x: number;
  y: number;
  alvo: boolean;
  perto: boolean;
  aoClicar: () => void;
}

export function PainelEstacao({ id, rotulo, x, y, alvo, perto, aoClicar }: Props) {
  return (
    <g
      transform={`translate(${x - 90} ${y})`}
      className={`estacao tr${perto ? ' estacao--perto' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        aoClicar();
      }}
    >
      <title>{rotulo}</title>
      <rect x={-8} y={-8} width={196} height={216} rx={6} className="estacao__moldura" />
      <rect width={180} height={200} rx={3} className="f-chumbo" />
      {[[8, 8], [172, 8], [8, 192], [172, 192]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={3} className="f-chumbo-esc" strokeWidth={1.5} />
      ))}
      <Arte id={id} />
      {/* plaqueta gravada */}
      <rect x={-30} y={216} width={240} height={26} className="f-tinta" strokeWidth={0} />
      <text x={90} y={234} textAnchor="middle" className="txt-rotulo f-creme" stroke="none">
        {rotulo}
      </text>
      {/* lâmpada de tarefa */}
      <circle cx={90} cy={-26} r={9} className={alvo ? 'f-ambar pisca' : 'f-chumbo-esc'} />
      {alvo && (
        <g className="seta-alvo" stroke="none">
          <path d="M76,-72 H104 L90,-50 Z" className="f-ambar" />
          <text x={90} y={-82} textAnchor="middle" className="txt-rotulo f-ambar">
            TAREFA
          </text>
        </g>
      )}
    </g>
  );
}
