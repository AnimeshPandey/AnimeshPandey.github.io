import path from 'path';
import { fileURLToPath } from 'url';

const TESTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export function deployRoot() {
  if (process.env.DEPLOY_DIR) return path.resolve(process.env.DEPLOY_DIR);
  return path.join(TESTS_DIR, '_deploy');
}
