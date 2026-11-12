import { useState } from 'react';
import { br } from '../formato';
import { G_LUA, G_TERRA, peso } from '../physics/formulas';
import type { PropsCena } from './cenas';

const MASSA_MAX = 200;
const PESO_MAX = MASSA_MAX * G_TERRA;
const EXEMPLOS: [string, number][] = [
  ['Rochas lunares', 21.5],
  ['Uma pessoa', 60],
  ['Astronauta com traje', 180],
];

/** Dinamômetro de mola: quanto maior o peso, mais a mola estica. */
function Dinamometro({ titulo, g, massa }: { titulo: string; g: number; massa: number }) {
  const p = peso(massa, g);
  const comprimento = 26 + (p / PESO_MAX) * 120;
  const voltas = 9;
  const mola = Array.from({ length: voltas * 2 + 1 }, (_, i) => {
    const y = 34 + (i / (voltas * 2)) * comprimento;
    const x = i === 0 || i === voltas * 2 ? 80 : 80 + (i % 2 ? 11 : -11);
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
  const fim = 34 + comprimento;
  const lado = 16 + Math.sqrt(massa) * 2.2;

  return (
    <figure className="dinamometro">
      <svg viewBox="0 0 160 250" role="img" aria-label={`${titulo}: ${br(p, 1)} newtons`}>
        <rect x={20} y={18} width={120} height={10} className="f-chumbo" stroke="var(--tinta)" strokeWidth={2} />
        <path d="M80,28 V34" stroke="var(--creme)" strokeWidth={2} />
        {/* régua */}
        {Array.from({ length: 11 }, (_, i) => (
          <path key={i} d={`M128,${34 + 26 + i * 12} h${i % 5 ? 6 : 12}`} stroke="var(--chumbo)" strokeWidth={1.5} />
        ))}
        <path d={mola} fill="none" stroke="var(--creme)" strokeWidth={2.5} strokeLinejoin="round" />
        <path d={`M80,${fim} v8 M108,${fim} H128`} stroke="var(--ambar)" strokeWidth={2} />
        <rect x={80 - lado / 2} y={fim + 8} width={lado} height={lado} rx={3} className="f-ambar" stroke="var(--tinta)" strokeWidth={2} />
      </svg>
      <figcaption>
        <strong>{titulo}</strong>
        <span>g = {br(g, 2)} m/s²</span>
        <span>
          P = {br(massa, 1)} × {br(g, 2)}
        </span>
        <b>{br(p, 1)} N</b>
      </figcaption>
    </figure>
  );
}

/** Fase 4: o mesmo objeto pesa menos na Lua (P = m · g). */
export function Fase4Gravidade({ aoConcluir }: PropsCena) {
  const [massa, setMassa] = useState(21.5);
  const [mexeu, setMexeu] = useState(false);
  const escolher = (m: number) => {
    setMassa(m);
    setMexeu(true);
  };

  return (
    <div className="cena">
      <p className="cena__instrucao">
        Pendure o objeto nos dois dinamômetros e mude a massa. A <b>massa</b> não muda de um lugar para o outro; o <b>peso</b>{' '}
        depende da gravidade: <b>P = m · g</b>.
      </p>
      <div className="gravidade">
        <Dinamometro titulo="Na Terra" g={G_TERRA} massa={massa} />
        <Dinamometro titulo="Na Lua" g={G_LUA} massa={massa} />
        <div className="gravidade__controles">
          <label>
            <span className="gravidade__massa">
              Massa: <b>{br(massa, 1)} kg</b>
            </span>
            <input
              type="range"
              min={1}
              max={MASSA_MAX}
              step={0.5}
              value={massa}
              autoFocus
              onChange={(ev) => escolher(Number(ev.target.value))}
            />
          </label>
          <div className="gravidade__exemplos">
            {EXEMPLOS.map(([nome, m]) => (
              <button key={nome} className="botao botao--mini" onClick={() => escolher(m)}>
                {nome} · {br(m, 1)} kg
              </button>
            ))}
          </div>
          <p>
            Na Lua o peso é <b>{br(G_TERRA / G_LUA, 1)} vezes menor</b>. Carregar {br(massa, 1)} kg lá dá a sensação de carregar{' '}
            <b>{br((massa * G_LUA) / G_TERRA, 1)} kg</b> aqui.
          </p>
          <button className="botao botao--ambar" disabled={!mexeu} onClick={aoConcluir}>
            Registrar medição
          </button>
          {!mexeu && <p className="cena__nota">Mude a massa pelo menos uma vez para registrar.</p>}
        </div>
      </div>
    </div>
  );
}
