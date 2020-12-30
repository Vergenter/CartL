import { ITextureDictionary, Point, Sprite, Texture } from "pixi.js";
import { backgroundColor } from "./colors";
import { Entity } from "./models/Entity";
import { EntityForm } from "./models/EntityForm";
import { Tile } from "./models/Tile";
import { TileForm, walls } from "./models/TileForm";

function getTileTexture(t:TileForm,dir:number){
    const wall = walls.indexOf(t);
    if(wall>=0){
        return ['bottomWall.png','bottomLeftWall.png','leftWall.png','topLeftWall.png','topWall.png','topRightWall.png','rightWall.png','bottomRightWall.png','outerBottomLeftWall.png','outerTopLeftWall.png','outerTopRightWall.png','outerBottomRightWall.png'][wall]
    }
    switch(t){
        case TileForm.empty: return "";
        case TileForm.floor: return 'floor.png'
        case TileForm.crossroads: return "4way.png";
        case TileForm.path: return "path.png";
        case TileForm.turn: return "turn.png";
        case TileForm.threeWay: return "3way.png";
        case TileForm.threeWayTurnOnly: return "special3wayTurnOnly.png";
        case TileForm.turnBack: return "roundabout.png";
        case TileForm.specialTurn: return "specialTurn.png";
        case TileForm.specialThreeWay: return "special3way.png";
        case TileForm.specialThreeWayTurnOnly: return "special3wayTurnOnly.png";
        case TileForm.specialThreeWayForced: return "special3wayForcedThrough.png";
    }
}

export function getFloor(textures:ITextureDictionary,x:number,y:number){
    const background = new Sprite(textures['floor.png'])
    background.tint=backgroundColor
    background.anchor.set(0.5,0.5);
    background.position.set(x,y)
    return background;
}
function getEntityTexture(e:EntityForm){
    switch(e){
        case EntityForm.mainCart: return "cart.png";
        case EntityForm.cart: return "cart.png";
        case EntityForm.finish: return "end.png";
    }
}
export function toRotation(direction:number){
    return (direction*Math.PI)/2
}
function getSprite(texture:Texture,rotation:number,x:number,y:number,tint:number=0xffffff){
    const result = new Sprite(texture);
    result.anchor.set(0.5,0.5);
    result.rotation=rotation;
    result.position.set(x,y);
    result.tint=tint;
    return result;
}
const textureSize=64;
export function getTilePosition(rowIndex:number,index:number):{x:number,y:number}{
    const x = index*textureSize;
    const y = rowIndex*textureSize;
    return {x,y}
}
export function getTilesSprites(tiles:Tile[][],textures:ITextureDictionary):Sprite[][]{
    return tiles.map((row,i)=>row.map((tile,j)=> getSprite(textures[getTileTexture(tile.form,tile.direction)],toRotation(tile.direction),j*textureSize,i*textureSize,tile.color)))
}
function getDirectionBetweenTiles(tile:[number,number],nextTile:[number,number]):number{
    if( tile[0]>nextTile[0]){
        return 2;
    } else if(tile[0]<nextTile[0]){
        return 0;
    } else if(tile[1]>nextTile[1]){
        return 1;
    } else if(tile[1]<nextTile[1]){
        return 3;
    } else {
        throw new Error("Incorrect tiles to get direction!");
    }
}
export function initEntitiyCoordinates(tiles:Tile[][]){
    return (entity:Entity):Entity=>{
        const currDistance = entity.form===EntityForm.finish?tiles[entity.currTile[0]][entity.currTile[1]].length/2:0;
        const [x,y,rotation] = getInTilePosition(tiles)(getDirectionBetweenTiles(entity.oldTile,entity.currTile))(entity.currTile)(getDirectionBetweenTiles(entity.nextTile,entity.currTile))(currDistance);
        return {...entity,x,y,rotation,currDistance}
    }
}
export function getEntitiesSprites(entities:Entity[],textures:ITextureDictionary):Sprite[]{
    return entities.map(entity=>getSprite(textures[getEntityTexture(entity.form)],entity.rotation,entity.x,entity.y,entity.color));
}

const shiftPosition=(coord:[number,number])=>(modifier:number) =>(direction:number):[number,number]=>{
    const maxShift = textureSize/2;
    let xdiff=0,ydiff=0;
    switch(direction){
        case 2: ydiff=-1; break;
        case 1: xdiff=-1; break;
        case 0: ydiff=1; break;
        case 3: xdiff=1; break;
        default: break;
    }
    const changedModfier =Math.abs(modifier)
    return [coord[0]+xdiff*changedModfier*maxShift,coord[1]+ydiff*changedModfier*maxShift] 
}
const inverseDirection = (dir:number)=> {
    return (dir+2)%4;
}
export const getInTilePosition=(tiles:Tile[][])=>(currTileToDirection:number)=>(currTile:[number,number])=>(nextTileToDirection:number)=>(path:number):[number,number,number]=>{
    const currentTile = tiles[currTile[0]][currTile[1]];
    const place = path/currentTile.length;
    const currXY = [currTile[1]*textureSize,currTile[0]*textureSize] as [number,number]
    const modifier = (place-0.5)*2;
    const entityDirection = place<0.5?currTileToDirection:nextTileToDirection;
    const shiftDirection = place<0.5?inverseDirection(currTileToDirection):nextTileToDirection;
    const newXY = shiftPosition(currXY)(modifier)(shiftDirection);
    return [newXY[0],newXY[1],toRotation(entityDirection)]
}
export function getMinecartPosition(entity:Entity):Point{
    return new Point(entity.currTile[1]*textureSize,entity.currTile[0]*textureSize)
}