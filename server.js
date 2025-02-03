Deno.serve({
    port: 8000,
    handler: async (request) => {
        try {
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

                            // TODO: Data handling and stuff here
                        } catch (error) {
                            return new Response(/* Bad data */);
                        }
                    };
                    socket.onerror = (error) => {
                        console.error("ERROR:", error);
                    };
                    socket.onclose = () => {
                        console.log("DISCONNECTED");
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
                console.log(request);

                const fsRoot = "./web";

                const URLPath = new URL(request.url).pathname;

                let filePath;

                filePath = fsRoot + URLPath;

                if (!filePath.endsWith("/") && !/\.[^\/\.]+$/.test(filePath)) {
                    filePath += "/";
                }

                if (!/\.[^\/\.]+$/.test(filePath)) {
                    filePath += "index.html";
                }

                let file;

                try {
                    file = await Deno.open(filePath, { read: true });
                } catch (error) {
                    file = await Deno.open(fsRoot + "/404.html", { read: true });

                    if (error.name !== "NotFound") {
                        console.log(error);
                    } else {
                        return new Response(file.readable, {
                            status: 404,
                            headers: { "content-type": "text/html" },
                        });
                    }
                }

                return new Response(file.readable);
            } else {
                return new Response("", {
                    status: 405,
                    headers: { "content-type": "text/html" },
                });
            }
        } catch (_) {
            new Response({
                status: 500,
            });
        }
    },
});
