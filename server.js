// deno run --allow-net --allow-read server.js

let fallbackPort = 5555;
const fsRoot = "./web";

class Vector2 {
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
        if (!(this.x || this.y)) return 0;

        let ratio = newR / this.r;

        this.x *= ratio;
        this.y *= ratio;

        return newR;
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

        return newTheta;
    }

    /**
     * Adds another vector to this one using cartesian co-ordinates, returns a reference to the same object
     * @param {Vector2} vector
     * @returns {Vector2}
     */
    add(vector) {
        this.x += vector.x;
        this.y += vector.y;

        return this;
    }
}

let websockets = [];

async function reqHandler(request) {
    if (request.headers.get("upgrade") === "websocket") {
        const wsURL = new URL(request.url).pathname;

        const { socket, response } = Deno.upgradeWebSocket(request);

        if (wsURL === "/multiplayer") {
            socket.onopen = () => {
                socket.id = websockets.push(socket) - 1;
                console.log(`Someone connected to ${wsURL} via webhook`);
            };
            socket.onmessage = (event) => {
                let data;
                try {
                    data = JSON.parse(event.data);
                } catch (error) {
                    return new Response(/* Bad data */);
                }

                if (data.type === "playerdata") {
                    for (const ws of websockets) {
                        if (ws.id !== socket.id && !ws._closed) {
                            ws.send(
                                JSON.stringify({
                                    type: data.type,
                                    id: socket.id,
                                    x: data.x,
                                    y: data.y,
                                    dx: data.dx,
                                    isCtrl: data.isCtrl,
                                    spiritSize: data.spiritSize,
                                    sideLength: data.sideLength,
                                })
                            );
                        }
                    }
                } else {
                    return new Response(/* Bad data */);
                }
            };
            socket.onclose = () => {
                console.log(`id: ${socket.id} disconnected`);
                socket._closed = true;
            };
            socket.onerror = (error) => {
                console.error(error);
            };
        }

        return response;
    } else if (request.method === "POST") {
        // temporary
        return new Response("", {
            status: 405,
            headers: { "content-type": "text/html" },
        });
    } else if (request.method === "GET") {
        const URLPath = new URL(request.url).pathname;

        let filePath;

        filePath = `${fsRoot}${URLPath.match(/^[^&]*/)}`;

        if (!filePath.endsWith("/") && !/\.[^\/\.]+$/.test(filePath)) {
            filePath += "/";
        }

        if (!/\.[^\/\.]+$/.test(filePath)) {
            filePath += "index.html";
        }

        let file;

        try {
            file = await Deno.open(filePath, { read: true, write: false });
        } catch ({ name, message }) {
            if (name === "NotFound") {
                let indexHTML = await Deno.readTextFile(`${fsRoot}/404/index.html`);

                return new Response(indexHTML.replace(/\{\{ *path *\}\}/gi, URLPath), {
                    status: 404,
                    headers: { "content-type": "text/html" },
                });
            } else {
                console.warn(`%c${name}: ${message}`, "color: #e26868");

                return new Response({ status: 404 });
            }
        }

        let response;

        if (filePath.endsWith(".js")) {
            response = new Response(file.readable, {
                status: 200,
                headers: { "content-type": "text/javascript" },
            });
        } else {
            response = new Response(file.readable, {
                status: 200,
            });
        }

        return response;
    } else {
        return new Response("", {
            status: 405,
            headers: { "content-type": "text/html" },
        });
    }
}

try {
    Deno.serve({
        port: 80,
        handler: async (request) => {
            try {
                return reqHandler(request);
            } catch (_) {
                return new Response({
                    status: 500,
                });
            }
        },
    });
} catch (error) {
    if (error.name === "PermissionDenied") {
        console.log(`Permission denied to run on port 80, attempting port ${fallbackPort}`);

        Deno.serve({
            port: fallbackPort,
            handler: async (request) => {
                try {
                    return reqHandler(request);
                } catch (_) {
                    return new Response({
                        status: 500,
                    });
                }
            },
        });
    } else {
        console.log(error);
    }
}
