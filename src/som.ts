// Sons simples gerados na hora (Web Audio), sem arquivos. Tudo opcional:
// se o navegador bloquear o áudio, o jogo segue normalmente.

export type Som = 'tecla' | 'ok' | 'erro' | 'alarme' | 'sucesso' | 'falha';

const CHAVE = 'apollo11-mudo';
let contexto: AudioContext | null = null;
let mudo = false;
try {
  mudo = localStorage.getItem(CHAVE) === '1';
} catch {
  // armazenamento indisponível: começa com som
}

/** [frequência Hz, início s, duração s] */
const NOTAS: Record<Som, [number, number, number][]> = {
  tecla: [[620, 0, 0.04]],
  ok: [[660, 0, 0.08], [880, 0.09, 0.12]],
  erro: [[180, 0, 0.22]],
  alarme: [[880, 0, 0.14], [660, 0.18, 0.14], [880, 0.36, 0.14], [660, 0.54, 0.14]],
  sucesso: [[523, 0, 0.12], [659, 0.13, 0.12], [784, 0.26, 0.12], [1047, 0.39, 0.3]],
  falha: [[330, 0, 0.18], [247, 0.2, 0.18], [165, 0.4, 0.4]],
};

export function estaMudo(): boolean {
  return mudo;
}

export function alternarMudo(): boolean {
  mudo = !mudo;
  try {
    localStorage.setItem(CHAVE, mudo ? '1' : '0');
  } catch {
    // sem persistência
  }
  return mudo;
}

export function tocar(som: Som): void {
  if (mudo) return;
  try {
    contexto ??= new AudioContext();
    if (contexto.state === 'suspended') void contexto.resume();
    const agora = contexto.currentTime;
    for (const [freq, inicio, duracao] of NOTAS[som]) {
      const osc = contexto.createOscillator();
      const ganho = contexto.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      ganho.gain.setValueAtTime(0.05, agora + inicio);
      ganho.gain.exponentialRampToValueAtTime(0.001, agora + inicio + duracao);
      osc.connect(ganho).connect(contexto.destination);
      osc.start(agora + inicio);
      osc.stop(agora + inicio + duracao + 0.02);
    }
  } catch {
    // áudio indisponível
  }
}
