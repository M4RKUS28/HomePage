// Regression tests for nextfrontend/ecosystem.config.js PM2 log paths.
// /dev/stdout is a pipe inside Docker and cannot be opened as a log file
// (ENXIO crashes the app in cluster mode).
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const config = require(path.join(__dirname, '..', 'ecosystem.config.js'));

test('one app definition using server.js in cluster mode', () => {
  assert.strictEqual(config.apps.length, 1);
  const app = config.apps[0];
  assert.strictEqual(app.script, 'server.js');
  assert.strictEqual(app.exec_mode, 'cluster');
});

test('log paths live under /app/logs and are not /dev/stdout|stderr', () => {
  const app = config.apps[0];
  for (const key of ['log_file', 'out_file', 'error_file']) {
    const value = app[key];
    assert.ok(value, `${key} must be set`);
    assert.ok(
      value.startsWith('/app/logs/'),
      `${key} must reside in /app/logs, got ${value}`,
    );
    assert.notStrictEqual(value, '/dev/stdout');
    assert.notStrictEqual(value, '/dev/stderr');
  }
});
