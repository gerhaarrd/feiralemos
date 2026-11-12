import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Cabine } from './cabine/Cabine';
import { Dsky } from './dsky/Dsky';
import { criarRelogio } from './dsky/substantivos';
import { CENAS } from './fases/cenas';
import { FASES, MODULOS } from './game/fases';
import { ESTADO_INICIAL, criarRedutor, type EstadoJogo } from './game/maquina';
import { alternarMudo, estaMudo, tocar } from './som';
import { TELA_DE_TOQUE } from './toque';

const reduzir = criarRedutor(FASES.length);

/** `?fase=3` abre direto na fase 3 (útil para testar e para retomar na feira). */
function estadoInicial(): EstadoJogo {
  const params = new URLSearchParams(window.location.search);
  const n = Number(params.get('fase'));
  if (!Number.isInteger(n) || n < 1) return ESTADO_INICIAL;
  const naFase = reduzir(ESTADO_INICIAL, { tipo: 'IR_PARA_FASE', indice: n - 1 });
  // &painel=tarefa ou &painel=dsky já abre o painel (atalho de desenvolvimento).
  const painel = params.get('painel');
  if (painel === 'tarefa') return reduzir(naFase, { tipo: 'ABRIR_TAREFA' });
  if (painel === 'dsky') return reduzir(naFase, { tipo: 'ABRIR_DSKY' });
  return naFase;
}

const AVISO = 'Modelos didáticos e simplificados — os cálculos reais da NASA eram muito mais complexos.';

/** As cinco fases e suas fórmulas, nas telas inicial e final. */
function Roteiro({ concluido = false }: { concluido?: boolean }) {
  return (
    <ol className="roteiro">
      {FASES.map((f, i) => (
        <li key={f.id}>
          <span className="roteiro__numero">{concluido ? '✓' : i + 1}</span>
          <span className="roteiro__titulo">{f.titulo}</span>
          <span className="roteiro__formula">{f.formula}</span>
        </li>
      ))}
    </ol>
  );
}

