'use babel';

import { CompositeDisposable } from 'atom';
import * as babylon from 'babylon';
import fuzzy from 'fuzzy';

import FuzzyView from './token-navigation-fuzzy-view';
import { config } from './configuration';

export default {

	subscriptions: null,
	config: config,
	ignoredTokens: config.ignoredTokens.default,
	ignoreCommas: config.ignoreCommas.default,
	fuzzyView: null,
	modalPanel: null,

	activate(state) {

		this.fuzzyView = new FuzzyView();
		this.modalPanel = atom.workspace.addBottomPanel({
			item: this.fuzzyView.getElement(),
			visible: false
		});

		atom.config.observe('token-navigation.ignoredTokens', value => {
			this.ignoredTokens = value;
		});
		atom.config.observe('token-navigation.ignoreCommas', value => {
			this.ignoreCommas = value;
		});
		this.subscriptions = new CompositeDisposable();
		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'token-navigation:nextToken': () => this.multiNextToken(),
			'token-navigation:previousToken': () => this.multiPreviousToken(),
			'token-navigation:fuzzyToken': () => this.fuzzyToken()
		}));
	},

	deactivate() {
		this.modalPanel.destroy();
		this.subscriptions.dispose();
		this.fuzzyView.destroy();
	},

	serialize() {
		return {};
	},

	sillyParse(text) {
		const tokens = [];
		let match;
		const lines = text.split('\n');
		lines.forEach((line, lineNumber) => {
			const tokenRegex = /(("|'|`)([^"'`])*\2)|([^\s,\[\]\(\)\:]+|,|\[|\]|\(|\)|\:)/g;
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
	},

	tokens() {
		const editor = atom.workspace.getActiveTextEditor();
		const buffer = editor.getBuffer();
		const text = buffer.getText();
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
			tokens = this.sillyParse(text);
		}

		return tokens;
	},

	shouldIgnore(token, selectedRange) {
		if (!token) {
			return true;
		}
		if (this.ignoredTokens.indexOf(token.type.label) > -1) {
			return true;
		} else if (this.ignoreCommas && token.type.label === ',') {
			return true;
		}

		const atomRange = this.toAtomRange(token.loc.start, token.loc.end);
		return selectedRange.containsRange(atomRange);
	},

	fuzzyToken() {
		return (
			this.modalPanel.isVisible() ?
			this.modalPanel.hide() :
			this.modalPanel.show()
		);
	},

	nextNotIgnoredToken(tokens, index, selectedRange) {
		for (let i = index; i < tokens.length; i++) {
			const token = tokens[i];
			if (this.shouldIgnore(token, selectedRange)) {
				continue;
			}
			return token;
		}
	},

	previousNotIgnoredToken(tokens, index, selectedRange) {
		for (let i = index; i >= 0; i--) {
			const token = tokens[i];
			if (this.shouldIgnore(token, selectedRange)) {
				continue;
			}
			return token;
		}
	},

	multiNextToken() {
		const editor = atom.workspace.getActiveTextEditor();
		const tokens = this.tokens();
		const cursors = editor.cursors;
		const selectedRanges = editor.getSelectedBufferRanges();
		const ranges = cursors.map((cursor, index) =>
			this.nextToken(editor, tokens, cursor, selectedRanges[index])
		).filter(x => x);
		if (!ranges.length) {
			return;
		}

		editor.setSelectedBufferRanges(ranges);
	},

	multiPreviousToken() {
		const editor = atom.workspace.getActiveTextEditor();
		const tokens = this.tokens();
		const cursors = editor.cursors;
		const selectedRanges = editor.getSelectedBufferRanges();
		const ranges = cursors.map((cursor, index) =>
			this.previousToken(editor, tokens, cursor, selectedRanges[index])
		).filter(x => x);
		if (!ranges.length) {
			return;
		}

		editor.setSelectedBufferRanges(ranges);
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

	nextToken(editor, tokens, cursor, selectedRange) {
		const { line, column } = this.toBabelPoint(cursor.getBufferPosition());
		const isInside = this.isInToken({ line, column });
		const isBefore = this.isBeforeToken({ line, column });
		const isAfter = this.isAfterToken({ line, column });

		for (let i = 0; i < tokens.length - 1; i++) {
			const token = tokens[i];
			const nextToken = tokens[i + 1];

			if (isInside(token)) {
				const nextValidToken = this.nextNotIgnoredToken(tokens, i, selectedRange);
				if (!nextValidToken) {
					return;
				}
				return this.toAtomRange(nextValidToken.loc.start, nextValidToken.loc.end);
			}

			if (isAfter(token) && isBefore(nextToken)) {
				const nextValidToken = this.nextNotIgnoredToken(tokens, i + 1, selectedRange);
				if (!nextValidToken) {
					return;
				}
				return this.toAtomRange(nextValidToken.loc.start, nextValidToken.loc.end);
			}
		}
	},

	previousToken(editor, tokens, cursor, selectedRange) {
		const { line, column } = this.toBabelPoint(cursor.getBufferPosition());
		const isInside = this.isInToken({ line, column });
		const isBefore = this.isBeforeToken({ line, column });
		const isAfter = this.isAfterToken({ line, column });

		for (let i = 1; i < tokens.length; i++) {
			const previousToken = tokens[i - 1];
			const token = tokens[i];
			const { start, end } = token.loc;

			if (isInside(token)) {
				const previousValidToken = this.previousNotIgnoredToken(tokens, i, selectedRange);
				if (!previousValidToken) {
					return;
				}
				return this.toAtomRange(previousValidToken.loc.start, previousValidToken.loc.end);
			}

			if (isBefore(token) && isAfter(previousToken)) {
				const previousValidToken = this.previousNotIgnoredToken(tokens, i - 1, selectedRange);
				if (!previousValidToken) {
					return;
				}
				return this.toAtomRange(previousValidToken.loc.start, previousValidToken.loc.end);
			}
		}
	},

	toBabelPoint(atomPoint) {
		return {
			line: atomPoint.row + 1,
			column: atomPoint.column
		};
	},

	toAtomPoint(babelPoint) {
		return [ babelPoint.line - 1, babelPoint.column];
	},

	toAtomRange(start, end) {
		return [ this.toAtomPoint(start), this.toAtomPoint(end) ];
	}

};
