import { ButtonsState } from "./keyboard";
import { Entity } from "./models/Entity";
import {clamp,ordNumber} from 'fp-ts/lib/Ord';
import { Tile } from "./models/Tile";
import {Eq,eqNumber} from 'fp-ts/lib/Eq'
import { Sprite } from "pixi.js";
import { TileForm } from "./models/TileForm";
import {isNone, Option,map, none,some,isSome, chain} from 'fp-ts/lib/Option'
import { getInTilePosition } from "./levelDrawer";
import { pipe } from "fp-ts/lib/function";
const numberClamp = clamp(ordNumber); 
function acceleration(velocity:number,delta:number){
    return velocity + Math.cos(numberClamp(0,Math.PI/2)(velocity/8))*delta/6
}
function slowDown(velocity:number,delta:number){
    return numberClamp(0,Infinity)(velocity-delta/10);
}
export function calculateAcceleration(accelerate:boolean,velocity:number,rotation:number,delta:number){
    return slowDown(accelerate?acceleration(velocity,delta):velocity,delta)
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
function canTurnDown(tile:Tile,fromDirection:number,destination:boolean){
    if(fromDirection===0&&destination){
        return tile.form === TileForm.turnBack&&tile.direction===0;
    }
    switch(tile.form){
        case TileForm.crossroads: return true;
        case TileForm.path: return tile.direction%2===0;
        case TileForm.specialTurn:
        case TileForm.turn: return tile.direction===0||tile.direction===1;
        case TileForm.specialThreeWay:
        case TileForm.threeWay: return tile.direction!==0&&tile.direction!==fromDirection;
        case TileForm.specialThreeWayTurnOnly:
        case TileForm.threeWayTurnOnly: return tile.direction!==0&&fromDirection!==2;
        case TileForm.specialThreeWayForced: return destination?tile.direction%2===1:tile.direction!==0; //three way or two turn only
        case TileForm.turnBack: return tile.direction===0;
        default: return false;
    }
}
function canTurnLeft(tile:Tile,fromDirection:number,destination:boolean){
    if(fromDirection===1&&destination){
        return tile.form === TileForm.turnBack&&tile.direction===1;
    }
    switch(tile.form){
        case TileForm.crossroads: return true;
        case TileForm.path: return tile.direction%2===1;
        case TileForm.specialTurn:
        case TileForm.turn: return tile.direction===1||tile.direction===2;
        case TileForm.specialThreeWay:
        case TileForm.threeWay: return tile.direction!==1&&tile.direction!==fromDirection;
        case TileForm.specialThreeWayTurnOnly:
        case TileForm.threeWayTurnOnly: return tile.direction!==1&&fromDirection!==3;
        case TileForm.specialThreeWayForced: return destination?tile.direction%2===0:tile.direction!==1;
        case TileForm.turnBack: return tile.direction===1;
        default: return false;
    }
}
function canTurnUp(tile:Tile,fromDirection:number,destination:boolean){
    if(fromDirection===2&&destination){
        return tile.form === TileForm.turnBack&&tile.direction===2;
    }
    switch(tile.form){
        case TileForm.crossroads: return true;
        case TileForm.path: return tile.direction%2===0;
        case TileForm.specialTurn:
        case TileForm.turn: return tile.direction===2||tile.direction===3;
        case TileForm.specialThreeWay:
        case TileForm.threeWay: return tile.direction!==2&&tile.direction!==fromDirection;
        case TileForm.specialThreeWayTurnOnly:
        case TileForm.threeWayTurnOnly: return tile.direction!==2&&fromDirection!==0;
        case TileForm.specialThreeWayForced: return destination?tile.direction%2===1:tile.direction!==2;
        case TileForm.turnBack: return tile.direction===2;
        default: return false;
    }
}
function canTurnRight(tile:Tile,fromDirection:number,destination:boolean){
    if(fromDirection===3&&destination){
        return tile.form === TileForm.turnBack&&tile.direction===3;
    }
    switch(tile.form){
        case TileForm.crossroads: return true;
        case TileForm.path: return tile.direction%2===1;
        case TileForm.specialTurn:
        case TileForm.turn: return tile.direction===3||tile.direction===0;
        case TileForm.specialThreeWay:
        case TileForm.threeWay: return tile.direction!==3&&tile.direction!==fromDirection;
        case TileForm.specialThreeWayTurnOnly:
        case TileForm.threeWayTurnOnly: return tile.direction!==3&&fromDirection!==1;
        case TileForm.specialThreeWayForced: return destination?tile.direction%2===0:tile.direction!==3;
        case TileForm.turnBack: return tile.direction===3;
        default: return false;
    }
}
const canTurns = [canTurnDown,canTurnLeft,canTurnUp,canTurnRight]
// const getPostionInTile()
const getTileFromDirection=(tiles:Tile[][])=>(from:[number,number])=>(dir:number):Option<[number,number]>=>{
    switch(dir){
        case 3: return tiles.length>from[0]&&tiles[from[0]].length>from[1]+1?some([from[0],from[1]+1]):none;
        case 2: return from[0]>0?some([from[0]-1,from[1]]):none;
        case 1: return tiles.length>from[0]&&from[1]>0?some([from[0],from[1]-1]):none;
        case 0: return from[0]+1<tiles.length?some([from[0]+1,from[1]]):none;
        default: return none;
    }
}
const getNextTile = (buttons:ButtonsState)=>(tiles:Tile[][])=>(currTile:[number,number])=>(nextTile:[number,number]):Option<[number,number]>=>{
    //check possible options that we get from type
    const nTile= tiles[nextTile[0]][nextTile[1]];
    const fromNextToCurr = getDirectionBetweenTiles(nextTile,currTile)
    if(!canTurns[fromNextToCurr](nTile,fromNextToCurr,false)){
        return none;
    }
    // can i move to next tile and it's exist :)
    const canTurnDir = [0,1,2,3].map((dir)=>canTurns[dir](nTile,fromNextToCurr,true))
    if(canTurnDir.every(can=>!can)){
        return none;
    }
    if(canTurnDir.filter(can=>can).length===1){
        return getTileFromDirection(tiles)(nextTile)(canTurnDir.indexOf(true))
    }
    const decisionFromButtons = [buttons.down,buttons.left,buttons.up,buttons.right].map((state,index)=>state&&canTurnDir[index]);
    if(decisionFromButtons.filter(can=>can).length===1){
        return getTileFromDirection(tiles)(nextTile)(decisionFromButtons.indexOf(true))
    } else {
        return none;
    }
}
const tupleEq:Eq<[number,number]> = {
    equals: (x,y)=>eqNumber.equals(x[0],y[0])&&eqNumber.equals(x[1],y[1])
} 
const isCurrTileSpecial=(form:TileForm)=>{
    const specialForms=[TileForm.specialTurn,TileForm.specialThreeWay,TileForm.specialThreeWayTurnOnly,TileForm.specialThreeWayForced]
    return specialForms.some(specialForm=>specialForm===form);
}
const updateTile=(tiles:Tile[][])=>(oldTile:[number,number])=>(currTile:[number,number])=>(nextTile:[number,number])=>{
    const oldDiff = [oldTile[0]-currTile[0],oldTile[1]-currTile[1]] as [number,number]
    const newDiff = [nextTile[0]-currTile[0],nextTile[1]-currTile[1]] as [number,number]
    if(
        (oldDiff[0]===1 && oldDiff[1]===0 && newDiff[0]===0 && newDiff[1]===1)
        || (oldDiff[0]===0 && oldDiff[1]===1 && newDiff[0]===-1 && newDiff[1]===0)
        || (oldDiff[0]===-1 && oldDiff[1]===0 && newDiff[0]===0 && newDiff[1]===-1)
        || (oldDiff[0]===0 && oldDiff[1]===-1 && newDiff[0]===1 && newDiff[1]===0)
    ) {
        tiles[currTile[0]][currTile[1]].direction=(tiles[currTile[0]][currTile[1]].direction+3)%4
    } else if (
        (oldDiff[0]===1 && oldDiff[1]===0 && newDiff[0]===0 && newDiff[1]===-1)
        || (oldDiff[0]===0 && oldDiff[1]===-1 && newDiff[0]===-1 && newDiff[1]===0)
        || (oldDiff[0]===-1 && oldDiff[1]===0 && newDiff[0]===0 && newDiff[1]===1)
        || (oldDiff[0]===0 && oldDiff[1]===1 && newDiff[0]===1 && newDiff[1]===0)
    ){
        tiles[currTile[0]][currTile[1]].direction=(tiles[currTile[0]][currTile[1]].direction+1)%4
    }
}
const emptyButtons = {
    down:false,
    left:false,
    up:false,
    right:false,
    space:false
};
export const calculateMove = (tiles:Tile[][])=>(endGame:Entity)=>(selection:boolean)=>(buttons:ButtonsState)=>(entity:Entity,delta:number)=>{
    let path = entity.velocity*delta +entity.currDistance;
    while(path>0){
        const currTile = tiles[entity.currTile[0]][entity.currTile[1]];
        if(path<=currTile.length){
            entity.currDistance=path;
            path=0;
            break;
        }
        path-=currTile.length;
        const futureTile = getNextTile(selection?buttons:emptyButtons)(tiles)(entity.currTile)(entity.nextTile);
        if(isNone(futureTile)){
            path=0;
            entity.currDistance=currTile.length;
            entity.velocity=0;
            break;
        }
        if(isCurrTileSpecial(currTile.form)){
            updateTile(tiles)(entity.oldTile)(entity.currTile)(entity.nextTile);
        }
        const result = pipe(
            (futureTile),
            chain<[number,number],boolean>((found)=>{
                entity.oldTile=entity.currTile;
                entity.currTile=entity.nextTile;
                entity.nextTile=found;
                return (entity.currTile[0]===endGame.currTile[0]&&entity.currTile[1]===endGame.currTile[1])?some(true):none;
            }),
        )
        if(isSome(result)){
            return result;
        } 
    }
    const [x,y,rotation] = getInTilePosition(tiles)(getDirectionBetweenTiles(entity.oldTile,entity.currTile))(entity.currTile)(getDirectionBetweenTiles(entity.currTile,entity.nextTile))(entity.currDistance);
    entity.x=x;
    entity.y=y;
    entity.rotation=rotation;
    return none;
}
