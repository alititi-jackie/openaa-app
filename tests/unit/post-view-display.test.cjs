/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
require('../fixtures/load-typescript.cjs');
const { normalizePostViewSettings } = require('../../features/posts/viewSettings.ts');

test('post display defaults preserve existing visibility and switches remain independent', () => {
  assert.deepEqual(normalizePostViewSettings(null), { detail: true, list: true });
  for (const detail of [false,true]) for (const list of [false,true]) {
    assert.deepEqual(normalizePostViewSettings({detail,list}), {detail,list});
  }
  assert.deepEqual(normalizePostViewSettings({detail:'true',list:1}), {detail:false,list:false});
});

test('shared pills hide only views for the selected surface, preserving other grouped metadata', () => {
  let settings = {detail:true,list:false};
  const originalLoad = Module._load;
  Module._load = function(id, ...args) {
    if (id === './PostViewDisplay') return { usePostViewDisplay: scope => settings[scope] };
    if (id === './PostViewTracker') return { PostViewTracker: () => React.createElement('span', null, 'LIVE_VIEWS') };
    if (id === '@/features/posts/display') return { formatPostTime: v => v, formatViewCount: v => 'VIEWS_'+v };
    return originalLoad.call(this,id,...args);
  };
  try {
    const filename = require.resolve('../../components/posts/DetailMetaPills.tsx');
    const compiled = ts.transpileModule(fs.readFileSync(filename,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS, jsx:ts.JsxEmit.ReactJSX}}).outputText;
    const mod = new Module(filename,module); mod.filename=filename; mod.paths=module.paths; mod._compile(compiled,filename);
    const { DetailMetaPills }=mod.exports;
    const items = [{key:'author',group:'common',label:'作者',value:'Jackie'}, {key:'views',group:'common',label:'浏览',value:'123'}, {key:'area',group:'business',label:'地区',value:'纽约'}];
    const render = trackViews => renderToStaticMarkup(React.createElement(DetailMetaPills,{items,postId:'test',initialViewCount:123,trackViews}));
    assert.match(render(true), /LIVE_VIEWS/);
    assert.doesNotMatch(render(false), /VIEWS_/);
    settings = {detail:false,list:true};
    assert.doesNotMatch(render(true), /LIVE_VIEWS|VIEWS_/);
    assert.match(render(false), /VIEWS_123/);
    settings = {detail:false,list:false};
    const hidden = render(false);
    assert.doesNotMatch(hidden, /LIVE_VIEWS|VIEWS_/);
    assert.match(hidden,/Jackie/); assert.match(hidden,/纽约/);
    assert.equal(renderToStaticMarkup(React.createElement(DetailMetaPills,{items:[items[1]],postId:'test',initialViewCount:123})), '');
  } finally { Module._load=originalLoad; }
});

test('compact shared controls expose two independent accessible switches and respect read-only permissions', () => {
  const filename = require.resolve('../../components/admin/ViewDisplaySettings.tsx');
  const compiled = ts.transpileModule(fs.readFileSync(filename,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS, jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const mod = new Module(filename,module); mod.filename=filename; mod.paths=module.paths; mod._compile(compiled,filename);
  const { ViewDisplaySettings } = mod.exports;
  const props = {initial:{detail:false,list:true},available:true,canEdit:true,saveSettings:async () => ({ok:true,message:'已保存'}),permissionMessage:'需要管理权限'};
  const editable = renderToStaticMarkup(React.createElement(ViewDisplaySettings,props));
  assert.equal((editable.match(/role="switch"/g)||[]).length,2);
  assert.match(editable,/aria-checked="false"/); assert.match(editable,/aria-checked="true"/);
  const readonly = renderToStaticMarkup(React.createElement(ViewDisplaySettings,{...props,canEdit:false}));
  assert.equal((readonly.match(/disabled=""/g)||[]).length,2);
  assert.match(readonly,/需要管理权限/);
});
