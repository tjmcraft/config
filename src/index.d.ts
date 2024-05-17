import { PathLike } from 'fs';

interface Logger {
	/**
	 * Log an error message
	 */
	error(...params: any[]): void;

	/**
	 * Log a warning message
	 */
	warn(...params: any[]): void;

	/**
	 * Log an informational message
	 */
	info(...params: any[]): void;

	/**
	 * Log a verbose message
	 */
	verbose(...params: any[]): void;

	/**
	 * Log a debug message
	 */
	debug(...params: any[]): void;

	/**
	 * Log a silly message
	 */
	silly(...params: any[]): void;

	/**
	 * Shortcut to info
	 */
	log(...params: any[]): void;
}

/**
 * Config Manager
 * @param {object} params
 * @param {string} params.configName Configuration filename
 * @param {string} params.configDir Configuration file directory
 * @param {object} params.defaultConfig Default configuration model
 * @param {Logger} params.logger Logger instance for debug
 * @param {boolean} params.debug Should debug some additional things to logger
 */
declare class Config<TConfig = AnyLiteral> {
	constructor({ configName, configDir, defaultConfig, logger, debug }: {
		configName: string;
		configDir: PathLike;
		defaultConfig: TConfig;
		logger: Logger;
		debug: boolean;
	});
	isLoaded: () => boolean;
	addCallback: (callback: (cfg: TConfig) => void) => void;
	removeCallback: (callback: (cfg: TConfig) => void) => void;
	watchOption: (selector?: undefined) => (callback?: Function) => void;
	load: (config_dir?: PathLike | undefined) => TConfig | undefined;
	save: (silent?: boolean, forceSave?: boolean, reason?: string) => boolean;
	setOption: <K extends keyof TConfig>(key: K, value: TConfig[K]) => Promise<boolean | undefined>;
	getOption: (selector?: ((config: TConfig) => Partial<TConfig>) | string | undefined, _default?: boolean) => Partial<TConfig> | undefined;
}

export = Config;
