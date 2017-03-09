'use babel';

import { CompositeDisposable } from 'atom';
import * as babylon from 'babylon';
import { config } from './configuration';

export default {

	subscriptions: null,

	config: config,

	ignoredTokens: config.ignoredTokens.default,
	ignoreCommas: config.ignoreCommas.default,

	lastAST: null,

	activate(state) {

		atom.config.observe('token-navigation.ignoredTokens', value => {
			this.ignoredTokens = value;
		});
		atom.config.observe('token-navigation.ignoreCommas', value => {
			this.ignoreCommas = value;
		});
		this.subscriptions = new CompositeDisposable();
		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'token-navigation:nextToken': () => this.nextToken(),
			'token-navigation:previousToken': () => this.previousToken()
		}));
	},

	deactivate() {
		this.modalPanel.destroy();
		this.subscriptions.dispose();
		this.tokenNavigationView.destroy();
	},

	serialize() {
		return {};
	},

	ast() {
		const editor = atom.workspace.getActiveTextEditor();
		const buffer = editor.getBuffer();
		const text = buffer.getText();
		let ast;

		try {
			ast = babylon.parse(text, {
				sourceType: 'module',
				plugins: [
					'objectRestSpread',
					'asyncGenerators',
					'jsx',
					'classProperties',
					'exportExtensions'
				]
			});
			this.lastAST = ast;
		} catch(e) {
			ast = this.lastAST;
		}

		return ast;
	},

	shouldIgnore(token, selectedRange) {
		if (this.ignoredTokens.indexOf(token.type.label) > -1) {
			return true;
		} else if (this.ignoreCommas && token.type.label === ',') {
			return true;
		}

		const atomRange = this.toAtomRange(token.loc.start, token.loc.end);
		return selectedRange.containsRange(atomRange);
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
		for (let i = index; i < tokens.length; i--) {
			const token = tokens[i];
			if (this.shouldIgnore(token, selectedRange)) {
				continue;
			}
			return token;
		}
	},

	nextToken() {
		const editor = atom.workspace.getActiveTextEditor();
		const tokens = this.ast().tokens;
		const { line, column } = this.toBabelPoint(editor.getCursorBufferPosition());
		const selectedRange = editor.getSelectedBufferRange();

		let nextToken;

		for (let i = 0; i < tokens.length - 1; i++) {
			const token = tokens[i];
			const { start, end } = token.loc;

			if (start.column > column || end.column < column) {
				continue;
			}

			if (start.line > line || end.line < line) {
				continue;
			}

			nextToken = this.nextNotIgnoredToken(tokens, i + 1, selectedRange);
			break;
		}

		if (nextToken) {
			const atomRange = this.toAtomRange(nextToken.loc.start, nextToken.loc.end);
			editor.setSelectedBufferRange(atomRange);
		}
	},

	previousToken() {
		const editor = atom.workspace.getActiveTextEditor();
		const tokens = this.ast().tokens;
		const { line, column } = this.toBabelPoint(editor.getCursorBufferPosition());
		const selectedRange = editor.getSelectedBufferRange();

		let previousToken;

		for (let i = 1; i < tokens.length; i++) {
			const token = tokens[i];
			const { start, end } = token.loc;

			if (start.column > column || end.column < column) {
				continue;
			}

			if (start.line > line || end.line < line) {
				continue;
			}

			previousToken = this.previousNotIgnoredToken(tokens, i - 1, selectedRange);
			break;
		}

		if (previousToken) {
			const atomRange = this.toAtomRange(previousToken.loc.start, previousToken.loc.end);
			editor.setSelectedBufferRange(atomRange);
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
