const fs = require('fs');
const path = require('path');
const { shallowEqual } = require('./util/Iterates.js');
const { debounce } = require('./util/Schedulers.js');
const LoggerUtil = require('./loggers/console.js');

const validateKeySet = (srcObj, destObj) => {
	if (srcObj == null) srcObj = {}
	const keys = Object.keys(srcObj)
	for (let i = 0; i < keys.length; i++) {
		if (typeof destObj[keys[i]] === 'undefined') {
			destObj[keys[i]] = srcObj[keys[i]]
		} else if (
			typeof srcObj[keys[i]] === 'object' &&
			srcObj[keys[i]] != null &&
			!(srcObj[keys[i]] instanceof Array)
		) {
			destObj[keys[i]] = validateKeySet(srcObj[keys[i]], destObj[keys[i]])
		}
	}
	return destObj
}

/**
 * Config Manager
 * @param {object} params
 * @param {string} params.configName Configuration filename
 * @param {string} params.configDir Configuration file directory
 * @param {object} params.defaultConfig Default configuration model
 * @param {LoggerUtil} params.logger Logger instance for debug
 * @param {boolean} params.debug Should debug some additional things to logger
 */
const Config = function ({
	configName,
	configDir = './',
	defaultConfig,
	logger,
	debug = false
}) {

	logger ||= LoggerUtil('%c[ConfigManager]', 'color: #1052a5; font-weight: bold', false);

	configName ||= 'config.json';
	let configPath = undefined;
	const DEFAULT_CONFIG = Object.seal(defaultConfig || {});
	var config = undefined;

	this.isLoaded = () => config != undefined;

	const callbacks = [void 0];
	let silentMode = false;

	this.addCallback = (callback = (config) => void 0) => {
		if (typeof callback === 'function') callbacks.push(callback)
	};

	this.removeCallback = (callback = (config) => void 0) => {
		const index = callbacks.indexOf(callback)
		if (index !== -1) callbacks.splice(index, 1)
	};

	this.watchOption = (selector = void 0) => {
		return (callback = () => void 0) => {
			let mappedProps = undefined
			const update = () => {
				let newMappedProps = this.getOption(selector);
				debug && logger.debug("[watchOption]\nMapped:", mappedProps, "\nnextProps:", newMappedProps);
				if (
					newMappedProps != undefined &&
					!shallowEqual(mappedProps, newMappedProps)
				) {
					mappedProps = newMappedProps;
					callback(mappedProps);
				}
			}
			update();
			this.addCallback(update);
		}
	};

	const runCallbacks = () => {
		callbacks.forEach((callback) =>
			typeof callback === 'function' ? callback({ ...config }) : null
		)
	}

	/**
	 * Read config from path
	 * @param {string} configPath path to config file
	 * @returns {object}
	 */
	const readConfig = (configPath) => {
		let forceSave = false
		if (!fs.existsSync(configPath)) {
			debug && logger.debug('[read]', 'Generating a new configuration file...')
			if (config == undefined) config = DEFAULT_CONFIG
			forceSave = true
		} else {
			try {
				config = fs.readFileSync(configPath, 'utf-8')
				config = Object.assign({}, DEFAULT_CONFIG, JSON.parse(config))
			} catch (err) {
				logger.warn(
					'Configuration file contains malformed JSON or is corrupted!'
				)
				config = DEFAULT_CONFIG
				forceSave = true
			}
		}
		return this.save(true, forceSave, 'read -> save')
	}

	/**
	 * File watching callback
	 * @param {fs.WatchEventType} event file event
	 * @param {fs.PathLike} filename file name
	 */
	const watchCallback = (event, filename) => {
		if (filename == configName) {
			debug && logger.debug('[watchCallback]', `${filename} file`, '->', event)
			readConfig(configPath)
			if (event == 'change') {
				if (!silentMode) {
					debug && logger.debug('[watch]', '> run callbacks')
					runCallbacks();
				} else {
					debug && logger.warn('[watch]', '> silent change')
				}
			}
		}
	}

	/**
	 * Load configuration and start watching
	 * @returns {object}
	 */
	this.load = (config_dir = undefined) => {
		config_dir = config_dir || configDir
		configPath = path.join(config_dir, configName)
		readConfig(configPath)
		logger.log(
			'[load]',
			`${configName} file`,
			'->',
			this.isLoaded() ? 'success' : 'failure'
		)
		if (this.isLoaded())
			fs.watch(configPath, debounce(watchCallback, 100, true, false))
		return config
	}

	/**
	 * Save current config
	 * @param {boolean} silent should we use silent mode for skipping update
	 * @param {boolean} forceSave should we force saving without shallowing
	 * @param {string} reason reason for saving (only for debug purpose)
	 * @returns {object}
	 */
	this.save = (silent = false, forceSave = true, reason = '') => {
		silentMode = silent
		if (!fs.existsSync(configPath))
			fs.mkdirSync(path.join(configPath, '..'), { recursive: true })
		const validatedConfig = validateKeySet(DEFAULT_CONFIG, config)
		if (!shallowEqual(config, validatedConfig) || forceSave) {
			// prevent unnecessary writings
			config = validatedConfig
			try {
				const content = JSON.stringify(config, null, 4);
				fs.writeFileSync(configPath, content, 'utf-8');
				logger.log('[save]', 'Config saved successfully!')
			} catch (e) {
				logger.error('[save]', 'Config save error:', e)
			}
			debug && logger.debug(
				'[save]',
				'Config saved!',
				'Silent:',
				silent,
				'Reason:',
				reason
			)
		}
		silentMode = false
		return Boolean(config)
	}

	/**
	 * Set one property by key string
	 * @param {string} key key to set property
	 * @param {string|object} [value] value to set to key
	 * @returns {object}
	 */
	this.setOption = async (key, value = void 0) => {
		if (typeof key == 'object' && value == void 0) {
			config = key
		} else if (typeof key == 'string') {
			let valuePath = key.split('.')
			if (valuePath.length >= 2) {
				let firstKey = valuePath.shift()
				let lastKey = valuePath.pop()
				valuePath.reduce((o, k) => (o[k] = o[k] || {}), config[firstKey])[
					lastKey
				] = value
			} else {
				config[key] = value
			}
		} else {
			return
		}
		return this.save(false, true, 'set option')
	}

	/**
	 * Get option from config
	 * @param {Function|String} [selector] selector must be a picker function or just a key string
	 * @param {boolean} [_default] return default config value
	 * @returns {string|number|object}
	 */
	this.getOption = (selector = void 0, _default = false) => {
		let state = Object.assign({}, _default ? DEFAULT_CONFIG : config)
		if (typeof selector === 'function') {
			try {
				state = selector(state)
			} catch (e) {} // тут похуй + поебать
		} else if (typeof selector === 'string') {
			let valuePath = selector.split('.')
			let firstKey = valuePath.shift()
			state = valuePath.reduce((o, k) => (o[k] = o[k] ?? {}), state[firstKey])
		}
		return state
	}
}

module.exports = Config
