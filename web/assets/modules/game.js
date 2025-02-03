const keyEvents = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false,
};

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * @returns {number}
     */
    get distance() {
        return Math.hypot(this.x, this.y);
    }

    set distance(newDistance) {
        let change = newDistance / this.distance;
        this.x *= change;
        this.y *= change;
    }
}

class Block {
    constructor(pos, sideLength) {
        this.pos = pos;
        this.sideLength = sideLength;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.colour;
        ctx.fillRect(
            this.pos.x - this.sideLength / 2,
            this.pos.y - this.sideLength / 2,
            this.sideLength,
            this.sideLength
        );
        // ctx.fill();
        ctx.closePath();
    }
}

function speedLimit(n, limit) {
    return limit * Math.tanh(n / (1.25 * limit));
}

class Player {
    constructor(
        pos,
        velocity,
        sideLength,
        gravityStrength = 1,
        bodyColour = "Black",
        spiritColour = "White",
        spiritSize = undefined
    ) {
        this.pos = pos;
        this.velocity = velocity;
        this.gravityStrength = gravityStrength;
        this.sideLength = sideLength;
        this.size = sideLength * sideLength;
        this.bodyColour = bodyColour;
        this.spiritColour = spiritColour;
        this.spiritSize = spiritSize || sideLength * 0.7;

        this.canJump = 4; // ${player.canJump} frames left of jump; coyote jump
    }

    processkeyEvents() {
        let xDirection = 0;

        const asdf = 4;

        if (keyEvents.a && !keyEvents.d) {
            this.velocity.x -= asdf;
            xDirection = -1;
        } else if (keyEvents.d && !keyEvents.a) {
            this.velocity.x += asdf;
            xDirection = 1;
        } else {
            if (Math.abs(this.velocity.x) < 0.5) {
                this.velocity.x = 0;
            }
        }

        if (keyEvents.space && this.canJump) {
            this.velocity.y = -(this.size / 40);
            this.canJump = 0;
        }

        if (keyEvents.s) {
            this.gravityStrength = 2;
        } else {
            this.gravityStrength = 1;
        }

        return xDirection * asdf;
    }

    /**
     * Checking if the player will collide with something next frame
     * @param {Block} block
     * @returns {Boolean}
     */
    willCollide(block) {
        let dist = (block.sideLength + this.sideLength) / 2;
        return (
            block.relPos.x - dist <= this.nextPos.x &&
            this.nextPos.x <= block.relPos.x + dist &&
            block.relPos.y - dist <= this.nextPos.y &&
            this.nextPos.y <= block.relPos.y + dist
        );
    }

    /**
     * Subroutine to process and act on collisions (should be used only in update())
     */
    processCollisions() {
        // TODO: fix wallhopping (not an issue yet since blocks don't work)

        if (this.nextPos.x < this.sideLength / 2) {
            this.velocity.x = this.velocity.x > 0 ? this.velocity.x : 0;
            this.pos.x = this.sideLength / 2;
        } else if (this.nextPos.x > canvas.width - this.sideLength / 2) {
            this.velocity.x = this.velocity.x < 0 ? this.velocity.x : 0;
            this.pos.x = canvas.width - this.sideLength / 2;
        }

        this.canJump = this.canJump > 0 ? this.canJump - 1 : 0;

        if (this.nextPos.y < this.sideLength / 2) {
            this.velocity.y = this.velocity.y > 0 ? this.velocity.y : 0;
            this.pos.y = this.sideLength / 2;
        } else if (this.nextPos.y > canvas.height - this.sideLength / 2) {
            this.velocity.y = this.velocity.y < 0 ? this.velocity.y : 0;
            this.pos.y = canvas.height - this.sideLength / 2;
            this.canJump = 4;
        }
    }

    /**
     * Updates the player fully, removing the need for other functions to be called globally
     * @param {Number} deltaTime Delta time of last completed frame
     */
    update(deltaTime) {
        let timeMult = deltaTime / 16;

        // TODO: Make the player be able to function when the spirit is in habiting blocks (detached from player)
        let xDirection = this.processkeyEvents();

        this.nextPos = new Vector2(
            this.pos.x + this.velocity.x + xDirection,
            this.pos.y + this.velocity.y + (this.gravityStrength * this.size) / 500
        );

        if (!this.freeSpirit) {
            this.processCollisions();

            this.velocity.y += (this.gravityStrength * this.size * timeMult) / 500;

            const speedLim = new Vector2(11, 50);

            this.velocity.x = speedLimit(this.velocity.x, speedLim.x, timeMult);

            if (this.velocity.y >= this.size) {
                this.velocity.y = this.size;
            } else if (this.velocity.y <= (-2 * this.size) / speedLim.y) {
                this.velocity.y = (-2 * this.size) / speedLim.y;
            }

            // this.processCollisions();

            this.pos.x += this.velocity.x * timeMult;
            this.pos.y += this.velocity.y * timeMult;
        } else {
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.pos = new Vector2(
                (Math.floor(this.pos.x / this.sideLength) + 0.5) * this.sideLength,
                (Math.floor(this.pos.y / this.sideLength) + 0.5) * this.sideLength
            );
        }

        if (this.freeSpirit) {
            if (this.spiritSize > this.sideLength * 0.35) {
                this.spiritSize *= timeMult / 1.2;
            } else {
                this.spiritSize = this.sideLength * 0.3 * timeMult;
            }
        } else {
            if (this.spiritSize < this.sideLength * 0.675) {
                this.spiritSize *= 0.97 * timeMult;
                this.spiritSize += 1 * timeMult;
            } else {
                this.spiritSize = this.sideLength * 0.7 * timeMult;
            }
        }

        // if (this.spiritSize == this.sideLength * 0.3) {
        //     game.levelList[canvas.levelID].roomsList[canvas.roomID].objects.push(
        //         new Block(this.pos, this.sideLength, this.colour)
        //     );
        // } // TODO: Make the player inhabit the block when shift is released
    }

