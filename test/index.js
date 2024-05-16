'use strict';
// Require config lib
const config = require("./config");
// Firstly initialize config
config.load();
// Then call to get all options
console.debug(">>", config.getAllOptionsSync());
// Then exit
process.exit();