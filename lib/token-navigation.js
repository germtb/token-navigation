'use babel';

import { CompositeDisposable } from 'atom';
import * as babylon from 'babylon';

import FuzzyView, { initReact, storeCreator } from './token-navigation-fuzzy-view';
import { config } from './configuration';
import {
	sillyParse,
	isInToken,
	isAfterToken,
	isBeforeToken,
	parse,
	toBabelPoint,
	toAtomRange
} from './tokens-utils';

export default {

	subscriptions: null,
	config: config,
	ignoredTokens: config.ignoredTokens.default,
	ignoreCommas: config.ignoreCommas.default,
	fuzzyView: null,
	modalPanel: null,

	activate(state) {
		const editor = atom.workspace.getActiveTextEditor();
		this.store = storeCreator();
		initReact(this.store);

		this.fuzzyView = new FuzzyView();
		this.fuzzyView.initialize(this);
		this.fuzzyView.hide = this.hide.bind(this);
		this.fuzzyView.editor = editor;
		this.modalPanel = atom.workspace.addBottomPanel({
			item: this.fuzzyView,
			priority: 0,
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
		this.disposables = [];
		this.subscriptions.dispose();

		this.renameView && this.renameView.destroy();
		this.renameView = null;

		this.modalPanel && this.modalPanel.destroy();
		this.modalPanel = null;
	},

	serialize() {
		return {};
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

		const atomRange = toAtomRange(token.loc);
		return selectedRange.containsRange(atomRange);
	},

	fuzzyToken() {
		if (this.modalPanel.isVisible()) {
			const isFocused = this.fuzzyView.nameEditor.classList.contains('is-focused');
			isFocused ? this.hide() : this.show();
		} else {
			this.show();
		}
	},

	show() {
		this.store.dispatch({ type: 'SET_VISIBILITY', payload: true });
		const editor = atom.workspace.getActiveTextEditor();
		this.fuzzyView.nameEditor.getModel().getBuffer().setText(editor.getSelectedText());
		this.fuzzyView.nameEditor.getModel().selectAll();
		this.fuzzyView.editor = editor;
		this.fuzzyView.show();

		this.modalPanel.show();
		this.fuzzyView.nameEditor.focus();
	},

	hide() {
		this.store.dispatch({ type: 'SET_VISIBILITY', payload: false });
		const editor = atom.workspace.getActiveTextEditor();
		const view = atom.views.getView(editor);
		view.focus();
		this.fuzzyView.ranges = [];
		this.modalPanel.hide();
	},

	nextNotIgnoredToken(tokens, index, selectedRange) {
		for (let i = index;  i < tokens.length; i++) {
			const token = tokens[i];
			if (this.shouldIgnore(token, selectedRange)) {
				continue;
			}
			return token;
		}
	},

	previousNotIgnoredToken(tokens, index, selectedRange) {
		for (let i = index;  i >= 0; i--) {
			const token = tokens[i];
			if (this.shouldIgnore(token, selectedRange)) {
				continue;
			}
			return token;
		}
	},

	multiNextToken() {
		const editor = atom.workspace.getActiveTextEditor();

		const buffer = editor.getBuffer();
		const text = buffer.getText();
		const tokens = parse(text);
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

		const buffer = editor.getBuffer();
		const text = buffer.getText();
		const tokens = parse(text);
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

	nextToken(editor, tokens, cursor, selectedRange) {
		const { line, column } = toBabelPoint(cursor.getBufferPosition());
		const isInside = isInToken({ line, column });
		const isBefore = isBeforeToken({ line, column });
		const isAfter = isAfterToken({ line, column });

		for (let i = 0; i < tokens.length - 1; i++) {
			const token = tokens[i];
			const nextToken = tokens[i + 1];

			if (isInside(token)) {
				const nextValidToken = this.nextNotIgnoredToken(tokens, i, selectedRange);
				if (!nextValidToken) {
					return;
				}
				return toAtomRange(nextValidToken.loc);
			}

			if (isAfter(token) && isBefore(nextToken)) {
				const nextValidToken = this.nextNotIgnoredToken(tokens, i + 1, selectedRange, set);
				if (!nextValidToken) {
					return;
				}
				return toAtomRange(nextValidToken.loc);
			}
		}
	},

	previousToken(editor, tokens, cursor, selectedRange) {
		const { line, column } = toBabelPoint(cursor.getBufferPosition());
		const isInside = isInToken({ line, column });
		const isBefore = isBeforeToken({ line, column });
		const isAfter = isAfterToken({ line, column });

		for (let i = 1; i < tokens.length; i++) {
			const previousToken = tokens[i - 1];
			const token = tokens[i];
			const { start, end } = token.loc;

			if (isInside(token)) {
				const previousValidToken = this.previousNotIgnoredToken(tokens, i, selectedRange)
				if (!previousValidToken) {
					return;
				}
				return toAtomRange(previousValidToken.loc);
			}

			if (isBefore(token) && isAfter(previousToken)) {
				const previousValidToken = this.previousNotIgnoredToken(tokens, i - 1, selectedRange)
				if (!previousValidToken) {
					return;
				}
				return toAtomRange(previousValidToken.loc);
			}
		}
	},

};
