import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as model from "../src/lib/events/model.ts";

const source=readFileSync(new URL("../src/app/event-studio/studio.tsx",import.meta.url),"utf8");
const require=createRequire(import.meta.url);
const {outputText}=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
const exports={};
vm.runInNewContext(outputText,{
 exports,
 require(id){
   if(id==="@/lib/events/model") return model;
   if(id==="next/link" || id==="./programme") return {default:()=>null};
   return require(id);
 },
},{filename:"studio.tsx"});
const WPU={id:"wpu",name:"World Pickleball Union"}, Bhutan={id:"bhutan",name:"Bhutan Federation"};
const render=organisations=>renderToStaticMarkup(createElement(exports.default,{organisations,initialEvents:[]}));
test("one workspace shows the host name with no picker",()=>{
 const html=render([WPU]);
 assert.match(html,/<strong>World Pickleball Union<\/strong>/);
 assert.doesNotMatch(html,/<select/);
});
test("multiple eligible hosting workspaces show a labelled picker",()=>{
 const html=render([WPU,Bhutan]);
 assert.match(html,/<label for="es-organisation">Hosting organisation<\/label>/);
 assert.match(html,/<select id="es-organisation">/);
 assert.match(html,/<option value="wpu" selected="">World Pickleball Union<\/option>/);
 assert.match(html,/<option value="bhutan">Bhutan Federation<\/option>/);
});
