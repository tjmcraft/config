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