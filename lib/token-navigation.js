'use babel'

import ReactDOM from 'react-dom'
import React from 'react'
import { Provider } from 'react-redux'
import { CompositeDisposable } from 'atom'
import * as babylon from 'babylon'
import { createStore } from 'redux'

import FuzzyView from './token-navigation-fuzzy-view'

import { searchStatus, isFocused, selectedToken } from './selectors'

import reducers from './reducers'

import { config } from './configuration'

import {
	sillyParse,
	isInToken,
	isAfterToken,
	isBeforeToken,
	parse,
	toBabelPoint,
	toAtomRange
} from './tokens-utils'

export default {
	subscriptions: null,
	config: config,
	ignoredTokens: config.ignoredTokens.default,
	ignoreCommas: config.ignoreCommas.default,
	store: createStore(reducers),

	onChange() {
		const state = this.store.getState()
		const editor = state.editor
		if (searchStatus(state) === 'SEARCH_SUCCESS') {
			editor && editor.setSelectedBufferRange(selectedToken(state))
		}
	},

	activate() {
		const reactRoot = document.createElement('div')
		ReactDOM.render(
			<Provider store={this.store}>
				<FuzzyView />
			</Provider>,
			reactRoot
		)
		atom.workspace.addBottomPanel({ item: reactRoot, model: {} })

		// Side effect: find a better solution
		this.store.subscribe(this.onChange.bind(this))

		atom.config.observe('token-navigation.ignoredTokens', value => {
			this.ignoredTokens = value
		})

		atom.config.observe('token-navigation.ignoreCommas', value => {
			this.ignoreCommas = value
		})

		this.subscriptions = new CompositeDisposable()
		this.subscriptions.add(
			atom.commands.add('atom-workspace', {
				'token-navigation:nextToken': this.multiNextToken.bind(this),
				'token-navigation:previousToken': this.multiPreviousToken.bind(this),
				'token-navigation:fuzzySearch': this.fuzzySearch.bind(this)
			})
		)
	},

	deactivate() {
		this.disposables = []
		this.subscriptions.dispose()

		this.renameView && this.renameView.destroy()
		this.renameView = null
	},

	serialize() {
		return {}
	},

	shouldIgnore(token, selectedRange) {
		if (!token) {
			return true
		}
		if (this.ignoredTokens.indexOf(token.type.label) > -1) {
			return true
		} else if (this.ignoreCommas && token.type.label === ',') {
			return true
		}

		const atomRange = toAtomRange(token.loc)
		return selectedRange.containsRange(atomRange)
	},

	fuzzySearch() {
		if (this.store.getState().visible) {
			isFocused(this.store.getState()) ? this.hide() : this.focus()
		} else {
			this.show()
		}
	},

	show() {
		const editor = atom.workspace.getActiveTextEditor()
		this.store.dispatch({ type: 'SHOW', payload: editor })
	},

	focus() {
		const editor = atom.workspace.getActiveTextEditor()
		this.store.dispatch({ type: 'FOCUS', payload: editor })
		// Side effect: find a better solution
		this.store.getState().searchEditor.focus()
	},

	hide() {
		this.store.dispatch({ type: 'HIDE' })
		const editor = atom.workspace.getActiveTextEditor()
		const view = atom.views.getView(editor)
		view.focus()
	},

	nextNotIgnoredToken(tokens, index, selectedRange) {
		for (let i = index; i < tokens.length; i++) {
			const token = tokens[i]
			if (this.shouldIgnore(token, selectedRange)) {
				continue
			}
			return token
		}
	},

	previousNotIgnoredToken(tokens, index, selectedRange) {
		for (let i = index; i >= 0; i--) {
			const token = tokens[i]
			if (this.shouldIgnore(token, selectedRange)) {
				continue
			}
			return token
		}
	},

	multiNextToken() {
		const editor = atom.workspace.getActiveTextEditor()

		const buffer = editor.getBuffer()
		const text = buffer.getText()
		const tokens = parse(text)
		const cursors = editor.cursors
		const selectedRanges = editor.getSelectedBufferRanges()
		const ranges = cursors
			.map((cursor, index) =>
				this.nextToken(editor, tokens, cursor, selectedRanges[index])
			)
			.filter(x => x)
		if (!ranges.length) {
			return
		}

		editor.setSelectedBufferRanges(ranges)
	},

	multiPreviousToken() {
		const editor = atom.workspace.getActiveTextEditor()

		const buffer = editor.getBuffer()
		const text = buffer.getText()
		const tokens = parse(text)
		const cursors = editor.cursors
		const selectedRanges = editor.getSelectedBufferRanges()
		const ranges = cursors
			.map((cursor, index) =>
				this.previousToken(editor, tokens, cursor, selectedRanges[index])
			)
			.filter(x => x)
		if (!ranges.length) {
			return
		}

		editor.setSelectedBufferRanges(ranges)
	},

	nextToken(editor, tokens, cursor, selectedRange) {
		const { line, column } = toBabelPoint(cursor.getBufferPosition())
		const isInside = isInToken({ line, column })
		const isBefore = isBeforeToken({ line, column })
		const isAfter = isAfterToken({ line, column })

		for (let i = 0; i < tokens.length - 1; i++) {
			const token = tokens[i]
			const nextToken = tokens[i + 1]

			if (isInside(token)) {
				const nextValidToken = this.nextNotIgnoredToken(
					tokens,
					i,
					selectedRange
				)
				if (!nextValidToken) {
					return
				}
				return toAtomRange(nextValidToken.loc)
			}

			if (isAfter(token) && isBefore(nextToken)) {
				const nextValidToken = this.nextNotIgnoredToken(
					tokens,
					i + 1,
					selectedRange
				)
				if (!nextValidToken) {
					return
				}
				return toAtomRange(nextValidToken.loc)
			}
		}
	},

	previousToken(editor, tokens, cursor, selectedRange) {
		const { line, column } = toBabelPoint(cursor.getBufferPosition())
		const isInside = isInToken({ line, column })
		const isBefore = isBeforeToken({ line, column })
		const isAfter = isAfterToken({ line, column })

		for (let i = 1; i < tokens.length; i++) {
			const previousToken = tokens[i - 1]
			const token = tokens[i]
			const { start, end } = token.loc

			if (isInside(token)) {
				const previousValidToken = this.previousNotIgnoredToken(
					tokens,
					i,
					selectedRange
				)
				if (!previousValidToken) {
					return
				}
				return toAtomRange(previousValidToken.loc)
			}

			if (isBefore(token) && isAfter(previousToken)) {
				const previousValidToken = this.previousNotIgnoredToken(
					tokens,
					i - 1,
					selectedRange
				)
				if (!previousValidToken) {
					return
				}
				return toAtomRange(previousValidToken.loc)
			}
		}
	}
}
