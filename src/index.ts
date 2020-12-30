import { Application, Graphics,Sprite,Texture,SCALE_MODES, settings, Point, Container} from 'pixi.js';
import { Viewport } from 'pixi-viewport'
import {findIndex, range} from "fp-ts/lib/Array"
import { deserialize } from './levelDeserializer';
import { DefaultEntities, DefaultMap } from './exampleLevel';
import { getEntitiesSprites, getFloor, getMinecartPosition, getTilePosition, getTilesSprites, initEntitiyCoordinates, toRotation } from './levelDrawer';
import { setButtonState } from './keyboard';
import { Entity } from './models/Entity';
import { EntityForm } from './models/EntityForm';
import { getOrElse,map, none,Option,getLastMonoid } from 'fp-ts/lib/Option';
import { calculateAcceleration, calculateMove } from './engine';
import {findFirst} from 'fp-ts/lib/Array'
import { pipe } from 'fp-ts/lib/function';
import {  createButton, createIconButton, getMenu, getText } from './button';
import { Tile } from './models/Tile';
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

let tiles:Tile[][];
let entities:Entity[];
let entitiesSprites:Sprite[];
let tilesSprites:Sprite[][];
let selectedEntity:number;
let endgameEntity:Entity;
let success:Option<boolean>;
const startButton = createButton("Start",true);
const retryButton = createButton("Retry",true);
const endMenu = getMenu([retryButton],"You won!")
let retryIconButton :Sprite;
let selection: Sprite;
// const startMenu = createButton("Start",true);
function retry(){
    app.ticker.remove(update);
    setupGame();
}
function setupMenu(){
    const textures = app.loader.resources["assets/controls.json"].textures;
    const cont = new Container();
    startButton.on('click',()=>{retry(); cont.destroy(); startButton.destroy()})
    startButton.position.set(app.view.width/2,120)
    app.stage.addChild(startButton);
    
    const selectCart = getText('select cart with mouse')
    selectCart.position.set(app.view.width/2,180)
    const accelerate = getText('accelerate it using')
    accelerate.position.set(app.view.width/2,240)
    const spacebarIcon = new Sprite(textures['spacebar.png'])
    spacebarIcon.anchor.set(0.5,0.5)
    spacebarIcon.position.set(app.view.width/2,300)
    const direction = getText('choose direction with ')
    direction.position.set(app.view.width/2,380)
    const wsad = new Sprite(textures['wsad.png'])
    wsad.anchor.set(0.5,0.5)
    wsad.position.set(app.view.width/2-100,480)
    const or = getText('or')
    or.position.set(app.view.width/2,440)
    const arrows = new Sprite(textures['arrows.png'])
    arrows.anchor.set(0.5,0.5)
    arrows.position.set(app.view.width/2+100,480)
    cont.addChild(selectCart,accelerate,spacebarIcon,direction,wsad,or,arrows);
    app.stage.addChild(cont);

    endMenu.visible=false;
    retryButton.on('click',()=>{endMenu.visible=false; retry()})
    endMenu.position.set(app.view.width/2,app.view.height/2)
    app.stage.addChild(endMenu);

    retryIconButton = createIconButton(app.loader.resources["assets/textures.json"].textures['retry.png'],false)
    retryIconButton.on('click',retry);
    retryIconButton.position.set(app.view.width-(retryIconButton.width/2),retryIconButton.height/2)
    app.stage.addChild(retryIconButton);
}
function setupGame(){
    const level = deserialize(DefaultMap)(DefaultEntities);
    tiles = level.tiles;
    entities = level.entities;
    viewport.removeChildren();
    viewport
        .drag()
        .pinch()
        .wheel()
        .decelerate()
        .clampZoom({minScale:0.25,maxScale:2})
        .setZoom(0.5)
    pipe(
        entities,
        findFirst((entity:Entity)=>entity.form===EntityForm.mainCart),
        map(mainCart=>viewport.center=(getMinecartPosition(mainCart)))
    )
    retryIconButton.visible=true;
    success = none;
    const textures = app.loader.resources["assets/textures.json"].textures;
    selection = new Sprite(textures['selection.png']);
    selection.anchor.set(0.5,0.5);

    tilesSprites = getTilesSprites(tiles,textures);

    tiles.forEach((row,i)=>row.forEach((tile,j)=>{if(tile.needBackground){const {x,y} = getTilePosition(i,j);viewport.addChild(getFloor(textures,x,y))}}))

    entities = entities.map(initEntitiyCoordinates(tiles))

    selectedEntity = getOrElse(()=>0)(findIndex((item:Entity)=>item.form===EntityForm.mainCart)(entities))
    selection.position.set(entities[selectedEntity].x,entities[selectedEntity].y);
    selection.tint=0xFFFF00;
    
    

    endgameEntity = getOrElse(()=>({} as Entity))(findFirst((item:Entity)=>item.form===EntityForm.finish)(entities))
    entitiesSprites = getEntitiesSprites(entities,textures);
    entitiesSprites.forEach((entitySprite,index)=>{ if(entities[index].selectable){entitySprite.interactive=true;entitySprite.buttonMode=true;entitySprite.on('click',()=>selectedEntity=index)}})
    tilesSprites.forEach(row=>row.forEach(item=>viewport.addChild(item)))
    entitiesSprites.forEach(item=>viewport.addChild(item));
    viewport.addChild(selection);
    app.ticker.add(update);
}
settings.SCALE_MODE = SCALE_MODES.NEAREST;
app.loader
    .add("assets/textures.json")
    .add("assets/controls.json")
    .load(setupMenu)
app.render();
const buttons = setButtonState();

const monoid = getLastMonoid<boolean>();
function update(delta:number){
    entitiesSprites.forEach((sprite,index)=>{success=monoid.concat(calculateMove(tiles)(endgameEntity)(index===selectedEntity)(buttons)(entities[index],delta),success);sprite.x=entities[index].x;sprite.y=entities[index].y;sprite.rotation=entities[index].rotation});
    tilesSprites.forEach((row,i)=>row.forEach((sprite,j)=>{sprite.rotation=toRotation(tiles[i][j].direction)}))
    entities[selectedEntity].velocity=calculateAcceleration(buttons.space,entities[selectedEntity].velocity,entities[selectedEntity].rotation,delta)
    selection.position.set(entities[selectedEntity].x,entities[selectedEntity].y);
    map<boolean,void>(()=>{app.ticker.remove(update); retryIconButton.visible=false;endMenu.visible=true})(success)
}

