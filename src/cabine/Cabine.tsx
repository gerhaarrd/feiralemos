import { useEffect, useRef, useState } from 'react';
import { MODULOS, estacaoDaFase, type Estacao, type Fase } from '../game/fases';
import { limitar, maisProximo, passoMovimento, type ConfigMovimento } from '../game/movimento';
import { TELA_DE_TOQUE } from '../toque';
import { Astronauta } from './Astronauta';
import { Janela } from './Janela';
import { PainelEstacao } from './PainelEstacao';

const LARGURA = 1280;
const ALTURA = 720;
const PISO = 606;
const Y_PAINEL = 290;
const Y_JANELA = 300;
const ALCANCE = 80;
const MOVIMENTO: ConfigMovimento = { velocidade: 430, minX: 110, maxX: 1170 };

const TECLAS_ESQ = new Set(['arrowleft', 'a']);
const TECLAS_DIR = new Set(['arrowright', 'd']);
const TECLAS_USAR = new Set(['e', 'w', 'arrowup']);
/** Em telas estreitas a câmera mostra só um trecho da cabine; este é o trecho mínimo. */
const VISTA_MIN = 520;
/** Em telas baixas (celular deitado) a câmera corta o teto: mostra de Y_CORTE até o piso. */
const ALTURA_VISTA_MIN = 480;
const Y_CORTE = 186;
/** Abaixo desta altura em pixels a cabine inteira ficaria pequena demais. */
const TELA_BAIXA_PX = 430;

interface Props {
  fase: Fase;
  /** false enquanto um painel/overlay está aberto: o astronauta não se move. */
  ativo: boolean;
  /** Chamado quando o jogador usa o painel-alvo da fase. */
  aoAbrirTarefa: () => void;
  /** Chamado quando o jogador usa o DSKY fora da tarefa (consulta livre). */
  aoAbrirDsky: () => void;
}

interface Quadro {
  x: number;
  virado: 'esq' | 'dir';
  andando: boolean;
  t: number;
}

