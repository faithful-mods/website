const plugin = {
	rules: {
		'page-export-naming': require('./rules/page-export-naming.cjs'),
		'layout-export-naming': require('./rules/layout-export-naming.cjs'),
	},
};

module.exports = plugin;
