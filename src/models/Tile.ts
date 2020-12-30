import { Sprite } from "pixi.js";
import { TileForm } from "./TileForm";

export interface Tile {
    form:TileForm;
    direction:number;
    length:number;
    color:number;
    needBackground:boolean;

}