export function App() {
  const [estado, despachar] = useReducer(reduzir, undefined, estadoInicial);
  const { tela, indiceFase, status, tentativa } = estado;
  const fase = FASES[indiceFase];
  const Cena = CENAS[fase.id];

  const inicioMissao = useRef(performance.now());
  const substantivosGerais = useMemo(() => [criarRelogio(() => inicioMissao.current)], []);
  const iniciarMissao = () => {
    inicioMissao.current = performance.now();
    tocar('ok');
    despachar({ tipo: 'INICIAR_MISSAO' });
  };
  const [mudo, setMudo] = useState(estaMudo);
  const minutosDeMissao = useMemo(
    () => (tela === 'fim' ? Math.max(1, Math.round((performance.now() - inicioMissao.current) / 60000)) : 0),
    [tela],
  );

  useEffect(() => {
    if (status === 'concluida' && fase.id !== 'pouso') tocar('sucesso');
  }, [status, fase.id]);

  useEffect(() => {
    const aoPressionar = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') despachar({ tipo: 'FECHAR_PAINEL' });
    };
    window.addEventListener('keydown', aoPressionar);
    return () => window.removeEventListener('keydown', aoPressionar);
  }, []);

  if (tela === 'inicio') {
    return (
      <main className="tela-cheia">
        <p className="sobretitulo">16 de julho de 1969 · Cabo Kennedy</p>
        <h1 className="titulo">Apollo 11</h1>
        <p className="subtitulo">Simulador de missão: a matemática que levou o homem à Lua</p>
        <Roteiro />
        <button className="botao botao--ambar botao--grande" onClick={iniciarMissao} autoFocus>
          Iniciar missão
        </button>
        <p className="tela-cheia__controles">
          {TELA_DE_TOQUE ? (
            'Toque no chão para andar pela cabine e toque em um painel para usá-lo.'
          ) : (
            <>
              <kbd>←</kbd>
              <kbd>→</kbd> ou <kbd>A</kbd>
              <kbd>D</kbd> para andar pela cabine · <kbd>E</kbd> para usar um painel · ou clique na tela
            </>
          )}
        </p>
        <p className="aviso">{AVISO}</p>
      </main>
    );
  }

  if (tela === 'fim') {
    return (
      <main className="tela-cheia">
        <p className="sobretitulo">24 de julho de 1969 · Oceano Pacífico</p>
        <h1 className="titulo titulo--longo">Missão cumprida</h1>
        <p className="subtitulo">
          A tripulação voltou em segurança para a Terra. Você fez em {minutosDeMissao} min o que levou 8 dias, com cinco
          fórmulas:
        </p>
        <Roteiro concluido />
        <button className="botao botao--ambar botao--grande" onClick={() => despachar({ tipo: 'REINICIAR_MISSAO' })} autoFocus>
          Jogar de novo
        </button>
        <p className="aviso">{AVISO}</p>
      </main>
    );
  }

  return (
    <div className="app">
      <header className="cabecalho">
        <div className="marca">
          <strong>Apollo 11</strong>
          <span>{MODULOS[fase.modulo].nome}</span>
        </div>
        <ol className="trilha" aria-label="Fases da missão">
          {FASES.map((f, i) => (
            <li
              key={f.id}
              className={i === indiceFase ? 'trilha__atual' : i < indiceFase ? 'trilha__feita' : undefined}
              aria-current={i === indiceFase ? 'step' : undefined}
            >
              <span className="trilha__lampada">{i + 1}</span>
              <span className="trilha__nome">{f.titulo}</span>
            </li>
          ))}
        </ol>
        <div className="acoes">
          <button
            className="botao"
            aria-pressed={!mudo}
            onClick={(e) => {
              e.currentTarget.blur();
              setMudo(alternarMudo());
            }}
          >
            Som: {mudo ? 'não' : 'sim'}
          </button>
          <button className="botao" onClick={(e) => { e.currentTarget.blur(); despachar({ tipo: 'REINICIAR_FASE' }); }}>
            Reiniciar
          </button>
          <button className="botao" onClick={(e) => { e.currentTarget.blur(); despachar({ tipo: 'PULAR_FASE' }); }}>
            Pular ▸
          </button>
        </div>
      </header>

      <main className="palco">
        <Cabine
          key={`${fase.id}-${tentativa}`}
          fase={fase}
          ativo={status === 'cabine'}
          aoAbrirTarefa={() => despachar({ tipo: 'ABRIR_TAREFA' })}
          aoAbrirDsky={() => despachar({ tipo: 'ABRIR_DSKY' })}
        />

        {(status === 'tarefa' || status === 'dsky') && (
          <div className="sobreposicao">
            <section className="console" role="dialog" aria-label={status === 'dsky' ? 'DSKY' : fase.titulo}>
              <header className="console__topo">
                <span>{status === 'dsky' ? 'DSKY · consulta livre' : `Fase ${indiceFase + 1} · ${fase.titulo}`}</span>
                <button className="botao botao--mini" onClick={() => despachar({ tipo: 'FECHAR_PAINEL' })}>
                  {TELA_DE_TOQUE ? 'Voltar' : 'Voltar (Esc)'}
                </button>
              </header>
              {status === 'dsky' ? (
                <div className="cena">
                  <p className="cena__instrucao">
                    A tarefa desta fase fica em outro painel, mas o computador de bordo está sempre ligado. Experimente{' '}
                    <b>VERBO 16 · SUBST 36 · ENTRA</b> para ver o relógio da missão.
                  </p>
                  <Dsky programa={fase.programa} substantivos={substantivosGerais} />
                </div>
              ) : (
                <Cena
                  key={tentativa}
                  fase={fase}
                  substantivosGerais={substantivosGerais}
                  aoConcluir={() => despachar({ tipo: 'CONCLUIR_TAREFA' })}
                />
              )}
            </section>
          </div>
        )}

        {status === 'concluida' && (
          <div className="sobreposicao">
            <section className="console console--ok" role="dialog" aria-label="Fase concluída">
              <header className="console__topo">
                <span>Fase {indiceFase + 1} concluída</span>
              </header>
              <div className="provisoria">
                <p className="provisoria__formula">{fase.formula}</p>
                <p className="provisoria__fato">
                  <span className="etiqueta">Na missão real</span>
                  {fase.fato}
                </p>
                <button className="botao botao--ambar" onClick={() => despachar({ tipo: 'PROXIMA_FASE' })} autoFocus>
                  {indiceFase === FASES.length - 1 ? 'Encerrar missão ▸' : 'Próxima fase ▸'}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="rodape">
        <p className="rodape__objetivo">
          <span className="etiqueta">Objetivo</span>
          {fase.objetivo}
        </p>
        <p className="rodape__formula">{fase.formula}</p>
        <p className="rodape__controles">
          <kbd>←</kbd>
          <kbd>→</kbd> ou <kbd>A</kbd>
          <kbd>D</kbd> andar · <kbd>E</kbd> usar · ou toque/clique no painel
        </p>
        <p className="aviso">{AVISO}</p>
      </footer>
    </div>
  );
}
