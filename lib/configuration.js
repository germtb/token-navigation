export const config = {
	ignoredTokens: {
		title: 'Tokens to ignore',
		description: 'This tokens will be skipped when using token navigation',
		type: 'array',
		default: [
			'(',
			')',
			'{',
			'}',
			'[',
			']',
			';',
			'.',
			'=',
			'=>',
			':',
			'jsxTagEnd',
			'jsxTagStart',
			'template'
		]
	},
	ignoreCommas: {
		title: 'Ignore commas',
		description: `
			Due to a bug in the atom settings, it is not possible to add a
			comma as an ignored token in the ignoredTokens option, so it has
			to be done here`,
		type: 'boolean',
		default: true
	}
}
