const canvas = document.getElementById("game-canvas");

const ctx = canvas.getContext("2d");

const game = {
    blocks: [],
};

const player = new Player(new Vector2(50, 50), 20, new Vector2(0, 0));

initEventListeners(document);

let prevTime = 0;
let deltaTime = 0;

function animate(currentTime) {
    deltaTime = currentTime - prevTime;

    if (1_000 < deltaTime) {
        requestAnimationFrame(animate);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update(deltaTime);
    player.draw(ctx);

    prevTime = currentTime;

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
