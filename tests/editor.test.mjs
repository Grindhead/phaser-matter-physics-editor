import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const Emitter=require('phaser/src/events/EventEmitter');
function load(file,deps={}){const code=ts.transpileModule(readFileSync(new URL('../'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const exports={};vm.runInNewContext(code,{exports,require:name=>{if(!(name in deps))throw new Error(name);return deps[name];},console:{log(){},warn(){},error(){}},Set,FileReader:class {readAsText(file){this.onload({target:{result:file.text}})}},alert:message=>alerts.push(message)});return exports;}
const {LevelDataManager}=load('src/editor/lib/LevelData.ts');
const {EditorEvents}=load('src/editor/lib/EditorEventTypes.ts');
const {EditorEventBus}=load('src/editor/lib/EditorEventBus.ts',{'./EditorEventTypes':{EditorEvents},'phaser':{Events:{EventEmitter:Emitter},Scenes:{Events:{SHUTDOWN:'shutdown'}}}});
function scene(){return {events:new Emitter(),scene:{key:'fixture'}};}
let alerts=[];
test('level parsing rejects malformed schemas and keeps an explicit empty level valid',()=>{
 const empty=LevelDataManager.createEmpty();assert.deepEqual(JSON.parse(JSON.stringify(LevelDataManager.deserialize(JSON.stringify(empty)))),JSON.parse(JSON.stringify(empty)));
 for(const bad of ['{','null','{}',JSON.stringify({...empty,platforms:'wrong'}),JSON.stringify({...empty,player:{x:'1',y:2}}),' {"platforms":[],"enemies":[],"crates":[],"barrels":[],"finishLine":{"x":1e999,"y":0}}',JSON.stringify({...empty,platforms:[{id:'p',x:0,y:0,segmentCount:0,isVertical:false}]}),JSON.stringify({...empty,platforms:[{id:'p',x:0,y:0,segmentCount:1.5,isVertical:false}]})])assert.throws(()=>LevelDataManager.deserialize(bad));
});
test('invalid file reads emit no load command, while a valid file emits once',()=>{
 alerts=[];const bus=EditorEventBus.getInstance(),s=scene();bus.initialize(s);let loaded=0;bus.on(EditorEvents.LEVEL_LOADED,()=>loaded++);
 const {EditorLevelHandler}=load('src/editor/lib/EditorLevelHandler.ts',{'./LevelData':{LevelDataManager},'./EditorEventBus':{EditorEventBus},'./EditorEventTypes':{EditorEvents}});
 const handler=new EditorLevelHandler({});handler.handleFileLoad({text:'{'});assert.equal(loaded,0);assert.equal(alerts.length,1);handler.handleFileLoad({text:JSON.stringify(LevelDataManager.createEmpty())});assert.equal(loaded,1);
});
test('commands are delivered once, nested completion is retained, and cycles terminate',()=>{
 const bus=EditorEventBus.getInstance(),s=scene();bus.initialize(s);let commands=0,completed=0,selected=0;
 bus.on(EditorEvents.PLACE_ENTITY,()=>{commands++;bus.entityPlaced({id:'one'});});
 bus.on(EditorEvents.ENTITY_PLACED,()=>{completed++;bus.entitySelected({id:'one'});});
 bus.on(EditorEvents.ENTITY_SELECTED,()=>{selected++;bus.placeEntity('platform',0,0);});
 bus.placeEntity('platform',0,0);assert.equal(commands,1);assert.equal(completed,1);assert.equal(selected,1);
});
class Platform {constructor(scene,x,y,segmentCount,id,isVertical){Object.assign(this,{x,y,segmentCount,id,isVertical});}destroy(){}setPosition(x,y){this.x=x;this.y=y;}}
const {EntityUpdater}=load('src/editor/lib/EntityUpdater.ts',{'../../entities/Platforms/Platform':{Platform},'./EditorEventBus':{EditorEventBus},'./EditorEventTypes':{EditorEvents}});
test('inspector coordinates update render, data and one saved entry without ghosts',()=>{
 const s=scene();EditorEventBus.getInstance().initialize(s);const level=LevelDataManager.createEmpty(),updater=new EntityUpdater(s,level);
 for(const [type,field,data] of [['player','player',{x:1,y:2}],['platform','platforms',{x:1,y:2,id:'p',segmentCount:3,isVertical:false}],['crate-small','crates',{x:1,y:2,type:'small'}],['enemy-small','enemies',{x:1,y:2,type:'enemy-small'}],['barrel','barrels',{x:1,y:2}],['finish-line','finishLine',{x:1,y:2}]]){
  if(Array.isArray(level[field]))level[field].push({...data});else level[field]={...data};
  const object={x:1,y:2,setPosition(x,y){this.x=x;this.y=y;}},entity={type,x:1,y:2,data:{...data},gameObject:object};
  updater.updateEntityProperty(entity,'x',10);updater.updateEntityProperty(entity,'y',20);assert.equal(entity.x,10);assert.equal(entity.data.x,10);assert.equal(object.y,20);
  const saved=Array.isArray(level[field])?level[field][0]:level[field];assert.equal(saved.x,10);assert.equal(saved.y,20);if(Array.isArray(level[field]))assert.equal(level[field].length,1);
  updater.updateEntityProperty(entity,'x',Infinity);assert.equal(entity.x,10);
 }
});
test('orientation changes reconstruct the platform while preserving position and saved direction',()=>{
 const s=scene();EditorEventBus.getInstance().initialize(s);const level=LevelDataManager.createEmpty(),updater=new EntityUpdater(s,level);const entity={type:'platform',x:10,y:20,data:{id:'p',x:10,y:20,segmentCount:3,isVertical:false},gameObject:new Platform(s,10,20,3,'p',false)};
 for(const direction of [true,false]){updater.updateEntityProperty(entity,'isVertical',direction);assert.equal(entity.gameObject.isVertical,direction);assert.equal(entity.gameObject.x,10);assert.equal(level.platforms[0].isVertical,direction);assert.equal(level.platforms.length,1);}
});
