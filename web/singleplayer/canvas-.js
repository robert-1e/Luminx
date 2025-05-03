import { keyStates, Vector2, Block, speedLimit, Player, initEventListeners } from "/assets/modules/classes.js";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: false });

const gameState = {
    blocks: [],
};

const player = new Player(new Vector2(50, 50));

let pT = 0;

requestAnimationFrame(function animate(cT) {
    let dT = cT - pT;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //

    pT = cT;
    requestAnimationFrame(animate);
});

// Old canvas


const mouse = new Vector2(0, 0);

initEventListeners(window, document, mouse);

let prevTime = 0;
let deltaTime = 0;

function animate(currentTime) {
    deltaTime = currentTime - prevTime;

    if (1_000 < deltaTime) {
        requestAnimationFrame(animate);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update(keyStates, deltaTime, { top: 0, right: canvas.width, bottom: canvas.height, left: 0 });
    player.draw(ctx);

    prevTime = currentTime;

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
