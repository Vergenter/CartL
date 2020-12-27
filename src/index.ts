import { Application, Graphics,Sprite,Texture,SCALE_MODES, settings, Point} from 'pixi.js';
import { Viewport } from 'pixi-viewport'
import {findIndex, range} from "fp-ts/lib/Array"
import { deserialize } from './levelDeserializer';
import { DefaultEntities, DefaultMap } from './exampleLevel';
import { getEntitiesSprites, getMinecartPosition, getTilesSprites, initEntitiyCoordinates, toRotation } from './levelDrawer';
import { setButtonState } from './keyboard';
import { Entity } from './models/Entity';
import { EntityForm } from './models/EntityForm';
import { getOrElse,map } from 'fp-ts/lib/Option';
import { calculateAcceleration, calculateMove } from './engine';
import {findFirst} from 'fp-ts/lib/Array'
import { pipe } from 'fp-ts/lib/function';
// const button = document.querySelector('#start');
// button.addEventListener('click', () => {
//     button.classList.add('hide');
// });
const app = new Application();
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.resize(window.innerWidth, window.innerHeight);
document.body.appendChild(app.view);
const worldWidth= 800;
const worldHeight= 800;
const viewport = new Viewport({
    screenWidth: app.view.width,
    screenHeight: app.view.height,
    worldWidth,
    worldHeight,
    interaction: app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
})
app.stage.addChild(viewport)
viewport
    .drag()
    .pinch()
    .wheel()
    .decelerate()
    .clampZoom({minScale:0.25,maxScale:2})
    .setZoom(0.5)
let {tiles,entities} = deserialize(DefaultMap)(DefaultEntities);
pipe(
    entities,
    findFirst((entity:Entity)=>entity.form===EntityForm.mainCart),
    map(mainCart=>viewport.moveCenter(getMinecartPosition(mainCart)))
)
let entitiesSprites:Sprite[];
let tilesSprites:Sprite[][];
let selectedEntity:number;
let state:(delta:number)=>void;
function setup(){
    const textures = app.loader.resources["assets/textures.json"].textures;
    tilesSprites = getTilesSprites(tiles,textures);
    entities = entities.map(initEntitiyCoordinates(tiles))
    selectedEntity = getOrElse(()=>0)(findIndex((item:Entity)=>item.form===EntityForm.mainCart)(entities))
    entitiesSprites = getEntitiesSprites(entities,textures);
    tilesSprites.forEach(row=>row.forEach(item=>viewport.addChild(item)))
    entitiesSprites.forEach(item=>viewport.addChild(item));
    state = update;
    app.ticker.add(state);
}
settings.SCALE_MODE = SCALE_MODES.NEAREST;
app.loader
    .add("assets/textures.json")
    .load(setup)
app.render();
const buttons = setButtonState();
function update(delta:number){
    entitiesSprites.forEach((sprite,index)=>{calculateMove(tiles)(buttons)(entities[index],delta);sprite.x=entities[index].x;sprite.y=entities[index].y;sprite.rotation=entities[index].rotation});
    tilesSprites.forEach((row,i)=>row.forEach((sprite,j)=>{sprite.rotation=toRotation(tiles[i][j].direction)}))
    entities[selectedEntity].velocity=calculateAcceleration(buttons.space,entities[selectedEntity].velocity,entities[selectedEntity].rotation,delta)
}