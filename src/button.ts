import { Graphics,Sprite,Text, Texture } from "pixi.js";
export function getText(text:string){
    const textComponent = new Text(
        text,
        {font: "48px Impact", fill: "red"}
    );
    textComponent.pivot.set(textComponent.width/2,textComponent.height/2);
    return textComponent;
}
export function createIconButton(texture:Texture,visible:boolean){
    let button = new Sprite(texture)
    button.pivot.set(button.width/2, button.height/2);
    button.interactive = true;
    button.buttonMode = true;
    button.visible = visible;
    return button;
}
export function createButton(text:string,visible:boolean){
    const width =100;
    const height = 50;
    const button = new Graphics()
        .beginFill(0xffffff, 0.5)
        .drawRoundedRect(0, 0, width, height, 10)
        .endFill()
    button.pivot.set(width/2, height/2);
    button.interactive = true;
    button.buttonMode = true;
    button.visible = visible;
    const textComponent=getText(text);
    textComponent.position.set((button.width)/2, (button.height) / 2);

    button.addChild(textComponent)
    return button;
}
export function getMenu(buttons:Graphics[],message?:string){
    const messageModifier = message?1:0;
    const heightModifier = buttons.length + messageModifier;
    const width = 120;
    const heightPadding = 10;
    const reservedHeightSpace = 50;
    const height = heightModifier*reservedHeightSpace+(heightModifier+1)*heightPadding;
    const menu = new Graphics()
        .beginFill(0xffffff, 0.5)
        .drawRoundedRect(0, 0, width, height , 10)
        .endFill()
    menu.pivot.set(width/2, height/2);
    if(message){
        const text = getText(message);
        text.position.set((width)/2, heightPadding+reservedHeightSpace/2);
        menu.addChild(text);
    }
    
    buttons.forEach((button,index)=>{button.position.set(width/2,heightPadding+reservedHeightSpace/2+(index+messageModifier)*(heightPadding+reservedHeightSpace)) ;menu.addChild(button)});
    return menu;
}
/*
10
50 -> 35
10
50 -> 95
10
*/