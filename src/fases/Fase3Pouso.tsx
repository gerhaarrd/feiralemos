import { useEffect, useRef, useState } from 'react';
import { REGISTRO_VAZIO, formatarRegistro } from '../dsky/logica';
import { Visor } from '../dsky/Visor';
import { aceleracaoParaParar } from '../physics/cinematica';
import {
  POUSO,
  aceleracaoVertical,
  assumirControle,
  estadoInicialPouso,
  passoPouso,
  velocidadeSegura,
  type EstadoPouso,
  type ResultadoPouso,
} from '../physics/pouso';
import { tocar } from '../som';
import type { PropsCena } from './cenas';

const L = 600;
const A = 400;
const SOLO = 360;
const px = (x: number) => ((x - POUSO.xMin) * L) / (POUSO.xMax - POUSO.xMin);
const py = (h: number) => SOLO - h * 2.1;
const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const br = (n: number, casas = 0) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

const ESTRELAS = [[40, 30], [110, 70], [170, 22], [250, 55], [330, 28], [410, 80], [470, 36], [540, 64], [575, 18], [300, 110]];
/** [x em metros, tamanho] das pedras da área insegura */
const PEDRAS = [[-56, 5], [-47, 8], [-37, 6], [-26, 10], [-14, 7], [-3, 9], [8, 6], [17, 8], [24, 5]];
/** Cratera desenhada em volta do alvo do computador: centro e meia-largura (m). */
const CRATERA = { centro: -10, raio: 32 };

const TECLAS: Record<string, 'cima' | 'esq' | 'dir' | 'assumir'> = {
  w: 'cima', arrowup: 'cima', ' ': 'cima',
  a: 'esq', arrowleft: 'esq', d: 'dir', arrowright: 'dir',
  e: 'assumir', enter: 'assumir',
};

function textoResultado(r: ResultadoPouso, e: EstadoPouso): { titulo: string; detalhe: string } {
  switch (r) {
    case 'pousou':
      return {
        titulo: '“A Águia pousou.”',
        detalhe: `Toque a ${br(Math.abs(e.v), 1)} m/s, com ${br(e.combustivel * 100)}% de combustível. Na missão real sobraram cerca de 25 segundos.`,
      };
    case 'colisao':
      return {
        titulo: 'Pouso duro demais',
        detalhe:
          e.combustivel <= 0
            ? 'O combustível acabou e o Eagle caiu. Deixe descer mais no começo e freie só perto do solo.'
            : `Tocou o solo a ${br(Math.abs(e.v), 1)} m/s (o máximo é ${br(POUSO.vPousoMax, 1)}). Segure W mais cedo para frear.`,
      };
    case 'tombou':
      return {
        titulo: 'O módulo tombou',
        detalhe: `Chegou ao solo com ${br(Math.abs(e.vx), 1)} m/s de lado (máximo ${br(POUSO.vxPousoMax, 1)}). Pare o movimento lateral antes de tocar.`,
      };
    case 'area-insegura':
      return {
        titulo: 'Pousou entre as pedras',
        detalhe:
          e.modo === 'auto'
            ? 'O computador desceu direto para a cratera. Assuma o controle manual e leve o Eagle para a área plana.'
            : 'Fora da área plana. Use ◀ ▶ para levar o Eagle até a faixa verde antes de descer.',
      };
  }
}

