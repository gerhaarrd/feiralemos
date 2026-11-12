import { useMemo, useState } from 'react';
import { Dsky, type Substantivo } from '../dsky/Dsky';
import { br } from '../formato';
import { velocidade } from '../physics/cinematica';
import {
  A_SUBIDA,
  CORREDOR_REENTRADA,
  V_ORBITAL_LUA,
  V_REENTRADA,
  avaliarOrbita,
  avaliarReentrada,
  velocidadeDeDescida,
  type ResultadoReentrada,
} from '../physics/retorno';
import { tocar } from '../som';
import type { PropsCena } from './cenas';

const TRAJETORIAS: Record<ResultadoReentrada, string> = {
  ricocheteia: 'M10,10 Q120,32 170,29 Q230,24 292,3',
  ok: 'M10,10 Q130,26 200,42 T262,60',
  ingreme: 'M10,10 L140,56',
};

function DiagramaReentrada({ resultado }: { resultado: ResultadoReentrada | null }) {
  return (
    <svg className="rota" viewBox="0 0 300 70" role="img" aria-label="Trajetória de reentrada na atmosfera">
      <rect width={300} height={70} className="f-tinta" />
      {/* atmosfera e superfície */}
      <path d="M0,46 Q150,18 300,46 V70 H0 Z" className="f-chumbo" opacity={0.45} />
      <path d="M0,66 Q150,44 300,66 V70 H0 Z" className="f-chumbo" />
      <text x={292} y={40} textAnchor="end" className="txt-rotulo f-creme" fontSize={9}>
        ATMOSFERA
      </text>
      {resultado && (
        <>
          <path
            d={TRAJETORIAS[resultado]}
            fill="none"
            stroke={resultado === 'ok' ? 'var(--verde)' : 'var(--vermelho)'}
            strokeWidth={2.5}
            strokeDasharray="6 4"
          />
          {resultado === 'ingreme' && <path d="M140,56 m-8,0 h16 m-8,-8 v16 m-5,-13 l10,10 m0,-10 l-10,10" stroke="var(--ambar)" strokeWidth={2} />}
        </>
      )}
      <path d="M4,6 L14,8 L8,16 Z" className="f-ambar" />
    </svg>
  );
}

