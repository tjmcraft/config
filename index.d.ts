import { PathLike } from 'fs';

/**
 * Config Manager
 * @param {object} params
 * @param {string} params.configName Configuration filename
 * @param {string} params.configDir Configuration file directory
 * @param {object} params.defaultConfig Default configuration model
 * @param {LoggerUtil} params.logger Logger instance for debug
 * @param {boolean} params.debug Should debug some additional things to logger
 */
declare class Config<TConfig = AnyLiteral> {
	constructor({ configName, configDir, defaultConfig, logger, debug }: {
		configName: string;
		configDir: PathLike;
		defaultConfig: TConfig;
		logger: any;
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
