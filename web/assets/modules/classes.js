export const keyStates = {
    a: false,
    // b: false,
    // c: false,
    d: false,
    // e: false,
    // f: false,
    // g: false,
    // h: false,
    // i: false,
    // j: false,
    // k: false,
    // l: false,
    // m: false,
    // n: false,
    // o: false,
    // p: false,
    // q: false,
    // r: false,
    s: false,
    // t: false,
    // u: false,
    // v: false,
    w: false,
    // x: false,
    // y: false,
    // z: false,
    space: false,
    ctrl: false,
    shift: false,
};

export class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * @returns {number}
     */
    get r() {
        return Math.hypot(this.x, this.y);
    }

    set r(newR) {
        let ratio = newR / this.distance;
        this.x *= ratio;
        this.y *= ratio;
    }

    /**
     * @returns {number}
     */
    get theta() {
        return Math.atan2(this.x, this.y);
    }

    set theta(newTheta) {
        let r = this.r;
        this.x = r * Math.cos(newTheta);
        this.y = r * Math.sin(newTheta);
    }
}

export class Player {
    /**
     *
     * @param {Vector2} pos Starting position of player
     * @param {Vector2} velocity Starting velocity of player
     * @param {string} spiritColour Colour of the spirit
     * @param {number} spiritRatio Ratio of the body size to spirit ratio
     */
    constructor(pos, velocity = new Vector2(0, 0), spiritColour = "#fff") {
        this.pos = pos;
        this.velocity = velocity;
        this.sideLength = 20;
        this.bodyColour = "#000";
        this.spiritColour = spiritColour;
        this.spiritSize = 0.7; // Fraction of the body size

        this.activeSpirit = false;

        this.jumpFrames = 5;
    }

    /**
     * Draws the player to a canvas context
     * @param {CanvasRenderingContext2D} ctx Canvas context to draw on
     */
    draw(ctx) {
        // Drawing body
        if (!this.activeSpirit) {
            ctx.strokeStyle = this.bodyColour;
            ctx.fillStyle = this.bodyColour;

            ctx.beginPath();

            let halfSideLength = this.sideLength / 2;

            ctx.moveTo(this.pos.x - halfSideLength, this.pos.y + halfSideLength);
            ctx.lineTo(this.pos.x + halfSideLength, this.pos.y + halfSideLength);
            ctx.lineTo(this.pos.x + halfSideLength + this.velocity.x, this.pos.y - halfSideLength);
            ctx.lineTo(this.pos.x - halfSideLength + this.velocity.x, this.pos.y - halfSideLength);
            ctx.closePath();

            ctx.fill();

            // Draw spirit
            halfSideLength *= this.spiritSize;

            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = (125 * this.spiritSize) / this.sideLength;
            ctx.strokeStyle = this.spiritColour;
            ctx.fillStyle = this.spiritColour;

            ctx.beginPath();

            ctx.moveTo(this.pos.x - halfSideLength, this.pos.y + halfSideLength);
            ctx.lineTo(this.pos.x + halfSideLength, this.pos.y + halfSideLength);
            ctx.lineTo(this.pos.x + halfSideLength + this.velocity.x, this.pos.y - halfSideLength);
            ctx.lineTo(this.pos.x - halfSideLength + this.velocity.x, this.pos.y - halfSideLength);
            ctx.closePath();

            ctx.fill();

            ctx.shadowBlur = 0;
        } else {
            // TODO: Draw the spirit in it's free state
        }
    }

    /**
     * Updates the player
     * @param {Number} dT Time of last completed frame
     * @param {Object} borders Defines the confines of the player's world
     * @param {number} borders.top y pos of the top border
     * @param {number} borders.right x pos of the right border
     * @param {number} borders.bottom y pos of the bottom border
     * @param {number} borders.left x pos of the left border
     * @returns
     */
    update(dT, borders) {
        dT >>= 4;

        // Old function
        return;
        let timeMult = deltaTime / 16;

        // TODO: Make the player be able to function when the spirit is in habiting blocks (detached from player)
        let xDirection = this.processkeyEvents(keyEvents);

        this.nextPos = new Vector2(
            this.pos.x + this.velocity.x + xDirection,
            this.pos.y + this.velocity.y + (this.gravityStrength * this.size) / 500
        );

        if (!this.freeSpirit) {
            this.processCollisions(borders);

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

    keyStatesHandler(keyStates) {
        if (this.jumpFrames && (keyStates.w || keyStates.space)) {
        }
    }

    stringify() {}
}
