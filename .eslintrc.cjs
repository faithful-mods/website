'use strict';

module.exports = {
	extends: 'next/core-web-vitals',
	plugins: [
		'unused-imports',
		'custom-rules',
	],
	rules: {
		'comma-dangle': ['error', 'always-multiline'],
		'object-curly-spacing': ['warn', 'always'],
		'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
		'import/order': [
			'error',
			{
				'newlines-between': 'always',
				groups: [
					'builtin',
					'external',
					'internal',
					['parent', 'sibling', 'index'],
					'type',
				],
				pathGroups: [
					{
						pattern: 'react',
						group: 'builtin',
						position: 'after',
					},
					{
						pattern: 'react-icons/**',
						group: 'builtin',
						position: 'after',
					},
					{
						pattern: 'next/**',
						group: 'builtin',
						position: 'before',
					},
				],
				pathGroupsExcludedImportTypes: ['react', 'react-icons/**', 'next/**'],
				alphabetize: {
					order: 'asc',
					caseInsensitive: false,
				},
			},
		],
		indent: ['error', 'tab', { SwitchCase: 1 }],
		'no-multi-spaces': ['error', { ignoreEOLComments: true }],
		'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
		quotes: ['error', 'single'],
		semi: ['error', 'always'],
		'unused-imports/no-unused-imports': 'error',

		'custom-rules/page-export-naming': 'error',
		'custom-rules/layout-export-naming': 'error',
	},
};

