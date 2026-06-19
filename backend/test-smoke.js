const http = require("http");

function post(path, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = http.request(
            {
                hostname: "localhost",
                port: 5000,
                path,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(data)
                }
            },
            (res) => {
                let chunks = "";
                res.on("data", (c) => (chunks += c));
                res.on("end", () => {
                    console.log(`\n=== ${path} (${res.statusCode}) ===`);
                    try {
                        const json = JSON.parse(chunks);
                        console.log(JSON.stringify(json, null, 2).slice(0, 2000));
                    } catch {
                        console.log(chunks.slice(0, 2000));
                    }
                    resolve();
                });
            }
        );
        req.on("error", reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    // Test 1: Health
    await post("/health", {}).catch(() => console.log("Health check uses GET, skipping POST test"));

    // Test 2: Local analysis
    await post("/api/analyze/local", { repoPath: "d:/RepoIQ/testRepo" });

    // Test 3: Missing repoPath
    await post("/api/analyze/local", {});

    // Test 4: Bad GitHub URL
    await post("/api/analyze/git", { gitUrl: "not-a-url" });

    console.log("\n=== All tests done ===");
}

main().catch(console.error);
