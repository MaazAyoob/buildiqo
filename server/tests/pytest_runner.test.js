const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

test('Python Floorplan Microservice pytest suite executes successfully', (t) => {
  const floorplanDir = path.resolve(__dirname, '../../floorplan-service');
  const isWin = process.platform === 'win32';
  const pythonPath = isWin
    ? path.resolve(floorplanDir, '.venv/Scripts/python.exe')
    : path.resolve(floorplanDir, '.venv/bin/python');

  if (!fs.existsSync(pythonPath)) {
    t.skip('Python virtualenv not found at ' + pythonPath);
    return;
  }

  const result = spawnSync(pythonPath, ['-m', 'pytest', '-v'], {
    cwd: floorplanDir,
    encoding: 'utf-8',
    shell: false,
    timeout: 60000
  });

  assert.equal(result.status, 0, `pytest exited with status ${result.status}`);
  assert.match(result.stdout, /passed/i);
});
