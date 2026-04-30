const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const candidatePaths = [
    path.resolve(__dirname, "../.env"),
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../../../.env")
];

for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        break;
    }
}
