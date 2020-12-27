import { Sprite } from "pixi.js";
import { Entity } from "./models/Entity";
import { EntityForm } from "./models/EntityForm";
import { Level } from "./models/Level";
import { Tile } from "./models/Tile";
import { TileForm } from "./models/TileForm";
/**
 *   <0,3> -> mainCart
 *   <4,7> -> cart,
 *   8     -> finish
 */
function validateEntityId(id:number){
    if(!Number.isInteger(id)){
        throw new Error("Invalid entity id");
    } else if (id<0||id>8){
        throw new Error("Entity id not in domain");
    }
}
function getEntityForm(id:number){
    validateEntityId(id);
    if(id>=0&&id<4){
        return EntityForm.mainCart;
    } else if (id>=4&&id<8){
        return EntityForm.cart;
    } else if(id===8){
        return EntityForm.finish;
    }   
}
function getEntityDirection(id:number){
    validateEntityId(id);
    return id%4;
}
/**
 *  0       -> empty
 *  1       -> crossroads,
 *  2       -> pathVertical
 *  3       -> pathHorizontal
 *  <4,7>   -> turn,
 *  <8,11>  -> threeWay,
 *  <12,15> -> threeWayTurnOnly
 *  <16,19> -> turnBack,
 *  <20,23> -> specialTurn
 *  <24,27> -> specialThreeWay,
 *  <28,31> -> specialThreeWayTurnOnly
 *  <32,35> -> specialThreeWayForced,
 */
function validateTileId(id:number){
    if(!Number.isInteger(id)){
        throw new Error("Invalid tile id");
    } else if (id<0||id>35){
        throw new Error("Tile id not in domain");
    }
}
function getTileForm(id:number){
    validateTileId(id);
    if(id===0){
        return TileForm.empty;
    } else if (id===1){
        return TileForm.crossroads;
    } else if (id===2||id===3){
        return TileForm.path;
    } else if (id>=4&&id<=7){
        return TileForm.turn;
    } else if (id>=8&&id<=11){
        return TileForm.threeWay;
    } else if (id>=12&&id<=15){
        return TileForm.threeWayTurnOnly;
    } else if (id>=16&&id<=19){
        return TileForm.turnBack;
    } else if (id>=20&&id<=23){
        return TileForm.specialTurn;
    } else if (id>=24&&id<=27){
        return TileForm.specialThreeWay;
    } else if (id>=28&&id<=31){
        return TileForm.specialThreeWayTurnOnly;
    } else if (id>=32&&id<=35){
        return TileForm.specialThreeWayForced;
    }
}
function getTileDirection(id:number){
    validateTileId(id);
    if(id===0){
        return 0;
    } else if (id===1){
        return 0;
    } else if (id===2||id===3){
        return id-2;
    } else{
        return id%4;
    }
}
function getTileColor(form:TileForm){
    const specialTiles = [TileForm.specialTurn,TileForm.specialThreeWay,TileForm.specialThreeWayTurnOnly,TileForm.specialThreeWayForced];
    return specialTiles.some(specialTile=>specialTile===form)?0x8080ff:0xffffff;
    
}

function getTile(id:number):Tile{
    const tileForm = getTileForm(id)
    return {
        form:tileForm,
        direction:getTileDirection(id),
        length:64,
        color:getTileColor(tileForm)
    }
}
function getEntityColor(form:EntityForm){
    switch(form){
        case EntityForm.mainCart: return 0xFF8C00;
        case EntityForm.finish: return 0xffff00;
        default: return 0xffffff;
    }  
}
function getEntity(tiles:Tile[][]){
    return (entity:[number,number,number]):Entity=>{
        const id = entity[0];
        const direction = getEntityDirection(id);
        const form=getEntityForm(id);
        const selectable = form===EntityForm.cart||form===EntityForm.mainCart;
        const nextX= direction===0?1:direction===2?-1:0;
        const nextY= direction===3?1:direction===1?-1:0;
        return {
            rotation: direction*Math.PI/2,
            form:getEntityForm(id),
            x:undefined,
            y:undefined,
            selectable,
            velocity:0,
            oldTile:[entity[1]-nextX,entity[2]-nextY],
            currTile:[entity[1],entity[2]],
            currDistance:0,
            nextTile:[entity[1]+nextX,entity[2]+nextY],
            color: getEntityColor(form)
        }
    }
}

export function deserialize(map:number[][]) {
    return (entities:[number,number,number][]):Level=>
    {
        const tiles = map.map((row,i)=>row.map((item,j)=>getTile(item)));
        return {
            tiles,
            entities: entities.map(getEntity(tiles))
        }
    }
        
}