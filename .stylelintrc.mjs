export default {
	extends: ['stylelint-config-standard', 'stylelint-config-standard-scss'],
	plugins: ['stylelint-scss'],
	overrides: [
		{
			files: ['*.scss', '**/*.css'],
			customSyntax: 'postcss-scss',
		},
	],
	rules: {
		'selector-id-pattern': null,
		'scss/at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'variants',
          'responsive',
          'screen',
        ],
      },
    ],
	},
};