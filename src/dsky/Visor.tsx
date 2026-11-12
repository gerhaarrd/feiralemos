import { Segmentos } from './Segmentos';

interface Props {
  programa: string;
  verbo: string;
  substantivo: string;
  /** Três textos de 6 posições (sinal + 5 dígitos). */
  registros: string[];
  /** Acende ATIV COMPUT. */
  ativo?: boolean;
  /** Verbo e substantivo piscando (computador aguardando o operador). */
  pisca?: boolean;
  /** Altura dos dígitos em px. */
  altura?: number;
}

/** O visor eletroluminescente do DSKY: PROG, VERBO, SUBST e três registros. */
export function Visor({ programa, verbo, substantivo, registros, ativo = false, pisca = false, altura = 32 }: Props) {
  return (
    <div className="dsky__visor">
      <div className={`dsky__ativ${ativo ? ' dsky__ativ--aceso' : ''}`}>
        ATIV
        <br />
        COMPUT
      </div>
      <div className="dsky__campo">
        <span className="dsky__rotulo">PROG</span>
        <Segmentos texto={programa.padStart(2, ' ')} altura={altura} />
      </div>
      <div className="dsky__campo">
        <span className="dsky__rotulo">VERBO</span>
        <Segmentos texto={verbo.padEnd(2, ' ')} altura={altura} pisca={pisca} />
      </div>
      <div className="dsky__campo">
        <span className="dsky__rotulo">SUBST</span>
        <Segmentos texto={substantivo.padEnd(2, ' ')} altura={altura} pisca={pisca} />
      </div>
      {registros.map((texto, i) => (
        <div key={i} className="dsky__registro">
          <span className="dsky__r">R{i + 1}</span>
          <Segmentos texto={texto} altura={altura} />
        </div>
      ))}
    </div>
  );
}
