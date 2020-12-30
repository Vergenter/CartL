import { EntityForm } from "./EntityForm";

export interface Entity{
    form:EntityForm
    x:number;
    y:number;
    rotation:number;
    selectable:boolean;
    velocity:number;
    oldTile:[number,number]
    currTile:[number,number]
    currDistance:number;
    nextTile:[number,number]
    color:number,
}