    /**
     * Draws the player
     * @param {CanvasRenderingContext2D} ctx Canvas context to draw on
     */
    draw(ctx) {
        // Draw Player Body
        ctx.beginPath();

        ctx.fillStyle = this.bodyColour;

        let halfSideLength = this.sideLength / 2;

        ctx.moveTo(this.pos.x - halfSideLength, this.pos.y + halfSideLength);
        ctx.lineTo(this.pos.x + halfSideLength, this.pos.y + halfSideLength);
        ctx.lineTo(this.pos.x + halfSideLength + this.velocity.x, this.pos.y - halfSideLength);
        ctx.lineTo(this.pos.x - halfSideLength + this.velocity.x, this.pos.y - halfSideLength);
        ctx.lineTo(this.pos.x - halfSideLength, this.pos.y + halfSideLength);

        ctx.fill();

        ctx.closePath();

        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = (125 * this.spiritSize) / this.sideLength;
        ctx.fillStyle = this.spiritColour;

        // Draw Spirit
        // Do not tweak, only touch it if you re-write the whole function.
        // I have no clue how it works but it does somehow.
        ctx.beginPath();

        halfSideLength = this.spiritSize / 2;

        ctx.moveTo(
            this.pos.x -
                halfSideLength +
                ((this.sideLength - this.spiritSize) * this.velocity.x) / (this.sideLength * 2),
            this.pos.y + halfSideLength
        );
        ctx.lineTo(
            this.pos.x +
                halfSideLength +
                ((this.sideLength - this.spiritSize) * this.velocity.x) / (this.sideLength * 2),
            this.pos.y + halfSideLength
        );
        ctx.lineTo(
            this.pos.x +
                halfSideLength +
                ((this.sideLength - this.spiritSize) * this.velocity.x) / (this.sideLength * 2) +
                (this.velocity.x * this.spiritSize) / this.sideLength,
            this.pos.y - halfSideLength
        );
        ctx.lineTo(
            this.pos.x -
                halfSideLength +
                ((this.sideLength - this.spiritSize) * this.velocity.x) / (this.sideLength * 2) +
                (this.velocity.x * this.spiritSize) / this.sideLength,
            this.pos.y - halfSideLength
        );
        ctx.lineTo(
            this.pos.x -
                halfSideLength +
                ((this.sideLength - this.spiritSize) * this.velocity.x) / (this.sideLength * 2),
            this.pos.y + halfSideLength
        );

        ctx.fill();
        ctx.closePath();

        ctx.shadowBlur = 0;
    }
}

const mouse = { down: false, x: undefined, y: undefined }; // May be added for some feature I haven't thought of yet

function canvasResizeHandler(canvasContainer, canvas) {
    canvasContainer.className =
        canvasContainer.clientWidth / canvas.width < canvasContainer.clientHeight / canvas.height
            ? "width-scaling"
            : "height-scaling";
}

function initEventListeners(document) {
    const canvasContainer = document.getElementById("page");
    const canvas = document.getElementById("game-canvas");

    canvasResizeHandler(canvasContainer, canvas);

    window.addEventListener("resize", () => {
        canvasResizeHandler(canvasContainer, canvas);
    });

    window.addEventListener("mousemove", (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    window.addEventListener("mousedown", () => {
        mouse.down = true;
    });

    window.addEventListener("mouseup", () => {
        mouse.down = false;
    });

    window.addEventListener("keydown", (event) => {
        switch (event.key.toLowerCase()) {
            case "a":
                keyEvents.a = true;
                break;
            case "s":
                keyEvents.s = true;
                break;
            case "d":
                keyEvents.d = true;
                break;
            case "w":
            case " ":
                keyEvents.space = true;
                break;
            case "shift":
                keyEvents.shift = true;
                break;
            default:
                break;
        }
    });

    window.addEventListener("keyup", (event) => {
        switch (event.key.toLowerCase()) {
            case "a":
                keyEvents.a = false;
                break;
            case "s":
                keyEvents.s = false;
                break;
            case "d":
                keyEvents.d = false;
                break;
            case "w":
            case " ":
                keyEvents.space = false;
                break;
            case "shift":
                keyEvents.shift = false;
                break;
            default:
                break;
        }
    });
}

// export { initEventListeners, resizeHandler, keyEvents, Vector2, Block, Player };
