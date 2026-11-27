import { spawnSync } from 'node:child_process';
import path from 'node:path';

const viteCliPath = path.resolve(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');

const result = spawnSync(process.execPath, [viteCliPath, 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_APP_MODE: 'admin',
  },
});

if (result.error) {
  console.error('Erro ao executar build administrativo:', result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
