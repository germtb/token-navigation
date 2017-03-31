'use babel';

import * as babylon from 'babylon';

const sillyParse = (text) => {
	const tokens = [];
	let match;
	const lines = text.split('\n');
	lines.forEach((line, lineNumber) => {
		const tokenRegex = /(("|'|`)([^"'`])*\2)|([^\s,\[\]\(\)\:{}=\.;]+|,|\[|\]|\(|\)|\:|{|}|=\>|=|\.|;)/g;
		while (match = tokenRegex.exec(line)) {
			if (!match) {
				break;
			}
			tokens.push({
				type: {
					label: match[0]
				},
				loc: {
					start: {
						line: lineNumber + 1,
						column: match.index
					},
					end: {
						line: lineNumber + 1,
						column: match.index + match[0].length
					}
				}
			})
		}
	});

	return tokens;
};

export default {

	parse(text) {
		let tokens;

		try {
			const ast = babylon.parse(text, {
				sourceType: 'module',
				plugins: [
					'objectRestSpread',
					'asyncGenerators',
					'jsx',
					'classProperties',
					'exportExtensions'
				]
			});
			tokens = ast.tokens;
		} catch(e) {
			tokens = sillyParse(text);
		}

		return tokens;
	},

	isInToken: ({ line, column }) =>  token => {
		return token.loc.start.line<= line
			&& token.loc.start.column <= column
			&& token.loc.end.line >= line
			&& token.loc.end.column >= column;
	},

	isAfterToken: ({ line, column }) =>  token => {
		return token.loc.end.line < line
			|| (token.loc.end.line === line && token.loc.end.column < column);
	},

	isBeforeToken: ({ line, column }) =>  token => {
		return token.loc.start.line > line
			|| (token.loc.start.line === line && token.loc.start.column > column);
	},

	toBabelPoint(atomPoint) {
		return {
			line: atomPoint.row + 1,
			column: atomPoint.column
		};
	},

	toAtomRange(start, end) {
		return [
			[ start.line - 1, start.column ],
			[ end.line - 1, end.column]
		];
	}

};
