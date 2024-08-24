const { sep } = require('path');

module.exports = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Enforce the default export names to ends with "Layout" in layout.tsx files',
			category: 'Best Practices',
			recommended: true,
		},
		messages: {
			invalidExportName: 'Default export name must ends with "Layout"',
			invalidExportType: 'Default export must be a function',
		},
		fixable: 'code',
		schema: [],
	},
	/**
	 * @param {import('eslint').Rule.RuleContext} context
	 */
	create(context) {
		const filename = context.filename.split(sep).pop();
		if (filename !== 'layout.tsx') return {};

		return {
			ExportDefaultDeclaration(node) {
				if (node.declaration.type === 'FunctionDeclaration' || (node.declaration.type === 'ArrowFunctionExpression' && node.declaration.id)) {
					/**
					 * @type {string | undefined}
					 */
					const functionName = node.declaration.id && node.declaration.id.name;

					if (functionName && !functionName.endsWith('Layout')) {
						context.report({
							node,
							messageId: 'invalidExportName',
							fix(fixed) {
								const newName = `${functionName}Layout`;
								const start = node.declaration.id.range[0];
								const end = node.declaration.id.range[1];
								return fixed.replaceTextRange([start, end], newName);
							},
						});
					}
				}

				if (node.declaration.type === 'Identifier') {
					context.report({
						node,
						messageId: 'invalidExportType',
					});
				}
			},
		};

	},
};
