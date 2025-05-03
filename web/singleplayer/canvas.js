import { Vector2, Block } from "/assets/modules/classes.js";

const pageDiv = document.getElementById("page");
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d", { alpha: true, willReadFrequently: false });

const squareSize = 20;
const keyStates = {};
const gameState = {};
const player = {
    pos: new Vector2(0, 0),
    vel: new Vector2(0, 0),

    jumpFrames: 0,
    speed: 1.5,

    sideLength: squareSize,
    spiritSize: 0.7,

    drawSpiritLight() {
        let inRadius = (this.sideLength * 0.95) / 2;

        ctx.shadowColor = "#fff";
        ctx.shadowBlur = (75 * this.spiritSize * this.sideLength) / this.sideLength;
        ctx.strokeStyle = "#fff";
        ctx.fillStyle = "#fff";

        ctx.beginPath();

        ctx.moveTo(this.pos.x - inRadius, this.pos.y + inRadius);
        ctx.lineTo(this.pos.x + inRadius, this.pos.y + inRadius);
        ctx.lineTo(this.pos.x + inRadius + this.vel.x, this.pos.y - inRadius);
        ctx.lineTo(this.pos.x - inRadius + this.vel.x, this.pos.y - inRadius);
        ctx.closePath();

        ctx.fill();

        ctx.shadowBlur = 0;
    },

    draw() {
        // Drawing body
        if (!keyStates.shift || true) {
            ctx.strokeStyle = "#000";
            ctx.fillStyle = "#000";

            ctx.beginPath();

            let inRadius = this.sideLength / 2;

            ctx.moveTo(this.pos.x - inRadius, this.pos.y + inRadius);
            ctx.lineTo(this.pos.x + inRadius, this.pos.y + inRadius);
            ctx.lineTo(this.pos.x + inRadius + this.vel.x, this.pos.y - inRadius);
            ctx.lineTo(this.pos.x - inRadius + this.vel.x, this.pos.y - inRadius);
            ctx.closePath();

            ctx.fill();

            // Draw spirit
            inRadius *= this.spiritSize;

            ctx.shadowColor = "#fff";
            ctx.strokeStyle = "#fff";
            ctx.fillStyle = "#fff";

            ctx.beginPath();

            ctx.moveTo(this.pos.x - inRadius + ((1 - this.spiritSize) * this.vel.x) / 2, this.pos.y + inRadius);
            ctx.lineTo(this.pos.x + inRadius + ((1 - this.spiritSize) * this.vel.x) / 2, this.pos.y + inRadius);
            ctx.lineTo(this.pos.x + inRadius + ((1 + this.spiritSize) * this.vel.x) / 2, this.pos.y - inRadius);
            ctx.lineTo(this.pos.x - inRadius + ((1 + this.spiritSize) * this.vel.x) / 2, this.pos.y - inRadius);
            ctx.closePath();

            ctx.fill();
        } else {
            // TODO: Draw the spirit in it's free state
        }
    },

    update(dT) {
        const dTMult = dT * (3 / 50);

        const shrinkSpeed = 1.4;

        if (!keyStates.shift) {
            this.spiritSize += 0.7 * (shrinkSpeed - 1);
            this.spiritSize /= shrinkSpeed;

            this.vel.y += (this.sideLength / 30) * dTMult;

            // Key Events
            if (this.jumpFrames && (keyStates.w || keyStates[" "])) {
                this.vel.y -= 10;
                this.jumpFrames = 0;
            }

            if (keyStates.a && !keyStates.d) {
                this.vel.x -= this.speed * dTMult;
            } else if (!keyStates.a && keyStates.d) {
                this.vel.x += this.speed * dTMult;
            }

            const a = 30;
            this.vel.x = a * Math.tanh(this.vel.x / (1.25 * a));

            // Border Collisions
            let nextPos = new Vector2(this.pos.x + this.vel.x * dTMult, this.pos.y + this.vel.y * dTMult);
            let inRadius = this.sideLength / 2;

            if (nextPos.x - inRadius < 0) {
                nextPos.x = inRadius;
                this.vel.x = this.vel.x < 0 ? 0 : this.vel.x;
            } else if (canvas.width < nextPos.x + inRadius) {
                nextPos.x = canvas.width - inRadius;
                this.vel.x = this.vel.x > 0 ? 0 : this.vel.x;
            }

            if (nextPos.y - inRadius < 0) {
                nextPos.y = inRadius;
                this.vel.y = this.vel.y < 0 ? 0 : this.vel.x;
            } else if (canvas.height < nextPos.y + inRadius) {
                nextPos.y = canvas.height - inRadius;
                this.vel.y = this.vel.y > 0 ? 0 : this.vel.x;
                this.jumpFrames = 4;
            } else if (0 < this.jumpFrames) {
                this.jumpFrames--;
            }

            // Block Collisions

            this.pos.x = nextPos.x;
            this.pos.y = nextPos.y;
        } else {
            this.spiritSize += 0.3 * (shrinkSpeed - 1);
            this.spiritSize /= shrinkSpeed;

            this.vel.x = 0;
            this.vel.y = 0;
        }
    },
};

// TMP
await (async () => {
    let [metaData, ...data] = (await (await fetch("/singleplayer/level.txt")).text()).split("\n");

    data = data.map((v) => v.split(""));

    let { width, height } = JSON.parse(metaData);
    gameState.width = width;
    gameState.height = height;
    gameState.blocks = new Array(height).fill(0).map((_, row) =>
        new Array(width).fill(0).map(
            (_, col) =>
                ({ " ": 0, "#": 1, "P": 0 }[
                    ((c) => {
                        if (c === "P") {
                            player.pos.x = col * squareSize;
                            player.pos.y = row * squareSize;
                        }
                        return c;
                    })(data[row][col] || " ")
                ])
        )
    );
    canvas.width = gameState.width * squareSize;
    canvas.height = gameState.height * squareSize;
})();

/**
 * Updates canvas class based on how big the canvas is relative to it's container
 */
function canvasResizeHandler() {
    pageDiv.className = pageDiv.clientWidth / canvas.width < pageDiv.clientHeight / canvas.height ? "width-scaling" : "height-scaling";
}

(async () => {
    canvasResizeHandler();

    window.addEventListener("resize", () => {
        canvasResizeHandler(pageDiv, canvas);
    });

    // window.addEventListener("mousemove", (event) => {
    //     mouse.x = event.x;
    //     mouse.y = event.y;
    // });

    // window.addEventListener("mousedown", () => {
    //     mouse.down = true;
    // });

    // window.addEventListener("mouseup", () => {
    //     mouse.down = false;
    // });

    window.addEventListener("keydown", (event) => {
        console.log(event.key.toLowerCase());

        keyStates[event.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", (event) => {
        keyStates[event.key.toLowerCase()] = false;
    });
})();

let pT = 0;

requestAnimationFrame(function animate(cT) {
    let dT = cT - pT;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.drawSpiritLight();

    ctx.fillStyle = "#000";
    for (let row = 0; row < gameState.blocks.length; row++) {
        for (let col = 0; col < gameState.blocks[row].length; col++) {
            if (gameState.blocks[row][col]) {
                ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
            }
        }
    }

    player.draw();
    player.update(dT);

    pT = cT;
    requestAnimationFrame(animate);
});
