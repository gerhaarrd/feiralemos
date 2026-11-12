import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DSKY_INICIAL,
  REGISTRO_VAZIO,
  VERBO_CARREGAR,
  VERBO_MONITORAR,
  VERBO_TESTE,
  formatarDigitacao,
  formatarRegistro,
  teclar,
  type Catalogo,
  type EstadoDsky,
  type Tecla,
} from './logica';
import { tocar } from '../som';
import { Visor } from './Visor';

export type Leitura = [number | null, number | null, number | null];

/** Um dado que o DSKY sabe mostrar (e, opcionalmente, receber). */
export interface Substantivo {
  codigo: string;
  nome: string;
  /** O que cada registro (R1, R2, R3) representa, com a unidade. */
  registros: [string, string, string];
  ler: () => Leitura;
  /** Recebe o valor digitado em R1. Retornar false recusa (acende ERRO OPER). */
  carregar?: (valor: number) => boolean;
}

interface Props {
  /** Número do programa em execução (campo PROG). */
  programa: string;
  substantivos: Substantivo[];
  /** Acende a lâmpada PROG (alarme de programa). */
  alarmeProg?: boolean;
  /** Conteúdo extra da cena, mostrado abaixo do cartão de referência. */
  children?: ReactNode;
}

const LAMPADAS = ['ENLACE', 'TEMP', 'SEM ATIT', 'TRAVA GIRO', 'ESPERA', 'PROG', 'TECLA LIB', 'REINIC', 'ERRO OPER', 'RASTREIO'];

const TECLADO: Tecla[] = [
  'VERBO', '+', '7', '8', '9', 'LIMPA', 'ENTRA',
  'SUBST', '-', '4', '5', '6', 'REINIC',
  '0', '1', '2', '3',
];

const ATALHOS: Record<string, Tecla> = {
  v: 'VERBO', n: 'SUBST', enter: 'ENTRA', backspace: 'LIMPA', delete: 'LIMPA', r: 'REINIC',
};

function mensagem(e: EstadoDsky, nomes: Record<string, string>): string {
  if (e.teste) return 'Teste de luzes: tudo aceso. Aperte REINIC para encerrar.';
  if (e.erro) return 'ERRO OPER: comando inválido. Aperte REINIC e tente de novo.';
  if (e.entrada === 'verbo') {
    return e.verbo.length < 2 ? 'Digite os 2 dígitos do verbo.' : 'Agora aperte SUBST (ou ENTRA, se o verbo não usa substantivo).';
  }
  if (e.entrada === 'substantivo') {
    return e.substantivo.length < 2 ? 'Digite os 2 dígitos do substantivo.' : 'Aperte ENTRA para executar.';
  }
  if (e.entrada === 'dado') return 'Digite o valor em R1 (até 5 dígitos) e aperte ENTRA.';
  if (e.monitorando) return `Mostrando o substantivo ${e.monitorando}: ${nomes[e.monitorando] ?? ''}.`;
  return 'Aperte VERBO para começar.';
}

