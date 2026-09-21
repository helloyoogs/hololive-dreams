import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data", "card-detail");
const PUBLIC_DIR = path.join(
    ROOT,
    "public",
    "cdn.holodori.dev",
    "assets",
);

const CDN_BASE =
    "https://cdn.holodori.dev/assets/";

function collectVideoPaths(value, result = new Set()) {
    if (typeof value === "string") {
        if (
            value.endsWith(".mp4") &&
            value.startsWith("resources/")
        ) {
            result.add(value);
        }

        return result;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            collectVideoPaths(item, result);
        }

        return result;
    }

    if (value && typeof value === "object") {
        for (const child of Object.values(value)) {
            collectVideoPaths(child, result);
        }
    }

    return result;
}

function download(url, destination) {
    return new Promise((resolve, reject) => {
        fs.mkdirSync(path.dirname(destination), {
            recursive: true,
        });

        const file = fs.createWriteStream(destination);

        const request = https.get(
            url,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0",
                },
            },
            (response) => {
                // Redirect
                if (
                    response.statusCode >= 300 &&
                    response.statusCode < 400 &&
                    response.headers.location
                ) {
                    file.close();
                    fs.rmSync(destination, {
                        force: true,
                    });

                    download(
                        response.headers.location,
                        destination,
                    )
                        .then(resolve)
                        .catch(reject);

                    return;
                }

                if (response.statusCode !== 200) {
                    file.close();

                    fs.rmSync(destination, {
                        force: true,
                    });

                    reject(
                        new Error(
                            `HTTP ${response.statusCode}: ${url}`,
                        ),
                    );

                    return;
                }

                response.pipe(file);

                file.on("finish", () => {
                    file.close();
                    resolve();
                });
            },
        );

        request.on("error", (error) => {
            file.close();

            fs.rmSync(destination, {
                force: true,
            });

            reject(error);
        });
    });
}

async function main() {
    if (!fs.existsSync(DATA_DIR)) {
        throw new Error(
            `card-detail 폴더가 없습니다: ${DATA_DIR}`,
        );
    }

    const files = fs
        .readdirSync(DATA_DIR)
        .filter((file) => file.endsWith(".json"));

    console.log(`카드 JSON: ${files.length}개`);

    const videos = new Set();

    for (const filename of files) {
        const filepath = path.join(
            DATA_DIR,
            filename,
        );

        const json = JSON.parse(
            fs.readFileSync(filepath, "utf8"),
        );

        collectVideoPaths(json, videos);
    }

    const videoList = [...videos];

    console.log(
        `다운로드 대상 영상: ${videoList.length}개`,
    );

    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    for (let index = 0; index < videoList.length; index++) {
        const resourcePath = videoList[index];

        const url =
            CDN_BASE +
            resourcePath
                .split("/")
                .map(encodeURIComponent)
                .join("/");

        const destination = path.join(
            PUBLIC_DIR,
            ...resourcePath.split("/"),
        );

        const prefix =
            `[${index + 1}/${videoList.length}]`;

        if (
            fs.existsSync(destination) &&
            fs.statSync(destination).size > 0
        ) {
            console.log(
                `${prefix} SKIP ${resourcePath}`,
            );

            skipped++;
            continue;
        }

        try {
            console.log(
                `${prefix} DOWN ${resourcePath}`,
            );

            await download(url, destination);

            const size =
                fs.statSync(destination).size;

            console.log(
                `           OK ${(size / 1024 / 1024).toFixed(2)} MB`,
            );

            downloaded++;
        } catch (error) {
            console.error(
                `${prefix} FAIL ${resourcePath}`,
            );

            console.error(
                `           ${error.message}`,
            );

            failed++;
        }
    }

    console.log("");
    console.log("========== 완료 ==========");
    console.log(`다운로드: ${downloaded}`);
    console.log(`건너뜀:   ${skipped}`);
    console.log(`실패:     ${failed}`);
    console.log(`전체:     ${videoList.length}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});