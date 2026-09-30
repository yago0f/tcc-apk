const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('src/services/api.js', 'utf8')
 .replace(/^import .*;\n/gm, '').replace(/export const /g, 'const ');
function run(dev, configured, nativeThrows = false) {
 let nativeReads = 0;
 const NativeModules = {get SourceCode() {nativeReads++; if(nativeThrows) throw Error('native startup unavailable'); return {scriptURL:'http://192.168.1.20:8081/index.bundle'};}};
 let interceptor;
 const context = {__DEV__:dev, process:{env:{EXPO_PUBLIC_API_URL:configured}}, NativeModules,
 Platform:{OS:'android'}, axios:{create(options){return {options,interceptors:{request:{use(fn){interceptor=fn;}}}};}}};
 vm.createContext(context);
 vm.runInContext(code+';globalThis.result={API_BASE_URL,api};',context);
 return {...context.result,nativeReads,interceptor};
}
const release = run(false,'https://example.org/api',true);
assert.equal(release.nativeReads,0,'release must not query Metro/native SourceCode');
assert.equal(release.API_BASE_URL,'https://example.org/api');
const missing=run(false,undefined,true);
assert.equal(missing.API_BASE_URL,'');
assert.throws(()=>missing.interceptor({}),/EXPO_PUBLIC_API_URL/);
const dev=run(true,undefined);
assert.equal(dev.API_BASE_URL,'http://192.168.1.20/rebirth-api');
assert.equal(run(false,' https://example.org/api/ ').API_BASE_URL,'https://example.org/api');
console.log('PASS: configured release, missing release URL, development URL, normalization');
