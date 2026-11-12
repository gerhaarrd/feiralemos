interface Props {
  x: number;
  /** y dos pés */
  y: number;
  virado: 'esq' | 'dir';
  andando: boolean;
  flutuando: boolean;
  /** tempo em segundos, para o balanço da flutuação */
  t: number;
}

/** Astronauta em vista lateral. Origem local = ponto entre os pés. */
export function Astronauta({ x, y, virado, andando, flutuando, t }: Props) {
  const ciclo = andando ? Math.sin(x / 14) : 0;
  const pernaA = flutuando ? 14 + ciclo * 8 : ciclo * 28;
  const pernaB = flutuando ? 26 - ciclo * 8 : -ciclo * 28;
  const braco = flutuando ? -35 - ciclo * 10 : -ciclo * 24;
  const dy = flutuando ? -16 + Math.sin(t * 2.2) * 7 : andando ? -Math.abs(ciclo) * 4 : 0;
  const inclinacao = flutuando ? (andando ? 14 : 4) : 0;

  return (
    <g
      transform={`translate(${x} ${y + dy}) scale(${virado === 'esq' ? -1 : 1} 1) rotate(${inclinacao} 0 -90)`}
      className="tr"
    >
      {[pernaB, pernaA].map((angulo, i) => (
        <g key={i} transform={`translate(0 -82) rotate(${angulo})`}>
          <rect x={-10} y={0} width={20} height={74} rx={9} className={i === 0 ? 'f-creme-esc' : 'f-creme'} />
          <rect x={-11} y={66} width={28} height={16} rx={6} className="f-chumbo-esc" />
        </g>
      ))}
      <rect x={-25} y={-154} width={50} height={84} rx={17} className="f-creme" />
      <rect x={-25} y={-100} width={50} height={9} className="f-chumbo" />
      <circle cx={11} cy={-128} r={5} className="f-vermelho" />
      <circle cx={11} cy={-113} r={5} className="f-chumbo" />
      <g transform={`translate(-2 -140) rotate(${braco})`}>
        <rect x={-9} y={0} width={18} height={56} rx={9} className="f-creme" />
        <circle cx={0} cy={58} r={10} className="f-chumbo-esc" />
      </g>
      {/* cabeça com a touca de comunicação ("Snoopy cap") */}
      <circle cx={2} cy={-175} r={21} className="f-creme" />
      <path d="M2,-196 A21,21 0 0,0 2,-154 L6,-168 L-2,-182 Z" className="f-tinta" />
      <circle cx={-1} cy={-173} r={7} className="f-chumbo" />
      <path d="M-1,-168 L17,-162" fill="none" />
      <circle cx={14} cy={-179} r={1.5} className="f-tinta" />
    </g>
  );
}
