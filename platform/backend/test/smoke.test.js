const assert = require("node:assert/strict");
const http = require("node:http");

const { createApp } = require("../app");

async function main() {
    const app = createApp();
    const server = app.listen(0);

    await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });

    const { port } = server.address();

    try {
        const response = await new Promise((resolve, reject) => {
            const req = http.get(
                {
                    hostname: "127.0.0.1",
                    port,
                    path: "/health"
                },
                (res) => {
                    let body = "";
                    res.setEncoding("utf8");
                    res.on("data", (chunk) => {
                        body += chunk;
                    });
                    res.on("end", () => {
                        resolve({
                            statusCode: res.statusCode,
                            body
                        });
                    });
                }
            );

            req.on("error", reject);
        });

        assert.equal(response.statusCode, 200);
        assert.deepEqual(JSON.parse(response.body), { status: "ok" });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((err) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        });
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
