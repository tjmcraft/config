# Config Manager

Config Manager for NodeJs and Electron projects

## Installation

```bash
npm install --save @tjmc/config
```

## Usage

In `config.js`:
```javascript
const Config = require("@tjmc/config");
const path = require('node:path');

const DEFAULT_CONFIG = Object.seal({
  java: {
      path: '',
      memory: {
          max: 1024,
          min: 512
      },
      detached: true,
      cwd: '',
      args: '',
  },
});

const config = new Config({
  configName: 'config.json',
  configDir: path.resolve(__dirname, './'),
  defaultConfig: DEFAULT_CONFIG,
});

module.exports.load = config.load;
module.exports.getOption = config.getOption;
module.exports.setOption = config.setOption;
module.exports.watchOption = config.watchOption;
module.exports.addCallback = config.addCallback;
module.exports.removeCallback = config.removeCallback;

exports.getAllOptionsSync = () => config.getOption();
exports.getAllOptions = async () => config.getOption();
```

In `index.js`:
```javascript
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
```
