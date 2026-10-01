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

  if (result.status !== 0) {
    console.error('PYTEST STDOUT:\n', result.stdout);
    console.error('PYTEST STDERR:\n', result.stderr);
  }
  assert.equal(result.status, 0, `pytest exited with status ${result.status}\nSTDOUT: ${result.stdout}\nSTDERR: ${result.stderr}`);
  assert.match(result.stdout, /passed/i);
});

test('Python Phase 2.1 Realistic Solver Matrix executes successfully', (t) => {
  const floorplanDir = path.resolve(__dirname, '../../floorplan-service');
  const isWin = process.platform === 'win32';
  const pythonPath = isWin
    ? path.resolve(floorplanDir, '.venv/Scripts/python.exe')
    : path.resolve(floorplanDir, '.venv/bin/python');

  if (!fs.existsSync(pythonPath)) {
    t.skip('Python virtualenv not found at ' + pythonPath);
    return;
  }

  const result = spawnSync(pythonPath, ['verify_phase21.py'], {
    cwd: floorplanDir,
    encoding: 'utf-8',
    shell: false,
    timeout: 120000
  });

  if (result.status !== 0) {
    console.error('VERIFY PHASE 2.1 STDOUT:\n', result.stdout);
    console.error('VERIFY PHASE 2.1 STDERR:\n', result.stderr);
  }
  assert.equal(result.status, 0, `verify_phase21.py exited with status ${result.status}\nSTDOUT: ${result.stdout}\nSTDERR: ${result.stderr}`);
});