export function Cabine({ fase, ativo, aoAbrirTarefa, aoAbrirDsky }: Props) {
  const modulo = MODULOS[fase.modulo];
  const alvo = estacaoDaFase(fase);

  const [quadro, setQuadro] = useState<Quadro>({ x: modulo.entradaX, virado: 'dir', andando: false, t: 0 });
  const [fala, setFala] = useState<string | null>(null);
  /** Proporção largura/altura do espaço disponível na tela. */
  const [aspecto, setAspecto] = useState(LARGURA / ALTURA);
  const [alturaPx, setAlturaPx] = useState(ALTURA);
  const svgRef = useRef<SVGSVGElement>(null);

  // Estado mutável do laço de animação (fora do React para não recriar o laço).
  const sim = useRef({
    x: modulo.entradaX,
    virado: 'dir' as 'esq' | 'dir',
    esq: false,
    dir: false,
    destino: null as number | null,
    pendente: null as Estacao | null,
  });

  const usar = (estacao: Estacao) => {
    if (estacao.id === alvo.id) {
      aoAbrirTarefa();
    } else if (estacao.id === 'dsky') {
      aoAbrirDsky();
    } else {
      setFala(`Aqui não. A tarefa está em: ${alvo.rotulo}.`);
    }
  };
  // O laço e os listeners sempre enxergam as props mais recentes.
  const atual = useRef({ ativo, usar, estacoes: modulo.estacoes });
  atual.current = { ativo, usar, estacoes: modulo.estacoes };

  useEffect(() => {
    const el = svgRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const medir = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setAspecto(r.width / r.height);
        setAlturaPx(r.height);
      }
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    if (!fala) return;
    const id = setTimeout(() => setFala(null), 2600);
    return () => clearTimeout(id);
  }, [fala]);

  useEffect(() => {
    const s = sim.current;
    const aoPressionar = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const tecla = ev.key.toLowerCase();
      if (TECLAS_ESQ.has(tecla)) s.esq = true;
      else if (TECLAS_DIR.has(tecla)) s.dir = true;
      else if (TECLAS_USAR.has(tecla)) {
        if (!ev.repeat && atual.current.ativo) {
          const perto = maisProximo(s.x, atual.current.estacoes, ALCANCE);
          if (perto) atual.current.usar(perto);
        }
      } else return;
      ev.preventDefault();
    };
    const aoSoltar = (ev: KeyboardEvent) => {
      const tecla = ev.key.toLowerCase();
      if (TECLAS_ESQ.has(tecla)) s.esq = false;
      if (TECLAS_DIR.has(tecla)) s.dir = false;
    };
    const aoPerderFoco = () => {
      s.esq = false;
      s.dir = false;
    };

    let raf = 0;
    let anterior = performance.now();
    const inicio = anterior;
    const laco = (agora: number) => {
      const dt = Math.min(0.05, (agora - anterior) / 1000);
      anterior = agora;
      let andando = false;
      if (atual.current.ativo) {
        const teclas = ((s.dir ? 1 : 0) - (s.esq ? 1 : 0)) as -1 | 0 | 1;
        if (teclas !== 0) {
          s.destino = null;
          s.pendente = null;
        }
        const r = passoMovimento(s.x, teclas, s.destino, dt, MOVIMENTO);
        s.x = r.x;
        if (r.direcao !== 0) s.virado = r.direcao > 0 ? 'dir' : 'esq';
        andando = r.direcao !== 0;
        if (r.chegou) {
          s.destino = null;
          const pendente = s.pendente;
          s.pendente = null;
          if (pendente) atual.current.usar(pendente);
        }
      } else {
        s.destino = null;
        s.pendente = null;
      }
      setQuadro({ x: s.x, virado: s.virado, andando, t: (agora - inicio) / 1000 });
      raf = requestAnimationFrame(laco);
    };
    raf = requestAnimationFrame(laco);

    window.addEventListener('keydown', aoPressionar);
    window.addEventListener('keyup', aoSoltar);
    window.addEventListener('blur', aoPerderFoco);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', aoPressionar);
      window.removeEventListener('keyup', aoSoltar);
      window.removeEventListener('blur', aoPerderFoco);
    };
  }, []);

  const irAte = (x: number, estacao: Estacao | null) => {
    if (!ativo) return;
    sim.current.destino = limitar(x, MOVIMENTO.minX, MOVIMENTO.maxX);
    sim.current.pendente = estacao;
  };

  const aoClicarCenario = (ev: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    const matriz = svg?.getScreenCTM();
    if (!svg || !matriz) return;
    const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(matriz.inverse());
    irAte(p.x, null);
  };

  const perto = ativo ? maisProximo(quadro.x, modulo.estacoes, ALCANCE) : null;

  // Câmera: em tela larga mostra a cabine inteira; em tela estreita (celular em
  // pé) mostra um trecho e acompanha o astronauta.
  // Em tela baixa e larga (celular deitado) corta o teto para a cabine ocupar a largura toda.
  const telaBaixa = alturaPx < TELA_BAIXA_PX && aspecto > LARGURA / ALTURA;
  const alturaVista = telaBaixa ? limitar(LARGURA / aspecto, ALTURA_VISTA_MIN, ALTURA) : ALTURA;
  const cameraY = ((ALTURA - alturaVista) * Y_CORTE) / (ALTURA - ALTURA_VISTA_MIN);
  const larguraVista = telaBaixa ? LARGURA : limitar(ALTURA * aspecto, VISTA_MIN, LARGURA);
  const cameraX = limitar(quadro.x - larguraVista / 2, 0, LARGURA - larguraVista);
  const alvoFora = alvo.x < cameraX + 60 ? 'esq' : alvo.x > cameraX + larguraVista - 60 ? 'dir' : null;
  const meiaFala = Math.min(250, larguraVista / 2 - 6);
  const eagle = modulo.id === 'eagle';
  const casco = eagle
    ? 'M130,70 H1150 L1244,170 V664 H36 V170 Z'
    : 'M110,70 H1170 Q1244,70 1244,144 V664 H36 V144 Q36,70 110,70 Z';
  const recorte = eagle ? 'M-95,-80 H95 L-95,95 Z' : 'M0,-88 A88,88 0 1,1 -0.1,-88 Z';

  return (
    <svg
      ref={svgRef}
      className="cabine"
      viewBox={`${cameraX} ${cameraY} ${larguraVista} ${alturaVista}`}
      onClick={aoClicarCenario}
      role="img"
      aria-label={`Cabine do módulo ${modulo.nome}`}
    >
      <defs>
        <clipPath id="recorte-janela">
          <path d={recorte} />
        </clipPath>
        <clipPath id="recorte-casco">
          <path d={casco} />
        </clipPath>
      </defs>

      {/* casco e parede */}
      <path d={casco} className="f-fundo tr" strokeWidth={6} />
      <g clipPath="url(#recorte-casco)">
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={36 + i * 160} y={70} width={8} height={540} className="f-tinta" opacity={0.35} />
        ))}
        {/* dutos no teto */}
        <rect x={36} y={118} width={1210} height={16} className="f-chumbo-esc tr" strokeWidth={2} />
        <rect x={36} y={142} width={1210} height={7} className={eagle ? 'f-ambar' : 'f-chumbo'} opacity={0.8} />
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={150 + i * 160} y={112} width={14} height={42} className="f-chumbo tr" strokeWidth={2} />
        ))}
        {/* piso */}
        <rect x={36} y={PISO} width={1210} height={60} className="f-tinta" />
        <rect x={36} y={PISO} width={1210} height={8} className="f-chumbo" />
        {Array.from({ length: 31 }, (_, i) => (
          <path key={i} d={`M${50 + i * 40},${PISO + 14} l-16,44`} stroke="var(--chumbo-esc)" strokeWidth={3} />
        ))}
      </g>
      <path d={casco} fill="none" className="tr" strokeWidth={6} />

      {/* placa do módulo */}
      <text x={96} y={104} className="txt-rotulo f-creme" opacity={0.75}>
        {modulo.placa}
      </text>

      {/* janela */}
      <g transform={`translate(${modulo.janelaX} ${Y_JANELA})`}>
        <path d={recorte} className="tr" strokeWidth={34} strokeLinejoin="round" />
        <path d={recorte} className="s-chumbo" strokeWidth={26} strokeLinejoin="round" />
        <g clipPath="url(#recorte-janela)">
          <Janela vista={fase.janela} t={quadro.t} />
        </g>
        <path d={recorte} fill="none" className="tr" strokeWidth={4} strokeLinejoin="round" />
      </g>

      {/* painéis */}
      {modulo.estacoes.map((estacao) => (
        <PainelEstacao
          key={estacao.id}
          id={estacao.id}
          rotulo={estacao.rotulo}
          x={estacao.x}
          y={Y_PAINEL}
          alvo={estacao.id === alvo.id}
          perto={perto?.id === estacao.id}
          aoClicar={() => irAte(estacao.x, estacao)}
        />
      ))}

      <Astronauta
        x={quadro.x}
        y={PISO + 2}
        virado={quadro.virado}
        andando={quadro.andando}
        flutuando={!fase.gravidade}
        t={quadro.t}
      />

      {/* painel da tarefa fora da tela: seta na borda leva até ele */}
      {ativo && alvoFora && (
        <g
          transform={`translate(${alvoFora === 'esq' ? cameraX + 78 : cameraX + larguraVista - 78} 216)`}
          className="seta-borda"
          onClick={(e) => {
            e.stopPropagation();
            irAte(alvo.x, alvo);
          }}
        >
          <rect x={-70} y={-24} width={140} height={48} rx={4} className="f-ambar tr" />
          <text y={6} textAnchor="middle" className="txt-rotulo f-tinta" fontSize={16}>
            {alvoFora === 'esq' ? '◀ TAREFA' : 'TAREFA ▶'}
          </text>
        </g>
      )}

      {/* fala do astronauta / botão de usar o painel próximo */}
      {fala ? (
        <g
          transform={`translate(${limitar(quadro.x, cameraX + meiaFala + 6, cameraX + larguraVista - meiaFala - 6)} ${PISO - 238})`}
          pointerEvents="none"
        >
          <rect x={-meiaFala} y={-22} width={meiaFala * 2} height={34} rx={4} className="f-creme tr" />
          <text y={1} textAnchor="middle" className="txt-mono f-tinta" fontSize={15}>
            {fala}
          </text>
        </g>
      ) : (
        perto && (
          <g
            transform={`translate(${quadro.x} ${PISO - 238})`}
            className="botao-usar"
            onClick={(e) => {
              e.stopPropagation();
              usar(perto);
            }}
          >
            <rect x={-70} y={-28} width={140} height={46} rx={4} className="f-ambar tr" />
            <text y={3} textAnchor="middle" className="txt-rotulo f-tinta" fontSize={16}>
              {TELA_DE_TOQUE ? 'USAR' : '[E] USAR'}
            </text>
          </g>
        )
      )}
    </svg>
  );
}
