import { useEffect, useMemo, useRef, useState } from 'react';
import { Dsky, type Substantivo } from '../dsky/Dsky';
import { br } from '../formato';
import { deslocamento, velocidade } from '../physics/cinematica';
import { MASSA_SATURN_V_KG, aceleracao } from '../physics/formulas';
import { EMPUXO_MAXIMO_KN, EMPUXO_SATURN_V_KN, aceleracaoDeSubida } from '../physics/lancamento';
import { tocar } from '../som';
import type { PropsCena } from './cenas';

const DURACAO_SUBIDA = 7; // segundos de animação
const ESCALA = 1.2; // px por metro
const ALTURA_FOGUETE = 110; // m

/** Animação da decolagem: o foguete sobe com a aceleração escolhida pelo jogador. */
function Decolagem({ a, aoTerminar }: { a: number; aoTerminar: () => void }) {
  const [t, setT] = useState(0);
  const terminar = useRef(aoTerminar);
  terminar.current = aoTerminar;

  useEffect(() => {
    let raf = 0;
    const inicio = performance.now();
    const laco = (agora: number) => {
      const decorrido = (agora - inicio) / 1000;
      if (decorrido >= DURACAO_SUBIDA) {
        setT(DURACAO_SUBIDA);
        terminar.current();
        return;
      }
      setT(decorrido);
      raf = requestAnimationFrame(laco);
    };
    raf = requestAnimationFrame(laco);
    return () => cancelAnimationFrame(raf);
  }, []);

  const v = velocidade(0, a, t);
  const h = deslocamento(0, a, t);
  const base = 272 - h * ESCALA;
  const topo = ALTURA_FOGUETE * ESCALA;
  const tremor = Math.sin(t * 70) * 1.2;

  return (
    <div className="decolagem">
      <svg viewBox="0 0 420 300" role="img" aria-label="Saturn V subindo da plataforma">
        <rect width={420} height={300} className="f-creme" />
        <rect y={272} width={420} height={28} className="f-ambar" />
        {/* torre de lançamento */}
        <g stroke="var(--vermelho)" strokeWidth={3} fill="none">
          <path d="M120,272 V110 M150,272 V110 M120,110 H150" />
          {[110, 137, 164, 191, 218, 245].map((y) => (
            <path key={y} d={`M120,${y} L150,${y + 27} M150,${y} L120,${y + 27}`} strokeWidth={1.5} />
          ))}
          <path d="M150,150 H196 M150,200 H196" opacity={Math.max(0, 1 - t)} />
        </g>
        {/* fumaça */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={i} cx={210 + (i - 2.5) * (18 + t * 9)} cy={270 - (i % 2) * 8} r={10 + t * 3 + (i % 3) * 3} className="f-chumbo" opacity={0.5} />
        ))}
        {/* Saturn V */}
        <g transform={`translate(${210 + tremor} ${base})`} stroke="var(--tinta)" strokeWidth={1.5}>
          <path d={`M-9,0 L0,${26 + Math.sin(t * 50) * 5} L9,0 Z`} className="f-ambar" stroke="none" />
          <path d="M-7,0 L0,14 L7,0 Z" className="f-vermelho" stroke="none" />
          <path d={`M-6,0 V${-topo * 0.38} L-5,${-topo * 0.44} V${-topo * 0.66} L-3.5,${-topo * 0.72} V${-topo * 0.86} L-2,${-topo * 0.9} L0,${-topo} L2,${-topo * 0.9} L3.5,${-topo * 0.86} V${-topo * 0.72} L5,${-topo * 0.66} V${-topo * 0.44} L6,${-topo * 0.38} V0 Z`} className="f-creme" />
          <path d="M-6,0 L-11,0 L-6,-12 M6,0 L11,0 L6,-12" className="f-tinta" />
          {[0.1, 0.3, 0.5, 0.62].map((f) => (
            <rect key={f} x={-6 + (f > 0.4 ? 1 : 0)} y={-topo * f - 6} width={12 - (f > 0.4 ? 2 : 0)} height={6} className="f-tinta" stroke="none" />
          ))}
        </g>
        <text x={408} y={24} textAnchor="end" className="txt-rotulo f-tinta">
          t = {br(t, 1)} s
        </text>
      </svg>
      <div className="decolagem__dados">
        <h3>Decolagem!</h3>
        <p>
          a = F ÷ m − g = <b>{br(a, 2)} m/s²</b>
        </p>
        <p>
          v = a · t = <b>{br(v, 1)} m/s</b> ({br(v * 3.6)} km/h)
        </p>
        <p>
          altura = a · t² ÷ 2 = <b>{br(h, 1)} m</b>
        </p>
        <p className="decolagem__nota">
          O Saturn V tinha {ALTURA_FOGUETE} m de altura e levava cerca de 10 s só para passar da torre.
        </p>
      </div>
    </div>
  );
}

/** Fase 1: carregar o empuxo no DSKY (F = m · a) e decolar. */
export function Fase1Lancamento({ fase, substantivosGerais, aoConcluir }: PropsCena) {
  const [empuxoKN, setEmpuxoKN] = useState(0);
  const [subindo, setSubindo] = useState(false);

  const a = aceleracao(empuxoKN * 1000, MASSA_SATURN_V_KG);
  const subida = aceleracaoDeSubida(empuxoKN * 1000, MASSA_SATURN_V_KG);

  const substantivos = useMemo<Substantivo[]>(
    () => [
      {
        codigo: '62',
        nome: 'Empuxo do Saturn V',
        registros: ['empuxo F, em kN', 'a = F ÷ m, em cm/s²', 'a − g (subida), em cm/s²'],
        ler: () => [empuxoKN, a * 100, subida * 100],
        carregar: (valor) => {
          if (valor < 0 || valor > EMPUXO_MAXIMO_KN) return false;
          setEmpuxoKN(valor);
          return true;
        },
      },
      ...substantivosGerais,
    ],
    [empuxoKN, a, subida, substantivosGerais],
  );

  if (subindo) {
    return (
      <div className="cena">
        <Decolagem a={subida} aoTerminar={aoConcluir} />
      </div>
    );
  }

  return (
    <div className="cena">
      <p className="cena__instrucao">
        Carregue o empuxo dos motores: <b>VERBO 21 · SUBST 62 · ENTRA</b>, digite o valor em kN e aperte <b>ENTRA</b>. O
        Saturn V real tinha cerca de {br(EMPUXO_SATURN_V_KN)} kN (máximo aqui: {br(EMPUXO_MAXIMO_KN)}).
      </p>
      <Dsky programa={fase.programa} substantivos={substantivos}>
        <div className="cena__resultado">
          <p>
            a = F ÷ m = {br(empuxoKN)} kN ÷ {br(MASSA_SATURN_V_KG)} kg = <b>{br(a, 2)} m/s²</b>
          </p>
          <p className={subida > 0 ? 'ok' : 'falha'}>
            {subida > 0
              ? `Maior que g (9,81): o foguete sobe com ${br(subida, 2)} m/s².`
              : 'Menor que g (9,81 m/s²): o foguete não sai do chão.'}
          </p>
          <button
            className="botao botao--ambar"
            disabled={subida <= 0}
            onClick={() => {
              tocar('ok');
              setSubindo(true);
            }}
          >
            Ignição!
          </button>
        </div>
      </Dsky>
    </div>
  );
}
