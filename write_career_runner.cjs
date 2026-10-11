const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "write_career.txt");
const content = fs.readFileSync(file, "utf8");
fs.writeFileSync("src/pages/candidate/CareerPage.tsx", content, "utf8");
console.log("Written:", content.split("\n").length, "lines");
