import { useMemo, useState } from 'react';
import { Dsky, type Substantivo } from '../dsky/Dsky';
import { br } from '../formato';
import { DISTANCIA_TERRA_LUA_KM, velocidadeMedia } from '../physics/formulas';
import type { PropsCena } from './cenas';

const TEMPO_MIN_H = 24;
const TEMPO_MAX_H = 300;
const TEMPO_REAL_H = 76;

/** Fase 2: escolher o tempo de viagem e obter a velocidade média (vm = Δs / Δt). */
export function Fase2Viagem({ fase, substantivosGerais, aoConcluir }: PropsCena) {
  const [tempoH, setTempoH] = useState<number | null>(null);
  const vm = tempoH === null ? null : velocidadeMedia(DISTANCIA_TERRA_LUA_KM, tempoH);

  const substantivos = useMemo<Substantivo[]>(
    () => [
      {
        codigo: '33',
        nome: 'Tempo de viagem',
        registros: ['tempo Δt, em horas', 'vm = Δs ÷ Δt, em km/h', 'distância Δs, em milhares de km'],
        ler: () => [tempoH, vm, DISTANCIA_TERRA_LUA_KM / 1000],
        carregar: (valor) => {
          if (valor < TEMPO_MIN_H || valor > TEMPO_MAX_H) return false;
          setTempoH(valor);
          return true;
        },
      },
      ...substantivosGerais,
    ],
    [tempoH, vm, substantivosGerais],
  );

  return (
    <div className="cena">
      <p className="cena__instrucao">
        A Lua está a {br(DISTANCIA_TERRA_LUA_KM)} km. Escolha em quantas horas fazer a viagem: <b>VERBO 21 · SUBST 33 · ENTRA</b>,
        digite as horas (de {TEMPO_MIN_H} a {TEMPO_MAX_H}) e aperte <b>ENTRA</b>.
      </p>
      <Dsky programa={fase.programa} substantivos={substantivos}>
        <svg className="rota" viewBox="0 0 300 50" role="img" aria-label="Trajeto da Terra à Lua">
          <rect width={300} height={50} className="f-tinta" />
          <path d="M40,22 H262" stroke="var(--chumbo)" strokeWidth={1.5} strokeDasharray="3 6" />
          <circle cx={24} cy={22} r={15} className="f-chumbo" />
          <path d="M13,18 q10,-7 22,2 M15,29 q9,4 18,-2" fill="none" stroke="var(--creme)" strokeWidth={3} strokeLinecap="round" />
          <circle cx={278} cy={22} r={8} className="f-creme" />
          {vm !== null && (
            <g className="rota__nave" style={{ animationDuration: `${(tempoH ?? 96) / 16}s` }}>
              <path d="M44,17 L56,22 L44,27 Z" className="f-ambar" />
            </g>
          )}
          <text x={150} y={45} textAnchor="middle" className="txt-rotulo f-creme" fontSize={10}>
            Δs = {br(DISTANCIA_TERRA_LUA_KM)} km
          </text>
        </svg>
        <div className="cena__resultado">
          {tempoH === null || vm === null ? (
            <p>Aguardando o tempo de viagem…</p>
          ) : (
            <>
              <p>
                vm = Δs ÷ Δt = {br(DISTANCIA_TERRA_LUA_KM)} km ÷ {br(tempoH)} h = <b>{br(vm)} km/h</b>
              </p>
              <p className="cena__nota">
                Na missão real: cerca de {TEMPO_REAL_H} h (vm ≈ {br(velocidadeMedia(DISTANCIA_TERRA_LUA_KM, TEMPO_REAL_H))} km/h), com a
                velocidade mudando o tempo todo.
              </p>
            </>
          )}
          <button className="botao botao--ambar" disabled={vm === null} onClick={aoConcluir}>
            Confirmar rota
          </button>
        </div>
      </Dsky>
    </div>
  );
}
