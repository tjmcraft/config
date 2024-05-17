import { PathLike, WatchEventType } from "fs";

const fs = require('fs');
const path = require('path');
const { shallowEqual, validateKeySet } = require('./util/Iterates');
const { debounce } = require('./util/Schedulers');
const LoggerUtil = require('./loggers/console.js');

/**
 * Config Manager
 * @param {object} params
 * @param {string} params.configName Configuration filename
 * @param {string} params.configDir Configuration file directory
 * @param {object} params.defaultConfig Default configuration model
 * @param {LoggerUtil} params.logger Logger instance for debug
 * @param {boolean} params.debug Should debug some additional things to logger
 */
export default function Config<TConfig = AnyLiteral>({
	configName,
	configDir = './',
	defaultConfig,
	logger,
	debug = false
}: {
		configName: string;
		configDir: PathLike;
		defaultConfig: TConfig;
		logger: any;
		debug: boolean;
}) {

	logger ||= LoggerUtil('%c[ConfigManager]', 'color: #1052a5; font-weight: bold', true);

	const DEFAULT_CONFIG: TConfig = Object.seal(defaultConfig);
	configName ||= 'config.json';
	let configPath: PathLike;
	var config: TConfig | undefined = undefined;

	let silentMode = false;

	type StoreCallback = (cfg: TConfig) => void;
	let callbacks: StoreCallback[] = [];

	const addCallback = (callback: StoreCallback) => {
		if (typeof callback === 'function') callbacks.push(callback)
	};

	const removeCallback = (callback: StoreCallback) => {
		const index = callbacks.indexOf(callback)
		if (index !== -1) callbacks.splice(index, 1)
	};

	const runCallbacks = () => {
		callbacks.forEach((callback) => typeof callback === 'function' ? callback({ ...config } as TConfig) : null)
	}

	const watchOption = (selector = void 0) => {
		return (callback: Function = () => void 0) => {
			let mappedProps: Partial<TConfig> | undefined = undefined;
			const update = () => {
				let newMappedProps = getOption(selector);
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
			addCallback(update);
		}
	};

	const isLoaded = () => config != undefined;

	/**
	 * Read config from path
	 */
	const readConfig = (configPath: PathLike) => {
		let forceSave = false
		if (!fs.existsSync(configPath)) {
			debug && logger.debug('[read]', 'Generating a new configuration file...')
			if (config == undefined) config = DEFAULT_CONFIG
			forceSave = true
		} else {
			try {
				let config_raw = fs.readFileSync(configPath, 'utf-8');
				config = Object.assign({}, DEFAULT_CONFIG, JSON.parse(config_raw));
			} catch (err) {
				logger.warn(
					'Configuration file contains malformed JSON or is corrupted!'
				)
				config = DEFAULT_CONFIG
				forceSave = true
			}
		}
		return save(true, forceSave, 'read -> save')
	}

	/**
	 * File watching callback
	 */
	const watchCallback = (event: WatchEventType, filename: PathLike) => {
		if (filename == configName) {
			debug && logger.debug('[watchCallback]', `${filename} file`, '->', event)
			readConfig(configPath)
			if (event == 'change') {
				if (!silentMode) {
					debug && logger.debug('[watch]', '> run callbacks');
					runCallbacks();
				} else {
					debug && logger.debug('[watch]', '> silent change');
				}
			}
		}
	}

	/**
	 * Load configuration and start watching
	 */
	const load = (config_dir: PathLike | undefined = undefined) => {
		config_dir ||= configDir;
		configPath = path.join(config_dir, configName)
		readConfig(configPath)
		logger.debug(
			'[load]',
			`${configName} file`,
			'->',
			isLoaded() ? 'success' : 'failure'
		)
		if (isLoaded())
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
	const save = (silent = false, forceSave = true, reason = '') => {
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
	const setOption = async <K extends keyof TConfig>(key: K, value: TConfig[K]) => {
		if (!isLoaded()) return undefined;
		config = config as TConfig;
		if (typeof key == 'object' && value == void 0) {
			config = key
		} else if (typeof key == 'string') {
			let valuePath = key.split('.')
			if (valuePath.length >= 2) {
				let firstKey = valuePath.shift() as keyof TConfig;
				let lastKey = valuePath.pop() as string;
				if (!config[firstKey]) {
						config[firstKey] = {} as any;
				}

				let current = config[firstKey] as any;
				valuePath.reduce((o, k) => {
						if (!o[k]) {
								o[k] = {};
						}
						return o[k];
				}, current)[lastKey] = value;
			} else {
				config[key as keyof TConfig] = value;
			}
		} else {
			return
		}
		return save(false, true, 'set option')
	}

	/**
	 * Get option from config
	 */
	const getOption = (selector: ((config: TConfig) => Partial<TConfig>) | string | undefined = undefined, _default = false) => {
		if (!isLoaded()) return undefined;
		config = config as TConfig;
		let state: TConfig | Partial<TConfig> = Object.seal(_default ? DEFAULT_CONFIG : config as TConfig);
		if (typeof selector === 'function') {
			try {
				state = selector(state as TConfig);
			} catch (e) {} // тут похуй + поебать
		} else if (typeof selector === 'string') {
			let valuePath = selector.split('.');
			if (valuePath.length > 0) {
				let firstKey = valuePath.shift() as keyof TConfig;
				let current = state[firstKey] as any;
				// valuePath.reduce((o, k) => (o[k] = o[k] ?? {}), state[firstKey]) as Partial<TConfig>;
				valuePath.reduce((o, k, idx) => {
					if (idx === valuePath.length - 1) {
							// Last key in the path, stop reducing here
							o[k] = o[k] ?? {};
							return o[k];
					}
					o[k] = o[k] ?? {};
					return o[k];
				}, current);
			}
		}
		return state;
	}

	return {
		isLoaded,
		addCallback,
		removeCallback,
		watchOption,
		load,
		save,
		setOption,
		getOption,
	};
}