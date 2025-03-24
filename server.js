// deno run --allow-net --allow-read server.js

const FALLBACK_PORT = 5500;
const fsRoot = "./web";

async function reqHandler(request) {
    if (request.headers.get("upgrade") === "websocket") {
        let URL = new URL(request.url).pathname;

        const { socket, response } = Deno.upgradeWebSocket(request);

        socket.onopen = () => {
            console.log(`Someone connected to ${URL} via webhook`);
        };

        if ((URL = "/multiplayer/")) {
            socket.onmessage = (event) => {
                try {
                    let data = JSON.stringify(event.data);
                } catch (error) {
                    return new Response(/* Bad data */);
                }
            };
            socket.onclose = () => {
                console.log("DISCONNECTED");
            };
            socket.onerror = (error) => {
                console.error("ERROR:", error);
            };
        }

        socket.onopen = () => {
            console.log("CONNECTED");
        };
        socket.onmessage = (event) => {
            console.log(`RECEIVED: ${event.data}`);
            socket.send("pong");
        };
        socket.onclose = () => {
            console.log("DISCONNECTED");
        };
        socket.onerror = (error) => {
            console.error("ERROR:", error);
        };

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

        return new Response(file.readable, {
            status: 200,
            // Commented because it breaks anything other than html oopsies
            // headers: { "content-type": "text/html" },
        });
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
        console.log(`Permission denied to run on port 80, attempting port ${FALLBACK_PORT}\n`);

        Deno.serve({
            port: FALLBACK_PORT,
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
        throw error;
    }
}
