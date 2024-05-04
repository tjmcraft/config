const path = require('node:path');

const launcherDir = path.normalize(
	(
		process.env.APPDATA || (
			process.platform == 'darwin' ?
				process.env.HOME + '/Library/Preferences' :
				process.env.HOME
		)
	) + '/.tjmc'
);

exports.launcherDir = launcherDir;