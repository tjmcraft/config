'use strict';
// Require config lib
const config = require("./config");
// Firstly initialize config
config.load();
// Then call to get all options
console.debug(">>", config.getAllOptionsSync());
// Add callback event listener
config.addCallback((cfg) => console.debug("Config Callback", cfg));
// Set option
config.setOption('java.args', '--version');
// Then reveal all options
console.debug(">>", config.getAllOptionsSync());
// Then exit
setTimeout(() => process.exit(), 10);