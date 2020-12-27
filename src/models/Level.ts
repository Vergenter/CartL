import { Entity } from "./Entity";
import { Tile } from "./Tile";

export type TileX = number;
export type TileY = number;
export interface Level{
    tiles:Tile[][];
    entities:Entity[]
}
