interface Vector2 {
    /**
     * @param {number} x X component of vector
     * @param {number} y Y component of vector
     */
    new (x: number, y: number): Vector2;

    // distance: number;
}

interface Block {
    new (pos: Vector2, sideLength: number): Block;

    /**
     * Draws the block as it's current state onto the canvas context provided
     * @param {CanvasRenderingContext2D} ctx Canvas context to draw on
     */
    draw(ctx: CanvasRenderingContext2D): void;
}

interface Player {
    /**
     * Class to instantiate new player (used multiple times only in multiplayer)
     * @param {Vector2} pos Initial position of player (overwritten at start probably)
     * @param {Vector2} velocity Initial velocity of player (0, 0 is best)
     * @param {number} sideLength Sidelength of player (should be whatever tile size used)
     * @param {number} gravityStrength 1 is normal
     * @param {string} bodyColour Colour of body
     * @param {string} spiritColour Colour of spirit
     * @param {number} spiritSize Size of spirit (absolute; defaults to 0.7 * bodySize)
     */
    new (
        pos: Vector2,
        velocity: Vector2,
        sideLength: number,
        gravityStrength: number,
        bodyColour?: string,
        spiritColour?: string,
        spiritSize?: number
    ): Player;

    /**
     * Processes key events (should be used only in update())
     * @returns {number}
     */
    processkeyEvents(): number;

    /**
     * Checking if the player will collide with something next frame
     * @param {Block} block
     * @returns {Boolean}
     */
    willCollide(block: Block): boolean;

    /**
     * Subroutine to process and act on collisions (should be used only in update())
     * @returns {void}
     */
    processCollisions(): void;

    /**
     * Updates the player fully, removing the need for other functions to be called globally
     * @param {number} deltaTime Delta time of last completed frame
     */
    update(deltaTime): void;

    /**
     * Draws the player
     * @param {CanvasRenderingContext2D} ctx Canvas context to draw on
     */
    draw(ctx: CanvasRenderingContext2D): void;
}
