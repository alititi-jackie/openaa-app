/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { siteFromOrigin, normalizeAnalyticsPath, referrerHost, agentDimensions, normalizeId } = require('../../features/analytics/shared.ts');

test('collector rejects lookalike origins and invalid paths, strips private URL data', () => {
  assert.equal(siteFromOrigin('https://dmv.openaa.com'), 'dmv');
  for (const origin of ['https://dmv.openaa.com.evil.com', 'null', 'http://openaa.com', 'https://preview.vercel.app']) assert.equal(siteFromOrigin(origin), null);
  for (const path of ['//evil.com', '/\\evil.com', '/admin/users', '/api/x', null]) assert.equal(normalizeAnalyticsPath(path), null);
  assert.equal(normalizeAnalyticsPath('/jobs?email=private#secret'), '/jobs');
  assert.equal(referrerHost('https://google.com/search?q=private#secret'), 'google.com');
  assert.equal(referrerHost('javascript:alert(1)'), null);
  assert.equal(normalizeId({ id: 'spoofed' }), null);
  assert.equal(agentDimensions('Mozilla Android Tablet').device_type, 'tablet');
});

function browser({ storageBlocked = false, hostname = 'dmv.openaa.com' } = {}) {
  const requests = [], callbacks = {}, timers = [];
  const location = { hostname, protocol: 'https:', origin: 'https://' + hostname, pathname: '/ny' };
  const context = { location, document: { visibilityState: 'visible', title: 'NY', referrer: 'https://google.com', addEventListener: (key, fn) => callbacks[key] = fn }, history: { pushState: () => 42, replaceState: () => 43 }, crypto: { randomUUID: require('node:crypto').randomUUID }, setTimeout: (fn) => timers.push(fn), fetch: (url, options) => { requests.push({ url, options, body: JSON.parse(options.body) }); return Promise.resolve({ ok: true }); }, localStorage: { getItem: () => { if(storageBlocked) throw Error('blocked'); return null; }, setItem: () => {} } };
  context.window = { addEventListener: (key, fn) => callbacks[key] = fn };
  vm.runInNewContext(fs.readFileSync('public/analytics/tracker.js','utf8'), context);
  const flush = () => { while(timers.length) timers.shift()(); };
  flush();
  return { context, requests, callbacks, flush };
}
test('tracker survives storage restrictions, tracks SPA transitions once and preserves history result', () => {
  const { context, requests, flush } = browser({ storageBlocked: true });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.credentials, 'omit');
  assert.equal(context.history.replaceState(), 43); flush();
  assert.equal(requests.length, 1);
  context.location.pathname = '/ca';
  assert.equal(context.history.pushState(), 42); flush();
  assert.equal(requests.length, 2);
  assert.equal(requests[0].body.visitor_id, requests[1].body.visitor_id);
  assert.notEqual(requests[0].body.event_id, requests[1].body.event_id);
  context.location.pathname = '/ny'; context.history.pushState(); flush();
  assert.equal(requests.length, 3);
});
test('previews are excluded and background tabs wait until visible', () => {
  assert.equal(browser({ hostname: 'preview.vercel.app' }).requests.length, 0);
  const { context, callbacks, requests, flush } = browser();
  context.document.visibilityState = 'hidden'; context.location.pathname = '/ca'; context.history.pushState(); flush();
  assert.equal(requests.length, 1);
  context.document.visibilityState = 'visible'; callbacks.visibilitychange(); flush();
  assert.equal(requests.length, 2);
});
