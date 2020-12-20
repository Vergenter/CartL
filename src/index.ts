import { Application, Graphics,Sprite,TextureCache } from 'pixi.js';
const button = document.querySelector('#start');
button.addEventListener('click', () => {
    button.classList.add('hide');
});
const app = new Application({
    backgroundColor: 0x999999,
    width: 400,
    height: 400,
    autoStart: false
});
document.body.appendChild(app.view);

function createButton(visible:boolean) {
    const button = new Graphics()
        .beginFill(0x0, 0.5)
        .drawRoundedRect(0, 0, 100, 100, 10)
        .endFill()
        .beginFill(0xffffff);

    button.pivot.set(50, 50);
    button.position.set(app.view.width / 2, app.view.height / 2);
    button.interactive = true;
    button.buttonMode = true;
    button.visible = visible;
    return button;
}

const playButton = createButton(true)
    .moveTo(36, 30)
    .lineTo(36, 70)
    .lineTo(70, 50)
    .on('click', function(){
        playButton.visible =false;
        stopButton.visible =true;
        app.render();
    })

const stopButton = createButton(false)
    .drawRect(34, 34, 32, 32)
    .on('click', function(){
        playButton.visible =true;
        stopButton.visible =false;
        app.render();
    })
function setup(){
    const textures = app.loader.resources["assets/textures.json"].textures;
    const dungeonTexture = textures["special3way.png"];
    const dungeon = new Sprite(dungeonTexture);
    app.stage.addChild(dungeon);
    app.render();
}
app.loader
    .add("assets/textures.json")
    .load(setup)

app.stage.addChild(playButton, stopButton);
app.render();