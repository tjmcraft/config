const Config = require("..");

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
	minecraft: {
			launch: {
					fullscreen: false,
					width: 1280,
					height: 720
			},
			autoConnect: false,
			hideOnLaunch: true,
	},
});

const config = new Config({
	prefix: "ConfigManager",
	color: "#1052a5",
	configName: 'config.json',
	configDir: './',
	defaultConfig: DEFAULT_CONFIG,
});

module.exports.load = () => config.load();
module.exports.getOption = config.getOption;
module.exports.addCallback = config.addCallback;
module.exports.removeCallback = config.removeCallback;
module.exports.watchOption = config.watchOption;

/**
 *
 * @returns {DEFAULT_CONFIG}
 */
exports.getAllOptionsSync = () => config.getOption();
exports.getAllOptions = async () => config.getOption();
exports.setOption = (key, value) => config.setOption(key, value);

exports.getMinecraftDirectory = (def = false) => config.getOption(config => config.overrides.path.minecraft, def);
exports.getVersionsDirectory = (def = false) => config.getOption(config => config.overrides.path.versions, def);