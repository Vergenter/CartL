import { empty } from "fp-ts/lib/ReadonlyRecord";
import { Sprite } from "pixi.js";
import { backgroundColor } from "./colors";
import { Entity } from "./models/Entity";
import { EntityForm } from "./models/EntityForm";
import { Level } from "./models/Level";
import { Tile } from "./models/Tile";
import { TileForm, walls } from "./models/TileForm";
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
 *  1       -> floor
 *  <2,13>   -> wall
 *  14       -> crossroads,
 *  15       -> pathVertical
 *  16       -> pathHorizontal
 *  <17,20>   -> turn,
 *  <21,24>  -> threeWay,
 *  <25,28> -> threeWayTurnOnly
 *  <29,32> -> turnBack,
 *  <33,36> -> specialTurn
 *  <37,40> -> specialThreeWay,
 *  <41,44> -> specialThreeWayTurnOnly
 *  <45,48> -> specialThreeWayForced,
 */
function validateTileId(id:number){
    if(!Number.isInteger(id)){
        throw new Error("Invalid tile id");
    } else if (id<0||id>48){
        throw new Error("Tile id not in domain");
    }
}
function needBackground(form:TileForm){
    return form!==TileForm.empty&&form!==TileForm.floor&&walls.every(wall=>wall!==form);
}
function getTileForm(id:number){
    validateTileId(id);
    if(id===0){
        return TileForm.empty;
    } else if (id===1){
        return TileForm.floor;
    } else if (id>=2&&id<=13){
        return walls[id-2];
    } else if (id===14){
        return TileForm.crossroads;
    }else if (id===15||id===16){
        return TileForm.path;
    } else if (id>=17&&id<=20){
        return TileForm.turn;
    } else if (id>=21&&id<=24){
        return TileForm.threeWay;
    } else if (id>=25&&id<=28){
        return TileForm.threeWayTurnOnly;
    } else if (id>=29&&id<=32){
        return TileForm.turnBack;
    } else if (id>=33&&id<=36){
        return TileForm.specialTurn;
    } else if (id>=37&&id<=40){
        return TileForm.specialThreeWay;
    } else if (id>=41&&id<=44){
        return TileForm.specialThreeWayTurnOnly;
    } else if (id>=45&&id<=48){
        return TileForm.specialThreeWayForced;
    }
}
function getTileDirection(id:number){
    validateTileId(id);
    if(id===0){
        return 0;
    } else if (id===1){
        return 0;
    } else if(id>=2&&id<=13){
        return 0;
    } else if (id===14){
        return 0;
    } else if (id===15||id===16){
        return id-15;
    } else{
        return (id-17)%4;
    }
}
function getTileColor(form:TileForm){
    let result;
    const specialTiles = [TileForm.specialTurn,TileForm.specialThreeWay,TileForm.specialThreeWayTurnOnly,TileForm.specialThreeWayForced];
    if( specialTiles.some(specialTile=>specialTile===form)){
        result= 0x8080ff;
    } else if(form===TileForm.floor){
        result = backgroundColor;
    } else if(walls.some(wall=>wall===form)){
        result = 0x5D2C04;
    } else {
        result = 0xffffff;
    }
    return result;
    
}

function getTile(id:number):Tile{
    const tileForm = getTileForm(id)
    return {
        form:tileForm,
        direction:getTileDirection(id),
        length:64,
        color:getTileColor(tileForm),
        needBackground:needBackground(tileForm)
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