/** Fase 5: decolar da Lua (v = a · t) e acertar o ângulo de reentrada. */
export function Fase5Retorno({ substantivosGerais, aoConcluir }: PropsCena) {
  const [etapa, setEtapa] = useState<'subida' | 'reentrada'>('subida');
  const [queimaS, setQueimaS] = useState<number | null>(null);
  const [anguloDecimos, setAnguloDecimos] = useState<number | null>(null);

  const vFinal = queimaS === null ? null : velocidade(0, A_SUBIDA, queimaS);
  const orbita = vFinal === null ? null : avaliarOrbita(vFinal);
  const angulo = anguloDecimos === null ? null : anguloDecimos / 10;
  const reentrada = angulo === null ? null : avaliarReentrada(angulo);

  const substantivos = useMemo<Substantivo[]>(() => {
    const daEtapa: Substantivo =
      etapa === 'subida'
        ? {
            codigo: '74',
            nome: 'Queima do motor de subida',
            registros: ['tempo de queima t, em s', 'v = a · t, em m/s', 'velocidade orbital necessária, em m/s'],
            ler: () => [queimaS, vFinal, V_ORBITAL_LUA],
            carregar: (valor) => {
              if (valor < 1 || valor > 999) return false;
              setQueimaS(valor);
              return true;
            },
          }
        : {
            codigo: '61',
            nome: 'Ângulo de reentrada',
            registros: ['ângulo × 10, em graus (65 = 6,5°)', 'descida v · sen θ, em m/s', 'velocidade da cápsula, em m/s'],
            ler: () => [anguloDecimos, angulo === null ? null : velocidadeDeDescida(V_REENTRADA, angulo), V_REENTRADA],
            carregar: (valor) => {
              if (valor < 0 || valor > 900) return false;
              setAnguloDecimos(valor);
              return true;
            },
          };
    return [daEtapa, ...substantivosGerais];
  }, [etapa, queimaS, vFinal, anguloDecimos, angulo, substantivosGerais]);

  if (etapa === 'subida') {
    return (
      <div className="cena">
        <p className="cena__instrucao">
          Parte 1 de 2 · Para encontrar o Columbia, o Eagle precisa chegar a {br(V_ORBITAL_LUA)} m/s. O motor acelera{' '}
          {br(A_SUBIDA, 2)} m/s². Carregue o tempo de queima em segundos: <b>VERBO 21 · SUBST 74 · ENTRA</b>.
        </p>
        <Dsky key="subida" programa="12" substantivos={substantivos}>
          <div className="cena__resultado">
            {queimaS === null || vFinal === null ? (
              <p>
                Dica: de v = a · t sai t = v ÷ a = {br(V_ORBITAL_LUA)} ÷ {br(A_SUBIDA, 2)}.
              </p>
            ) : (
              <>
                <p>
                  v = a · t = {br(A_SUBIDA, 2)} × {br(queimaS)} = <b>{br(vFinal)} m/s</b>
                </p>
                <p className={orbita === 'ok' ? 'ok' : 'falha'}>
                  {orbita === 'ok' && 'Velocidade orbital atingida: encontro com o Columbia garantido.'}
                  {orbita === 'lento' && `Lento demais: o Eagle cairia de volta. Tente t = ${br(V_ORBITAL_LUA)} ÷ ${br(A_SUBIDA, 2)}.`}
                  {orbita === 'rapido' && `Rápido demais: passaria direto pelo Columbia. Tente t = ${br(V_ORBITAL_LUA)} ÷ ${br(A_SUBIDA, 2)}.`}
                </p>
              </>
            )}
            <button
              className="botao botao--ambar"
              disabled={orbita !== 'ok'}
              onClick={() => {
                tocar('ok');
                setEtapa('reentrada');
              }}
            >
              Decolar da Lua
            </button>
          </div>
        </Dsky>
      </div>
    );
  }

  return (
    <div className="cena">
      <p className="cena__instrucao">
        Parte 2 de 2 · A cápsula chega à Terra a {br(V_REENTRADA / 1000)} km/s. O ângulo de entrada precisa ficar entre{' '}
        {br(CORREDOR_REENTRADA[0], 1)}° e {br(CORREDOR_REENTRADA[1], 1)}°. Carregue o ângulo × 10 (65 = 6,5°):{' '}
        <b>VERBO 21 · SUBST 61 · ENTRA</b>.
      </p>
      <Dsky key="reentrada" programa="61" substantivos={substantivos}>
        <DiagramaReentrada resultado={reentrada} />
        <div className="cena__resultado">
          {angulo === null ? (
            <p>Raso demais, a cápsula ricocheteia na atmosfera; íngreme demais, ela superaquece.</p>
          ) : (
            <>
              <p>
                θ = {br(angulo, 1)}° → descida = v · sen θ = <b>{br(velocidadeDeDescida(V_REENTRADA, angulo))} m/s</b>
              </p>
              <p className={reentrada === 'ok' ? 'ok' : 'falha'}>
                {reentrada === 'ok' && 'Dentro do corredor: reentrada segura.'}
                {reentrada === 'ricocheteia' && 'Raso demais: a cápsula ricocheteia e volta para o espaço.'}
                {reentrada === 'ingreme' && 'Íngreme demais: calor e desaceleração além do limite.'}
              </p>
            </>
          )}
          <button className="botao botao--ambar" disabled={reentrada !== 'ok'} onClick={aoConcluir}>
            Iniciar reentrada
          </button>
        </div>
      </Dsky>
    </div>
  );
}