/** Fase 3: o pouso. Descida automática, alarme 1202 e controle manual até o solo. */
export function Fase3Pouso({ aoConcluir }: PropsCena) {
  const [e, setE] = useState(estadoInicialPouso);
  const sim = useRef({
    estado: e,
    empuxo: 0,
    cima: false,
    motorBotao: false,
    esq: false,
    dir: false,
    botao: 0 as -1 | 0 | 1,
    alarmeTocou: false,
  });

  const assumir = () => {
    const s = sim.current;
    if (s.estado.modo !== 'auto' || s.estado.t < POUSO.tAlarme || s.estado.resultado) return;
    s.empuxo = s.estado.empuxo;
    s.estado = assumirControle(s.estado);
    setE(s.estado);
    tocar('ok');
  };
  const assumirRef = useRef(assumir);
  assumirRef.current = assumir;

  const reiniciar = () => {
    const s = sim.current;
    s.estado = estadoInicialPouso();
    s.empuxo = 0;
    s.alarmeTocou = false;
    setE(s.estado);
  };

  useEffect(() => {
    const s = sim.current;
    const aoTeclar = (ev: KeyboardEvent, apertou: boolean) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const acao = TECLAS[ev.key.toLowerCase()];
      if (!acao) return;
      if (acao === 'assumir') {
        // Enter/espaço com um botão em foco pertencem ao botão.
        if (document.activeElement instanceof HTMLButtonElement && ev.key.toLowerCase() !== 'e') return;
        if (apertou && !ev.repeat) assumirRef.current();
      } else {
        s[acao] = apertou;
      }
      ev.preventDefault();
    };
    const aoPressionar = (ev: KeyboardEvent) => aoTeclar(ev, true);
    const aoSoltar = (ev: KeyboardEvent) => aoTeclar(ev, false);

    let raf = 0;
    let anterior = performance.now();
    const laco = (agora: number) => {
      const dt = Math.min(0.05, (agora - anterior) / 1000);
      anterior = agora;
      if (!s.estado.resultado) {
        if (s.estado.modo === 'manual') {
          // Motor ligado enquanto W (ou o botão) estiver apertado; sobe e desce rápido, mas não de estalo.
          const alvo = s.cima || s.motorBotao ? 1 : 0;
          s.empuxo = limitar(s.empuxo + Math.sign(alvo - s.empuxo) * 4 * dt, 0, 1);
        }
        const lateral = Math.sign((s.dir ? 1 : 0) - (s.esq ? 1 : 0) + s.botao) as -1 | 0 | 1;
        s.estado = passoPouso(s.estado, { empuxo: s.empuxo, lateral }, dt);
        if (!s.alarmeTocou && s.estado.t >= POUSO.tAlarme) {
          s.alarmeTocou = true;
          tocar('alarme');
        }
        if (s.estado.resultado) tocar(s.estado.resultado === 'pousou' ? 'sucesso' : 'falha');
        setE(s.estado);
      }
      raf = requestAnimationFrame(laco);
    };
    raf = requestAnimationFrame(laco);

    window.addEventListener('keydown', aoPressionar);
    window.addEventListener('keyup', aoSoltar);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', aoPressionar);
      window.removeEventListener('keyup', aoSoltar);
    };
  }, []);

  const s = sim.current;
  const manual = e.modo === 'manual';
  const alarme = !manual && e.t >= POUSO.tAlarme;
  const voando = !e.resultado;
  const empuxo = manual ? (e.combustivel > 0 ? s.empuxo : 0) : e.empuxo;
  const a = aceleracaoVertical(empuxo);
  const frenagem = voando && e.v < 0 ? aceleracaoParaParar(e.v, e.h) : 0;
  const frenagemMax = POUSO.aMotorMax - POUSO.g;
  const lateral = voando && manual ? Math.sign((s.dir ? 1 : 0) - (s.esq ? 1 : 0) + s.botao) : 0;
  const inclinacao = e.resultado === 'tombou' ? 78 : e.resultado === 'colisao' ? 24 : lateral * 11;
  const resultado = e.resultado ? textoResultado(e.resultado, e) : null;

  // Copiloto: diz ao jogador o que fazer agora.
  let dica: string | null = null;
  if (manual && voando) {
    const vSegura = velocidadeSegura(e.h);
    if (e.combustivel <= 0) dica = 'Sem combustível!';
    else if (e.v < vSegura - 1.5) dica = 'Rápido demais: segure W para frear';
    else if (e.v > -0.5 && e.h > 3) dica = 'Solte W para descer';
    else if (e.x < POUSO.zonaSegura[0] + 8) dica = 'Vá para a direita: segure D ▶';
    else if (Math.abs(e.vx) > POUSO.vxPousoMax && e.h < 40) dica = e.vx > 0 ? 'Pare de andar de lado: toque em A' : 'Pare de andar de lado: toque em D';
    else dica = 'Bom ritmo: toques curtos em W';
  }

  const instrucao = manual
    ? `Controle manual (programa 66): leve o Eagle até a faixa verde e toque o solo a menos de ${br(POUSO.vPousoMax, 1)} m/s.`
    : alarme
      ? 'ALARME 1202! O computador está sobrecarregado, e o alvo dele é uma cratera cheia de pedras.'
      : 'Descida automática (programa 63): o computador controla o motor.';

  const segurar = (direcao: -1 | 1) => ({
    onPointerDown: () => (s.botao = direcao),
    onPointerUp: () => (s.botao = 0),
    onPointerLeave: () => (s.botao = 0),
    disabled: !manual || !voando,
  });

  return (
    <div className="cena">
      <p className={`cena__instrucao${alarme ? ' cena__instrucao--alerta' : ''}`}>{instrucao}</p>
      <div className="pouso">
        <div className="pouso__esquerda">
        <div className="pouso__cena">
          <svg viewBox={`0 0 ${L} ${A}`} role="img" aria-label="Descida do módulo lunar Eagle">
            <rect width={L} height={A} className="f-tinta" />
            {ESTRELAS.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i % 3 ? 1 : 1.6} className="f-creme" />
            ))}
            <circle cx={520} cy={120} r={15} className="f-chumbo" />
            <path d="M509,116 q10,-6 22,2" fill="none" stroke="var(--creme)" strokeWidth={3} />

            {/* solo: cratera à esquerda, faixa plana à direita */}
            <path
              d={`M0,${SOLO} L${px(CRATERA.centro - CRATERA.raio)},${SOLO} Q${px(CRATERA.centro)},${SOLO + 22} ${px(CRATERA.centro + CRATERA.raio)},${SOLO} L${L},${SOLO} V${A} H0 Z`}
              className="f-creme-esc"
            />
            <path d={`M0,${SOLO + 16} Q${L / 2},${SOLO + 30} ${L},${SOLO + 14} V${A} H0 Z`} className="f-chumbo" opacity={0.6} />
            {PEDRAS.map(([x, t], i) => {
              const cx = px(x);
              const d = (x - CRATERA.centro) / CRATERA.raio;
              const base = SOLO + (Math.abs(d) < 1 ? 10 * (1 - d * d) : 0) + 2;
              return (
                <path
                  key={i}
                  d={`M${cx - t},${base} L${cx - t * 0.5},${base - t * 1.1} L${cx + t * 0.4},${base - t * 1.4} L${cx + t},${base} Z`}
                  className="f-chumbo-esc"
                  stroke="var(--tinta)"
                  strokeWidth={1.5}
                />
              );
            })}

            {/* o que o piloto vê depois do alarme */}
            {(alarme || manual) && (
              <g className="txt-rotulo" fontSize={11}>
                <path d={`M${px(0)},${SOLO - 34} V${SOLO - 6}`} stroke="var(--vermelho)" strokeWidth={2} strokeDasharray="4 4" />
                <text x={px(0)} y={SOLO - 40} textAnchor="middle" className="f-vermelho">
                  ALVO DO COMPUTADOR
                </text>
                <rect x={px(POUSO.zonaSegura[0])} y={SOLO + 3} width={px(POUSO.zonaSegura[1]) - px(POUSO.zonaSegura[0])} height={5} className="f-verde" />
                <text x={(px(POUSO.zonaSegura[0]) + px(POUSO.zonaSegura[1])) / 2} y={SOLO + 26} textAnchor="middle" className="f-tinta">
                  ÁREA PLANA
                </text>
              </g>
            )}

            {/* linha de altitude */}
            {voando && e.h > 12 && (
              <path d={`M${px(e.x)},${py(e.h) + 6} V${SOLO - 2}`} stroke="var(--chumbo)" strokeWidth={1} strokeDasharray="2 5" />
            )}

            {/* Eagle */}
            <g transform={`translate(${px(e.x)} ${py(e.h)}) rotate(${inclinacao}) scale(1.5)`} stroke="var(--tinta)" strokeWidth={1}>
              {voando && empuxo > 0.02 && (
                <path d={`M-4,-4 L4,-4 L0,${2 + empuxo * 30 + Math.sin(e.t * 40) * 2} Z`} className="f-ambar" stroke="none" />
              )}
              <path d="M-9,-12 L-17,0 M9,-12 L17,0 M-21,0 H-13 M13,0 H21" fill="none" stroke="var(--creme)" strokeWidth={2} />
              <path d="M-4,-8 L4,-8 L6,-3 L-6,-3 Z" className="f-chumbo-esc" />
              <rect x={-11} y={-17} width={22} height={9} className="f-ambar" />
              <path d="M-8,-17 L-10,-25 L-5,-32 L5,-32 L10,-25 L8,-17 Z" className="f-creme" />
              <path d="M-7,-25 L-1,-25 L-5,-20 Z" className="f-tinta" />
              <path d="M5,-32 L9,-38" fill="none" stroke="var(--creme)" strokeWidth={1.5} />
            </g>
          </svg>

          {alarme && voando && (
            <button className="botao botao--ambar pouso__assumir" onClick={assumir}>
              Assumir controle manual [E]
            </button>
          )}

          {dica && <p className="pouso__dica">{dica}</p>}

          {resultado && (
            <div className={`pouso__resultado${e.resultado === 'pousou' ? ' pouso__resultado--ok' : ''}`}>
              <h3>{resultado.titulo}</h3>
              <p>{resultado.detalhe}</p>
              {e.resultado === 'pousou' ? (
                <button className="botao botao--ambar" onClick={aoConcluir} autoFocus>
                  Continuar ▸
                </button>
              ) : (
                <button className="botao botao--ambar" onClick={reiniciar} autoFocus>
                  Tentar de novo
                </button>
              )}
            </div>
          )}
        </div>

          <div className="pouso__formulas">
            <p>
              a = motor − g = {br(empuxo * POUSO.aMotorMax, 2)} − {br(POUSO.g, 2)} = <b>{br(a, 2)} m/s²</b>
            </p>
            <p>
              v = v₀ + a·t → em 1 s: <b>{br(e.v + a, 1)} m/s</b>
            </p>
            <p className={frenagem > frenagemMax ? 'falha' : undefined}>
              Torricelli, para parar no solo: a = v²/(2h) = <b>{br(Math.min(frenagem, 99), 2)} m/s²</b> (máx. {br(frenagemMax, 2)})
            </p>
          </div>
          <p className="pouso__teclas">
            Segure <kbd>W</kbd> para ligar o motor e frear · <kbd>A</kbd>
            <kbd>D</kbd> para andar de lado (ou setas)
          </p>
        </div>

        <div className="pouso__painel">
          <div className="pouso__visor">
            <span className={`lampada lampada--ambar${alarme ? ' lampada--acesa lampada--pisca' : ''}`}>PROG</span>
            <Visor
              programa={manual ? '66' : alarme ? '64' : '63'}
              verbo={alarme ? '05' : '16'}
              substantivo={alarme ? '09' : '60'}
              registros={
                alarme
                  ? ['+01202', REGISTRO_VAZIO, REGISTRO_VAZIO]
                  : [formatarRegistro(e.vx * 10), formatarRegistro(e.v * 10), formatarRegistro(e.h)]
              }
              ativo={voando}
              pisca={alarme}
              altura={20}
            />
            <p className="pouso__legenda">
              {alarme ? 'R1 código do alarme' : 'R1 vel. lateral ×10 · R2 vel. vertical ×10 · R3 altitude (m)'}
            </p>
          </div>

          <dl className="leituras">
            <div>
              <dt>Altitude</dt>
              <dd>{br(e.h)} m</dd>
            </div>
            <div>
              <dt>Vel. vertical</dt>
              <dd className={Math.abs(e.v) <= POUSO.vPousoMax ? 'ok' : e.h < 25 ? 'falha' : undefined}>{br(e.v, 1)} m/s</dd>
            </div>
            <div>
              <dt>Vel. lateral</dt>
              <dd className={Math.abs(e.vx) <= POUSO.vxPousoMax ? 'ok' : e.h < 25 ? 'falha' : undefined}>{br(e.vx, 1)} m/s</dd>
            </div>
            <div>
              <dt>Combustível</dt>
              <dd className={e.combustivel < 0.12 ? 'falha' : undefined}>{br(e.combustivel * 100)}%</dd>
            </div>
          </dl>

          <div className="pouso__empuxo">
            <span>Empuxo {br(empuxo * 100)}%</span>
            <div className="medidor">
              <div style={{ width: `${empuxo * 100}%` }} />
            </div>
          </div>
          <button
            className="botao botao--ambar"
            disabled={!manual || !voando}
            onPointerDown={() => (s.motorBotao = true)}
            onPointerUp={() => (s.motorBotao = false)}
            onPointerLeave={() => (s.motorBotao = false)}
          >
            Motor (segure)
          </button>
          <div className="pouso__setas">
            <button className="botao botao--mini" {...segurar(-1)}>
              ◀ esquerda
            </button>
            <button className="botao botao--mini" {...segurar(1)}>
              direita ▶
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
