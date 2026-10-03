/* lets `node --test extension/test/` work (node 22+ runs a directory argument as a module): load every *.test.js here */
const fs = require("fs"), path = require("path");
fs.readdirSync(__dirname).filter((f) => f.endsWith(".test.js")).sort().forEach((f) => require(path.join(__dirname, f)));
