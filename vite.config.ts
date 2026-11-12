import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  // Gera um único dist/index.html (JS, CSS e fontes embutidos): abre com duplo
  // clique, sem servidor e sem internet.
  plugins: [react(), viteSingleFile()],
  test: { environment: 'node' },
});