export function Dsky({ programa, substantivos, alarmeProg = false, children }: Props) {
  const [estado, setEstado] = useState(DSKY_INICIAL);
  const [ativo, setAtivo] = useState(false);
  const [, setPulso] = useState(0);

  const catalogo = useMemo<Catalogo>(
    () => Object.fromEntries(substantivos.map((s) => [s.codigo, { editavel: !!s.carregar }])),
    [substantivos],
  );
  const porCodigo = Object.fromEntries(substantivos.map((s) => [s.codigo, s]));
  const nomes = Object.fromEntries(substantivos.map((s) => [s.codigo, s.nome]));

  // O listener de teclado sempre usa a versão mais recente.
  const atual = useRef({ estado, catalogo, porCodigo });
  atual.current = { estado, catalogo, porCodigo };

  const pressionar = (tecla: Tecla) => {
    const { estado: e, catalogo: c, porCodigo: p } = atual.current;
    const r = teclar(e, tecla, c);
    let novo = r.estado;
    if (r.comando?.tipo === 'CARREGAR') {
      const aceito = p[r.comando.substantivo]?.carregar?.(r.comando.valor) ?? false;
      if (!aceito) novo = { ...novo, erro: true };
    }
    atual.current.estado = novo;
    setEstado(novo);
    tocar(novo.erro && !e.erro ? 'erro' : 'tecla');
    if (tecla === 'ENTRA') setAtivo(true);
  };
  const pressionarRef = useRef(pressionar);
  pressionarRef.current = pressionar;

  useEffect(() => {
    if (!ativo) return;
    const id = setTimeout(() => setAtivo(false), 350);
    return () => clearTimeout(id);
  }, [ativo]);

  // Redesenha periodicamente: valores monitorados podem mudar sozinhos (ex.: relógio).
  useEffect(() => {
    const id = setInterval(() => setPulso((n) => n + 1), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const aoPressionar = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const k = ev.key.toLowerCase();
      const tecla = ATALHOS[k] ?? (/^[0-9+-]$/.test(k) ? (k as Tecla) : null);
      if (!tecla) return;
      // Enter com um botão em foco deve acionar o botão, não o DSKY.
      if (tecla === 'ENTRA' && document.activeElement instanceof HTMLButtonElement) return;
      ev.preventDefault();
      pressionarRef.current(tecla);
    };
    window.addEventListener('keydown', aoPressionar);
    return () => window.removeEventListener('keydown', aoPressionar);
  }, []);

  const monitorado = estado.monitorando ? porCodigo[estado.monitorando] : undefined;
  let registros: string[];
  if (estado.teste) registros = ['+88888', '+88888', '+88888'];
  else if (estado.entrada === 'dado') registros = [formatarDigitacao(estado.sinal, estado.dado), REGISTRO_VAZIO, REGISTRO_VAZIO];
  else registros = (monitorado?.ler() ?? [null, null, null]).map(formatarRegistro);

  const aguardandoDado = estado.entrada === 'dado';
  const acesa = (nome: string) =>
    estado.teste || (nome === 'ERRO OPER' && estado.erro) || (nome === 'PROG' && alarmeProg);

  return (
    <div className="dsky-conjunto">
      <div className="dsky">
        <div className="dsky__topo">
          <div className="dsky__lampadas">
            {LAMPADAS.map((nome) => (
              <span key={nome} className={`lampada${acesa(nome) ? ' lampada--acesa' : ''}${nome === 'PROG' || nome === 'TEMP' ? ' lampada--ambar' : ''}`}>
                {nome}
              </span>
            ))}
          </div>

          <Visor
            programa={estado.teste ? '88' : programa}
            verbo={estado.teste ? '88' : estado.verbo}
            substantivo={estado.teste ? '88' : estado.substantivo}
            registros={registros}
            ativo={ativo || estado.teste}
            pisca={aguardandoDado}
          />
        </div>

        <div className="dsky__teclado">
          {TECLADO.map((tecla) => (
            <button
              key={tecla}
              type="button"
              tabIndex={-1}
              className={`tecla${tecla.length > 1 ? ' tecla--funcao' : ''}${tecla === 'ENTRA' ? ' tecla--entra' : ''}${tecla === '0' ? ' tecla--zero' : ''}`}
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => pressionar(tecla)}
            >
              {tecla}
            </button>
          ))}
          <span className="dsky__atalhos">
            No teclado: V, N, números, Enter, ⌫ (limpa), R
          </span>
        </div>
      </div>

      <div className="dsky-lateral">
      <aside className="cartao">
        <p className="cartao__status" aria-live="polite">
          {mensagem(estado, nomes)}
        </p>
        <h3>Verbos (a ação)</h3>
        <p>
          <b>{VERBO_MONITORAR}</b> mostrar · <b>{VERBO_CARREGAR}</b> carregar · <b>{VERBO_TESTE}</b> testar luzes
        </p>
        <h3>Substantivos (o dado)</h3>
        <dl>
          {substantivos.map((s) => (
            <div key={s.codigo} className="cartao__linha">
              <dt>{s.codigo}</dt>
              <dd>
                {s.nome}
                {s.carregar ? ' (aceita carga)' : ''}
              </dd>
            </div>
          ))}
        </dl>
        {monitorado && !aguardandoDado && (
          <>
            <h3>Registros agora</h3>
            <dl>
              {monitorado.registros.map((descricao, i) => (
                <div key={i} className="cartao__linha">
                  <dt>R{i + 1}</dt>
                  <dd>{descricao}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </aside>
      {children}
      </div>
    </div>
  );
}
