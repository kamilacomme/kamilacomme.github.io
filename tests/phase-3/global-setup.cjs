const { execFileSync } = require('node:child_process');
const path = require('node:path');

module.exports = async config => {
  if (config.updateSnapshots === 'none') return;
  if (process.env.PHASE3_CAPTURE_REFERENCES !== '1') {
    throw new Error('Phase 3 reference writes require PHASE3_CAPTURE_REFERENCES=1.');
  }
  const root = path.resolve(__dirname, '../..');
  const branch = execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim();
  if (!branch || branch === 'main') throw new Error('Phase 3 captures require a dedicated non-main branch.');
  if ((process.env.BASE_URL || 'http://127.0.0.1:8000') !== 'http://127.0.0.1:8000') {
    throw new Error('Phase 3 captures must use the original checkout at http://127.0.0.1:8000.');
  }
  const configFile = config.configFile || '';
  const configSource = configFile && require('node:fs').readFileSync(configFile, 'utf8');
  if (!configFile.endsWith(path.join('tests', 'phase-3', 'playwright.config.cjs'))
      || !configSource.includes('phase-3/references')) {
    throw new Error('Phase 3 capture config must target the separate Phase 3 reference tree.');
  }
  execFileSync(process.execPath, ['tests/artifact-lock.mjs'], { cwd: root, stdio: 'inherit' });
};
