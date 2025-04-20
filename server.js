// deno run --allow-net --allow-read server.js

let fallbackPort = 5500;
const fsRoot = "./web";

async function reqHandler(request) {
    if (request.headers.get("upgrade") === "websocket") {
        let URL = new URL(request.url).pathname;

        const { socket, response } = Deno.upgradeWebSocket(request);

        if ((URL = "/multiplayer")) {
            socket.onopen = () => {
                console.log(`Someone connected to ${URL} via webhook`);
            };
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
