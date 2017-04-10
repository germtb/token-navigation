'use babel';

import ReactDOM from 'react-dom';
import React from 'react';

import TokenNavigationView from './token-navigation-view';
import fuzzy from 'fuzzy';
import { parse, toAtomRange } from './tokens-utils';

const hasResults = (state) => {
	return !noSearch(state)
		&& !searchFailed(state);
};

const searchFailed = (state) => {
	return state.pattern
		&& state.pattern.length >= 3
		&& state.results
		&& state.results.length === 0;
};

const noSearch = (state) => {
	return !state.pattern
		|| state.pattern.length < 3;
};

const header = (state) => {
	if (noSearch(state)) {
		return 'Fuzzy token search';
	}

	return `${state.results.length} results for '${state.pattern}'`;
};

const searchLabel = (state) => {
	if (noSearch(state)) {
		return '';
	} else if (searchFailed(state)) {
		return 'No results'
	} else {
		return `${state.selectedToken} of ${state.results.length}`;
	}
};

export const storeCreator = () => {
	let state = {
		results: [],
		selectedToken: 0,
		pattern: ''
	};
	let listeners = {};
	return {
		getState: () => {
			return state;
		},
		dispatch: action => {
			state = reducers(state, action);
			Object.keys(listeners).forEach(key => {
				listeners[key] && listeners[key](state)
			});
		},
		subscribe: (key, l) => {
			listeners = {
				...listeners,
				[key]: l
			};
		},
		unsubscribe: key => {
			delete listeners[key];
		}
	}
};

const updatedState = (state, property, payload) => {
	return {
		...state,
		[property]: payload
	};
};

const selectToken = (editor, token) => {
	editor.setSelectedBufferRange(token);
}

const reducers = (state, { type, payload }) => {
	if (type === 'SHOW') {
		return {
			...state,
			visible: true,
			editor: payload
		};
	}
	else if (type === 'HIDE') {
		return {
			...state,
			visible: false,
			results: [],
			selectedToken: 0,
			pattern: ''
		};
	} else if (type === 'SET_HEADER') {
		return updatedState(state, 'header', payload);
	} else if (type === 'SET_SEARCH_RESULTS') {
		return {
			...state,
			results: payload,
			selectedToken: 0
		};
	} else if (type === 'NEXT') {
		if (noSearch(state) || searchFailed(state)) {
			return state;
		}

		let selectedToken = state.selectedToken + 1;
		if (selectedToken >= state.results.length) {
			selectedToken = 0;
		}

		selectToken(state.editor, state.results[selectedToken]);

		return {
			...state,
			selectedToken
		};
	} else if (type === 'PREVIOUS') {
		if (noSearch(state) || searchFailed(state)) {
			return state;
		}


		let selectedToken = state.selectedToken - 1;
		if (selectedToken < 0) {
			selectedToken = state.results.length - 1;
		}

		selectToken(state.editor, state.results[selectedToken]);

		return {
			...state,
			selectedToken
		};
	} else if (type === 'SET_SEARCH') {
		const nextState = {
			...state,
			pattern: payload.pattern,
			results: payload.results
		};
		if (hasResults(nextState)) {
			selectToken(state.editor, payload.results[state.selectedToken]);
		}
		return nextState;
	} else if (type === 'SET_EDITOR') {
		return updatedState(state, 'editor', payload);
	}

	return state;
};

class FuzzyTokenWrapper extends React.PureComponent {
	constructor(props) {
		super(props);
		this.store = props.store;
		this.mapStateToProps = this.mapStateToProps.bind(this);
		this.state = {
			visible: false
		};
	}

	mapStateToProps(state) {
		this.setState({
			visible: state.visible
		});
	}

	componentDidMount() {
		this.store.subscribe('FuzzyTokenWrapper', this.mapStateToProps);
	}

	componentWillUnmount() {
		this.store.unsubscribe('FuzzyTokenWrapper');
	}


	render() {
		return this.state.visible ? <FuzzyToken { ...this.props } /> : null;
	}
}

class FuzzyToken extends React.PureComponent {

	constructor(props) {
		super(props);
		this.store = props.store;

		const state = this.store.getState();
		this.state = {
			header: header(state),
			searchLabel: searchLabel(state),
			editor: state.editor
		};

		this.mapStateToProps = this.mapStateToProps.bind(this);
		this.search = this.search.bind(this);
		this.hide = this.hide.bind(this);
		this.next = this.next.bind(this);
		this.previous = this.previous.bind(this);
		this.store.subscribe('FuzzyToken', this.mapStateToProps);
	}

	mapStateToProps(state) {
		this.setState({
			header: header(state),
			searchLabel: searchLabel(state),
			editor: state.editor
		});
	}

	componentDidMount() {
	}

	componentWillUnmount() {
		this.store.unsubscribe('FuzzyToken');
	}

	search(pattern) {
		const text = this.state.editor.getBuffer().getText();
		if (text.length < 3) {
			return;
		}

		const tokens = parse(text);
		const tokenValues = tokens.map(t => t.value || t.type.label).map(String);
		const results = fuzzy.filter(pattern, tokenValues, {
			pre: '<',
			post: '>'
		}).map(t => tokens[t.index].loc).map(toAtomRange);

		this.store.dispatch({
			type: 'SET_SEARCH',
			payload: {
				pattern,
				results
			}
		});
	}

	hide() {
		this.store.dispatch({
			type: 'HIDE'
		});
	}

	next() {
		this.store.dispatch({
			type: 'NEXT'
		});
	}

	previous() {
		this.store.dispatch({
			type: 'PREVIOUS'
		});
	}

	componentDidMount() {
		this.searchEditor.addEventListener('core:cancel', this.hide);
		this.searchEditor.addEventListener('token-navigation:nextFuzzyToken', this.next);
		this.searchEditor.addEventListener('token-navigation:previousFuzzyToken', this.previous);
		// this.searchEditor.addEventListener('token-navigation:allFuzzyToken', this.selectAll.bind(this))
		// this.searchEditor.addEventListener('blur', this.updateUI.bind(this));
		const buffer = this.searchEditor.getModel().getBuffer();
		buffer.onDidChange(_ => {
			const pattern = buffer.getText();
			this.search(pattern);
		});
	}

	render() {
		const {
			header,
			searchLabel
		} = this.state;

		return (
			<atom-panel-container className='bottom'>
				<atom-panel style={{ padding: '5px 10px' }} className='tool-panel panel-bottom bottom'>
					<div style={{ paddingBottom: 5 }}>{ header }</div>
					<atom-text-editor
						mini
						className='editor fuzzy-view mini'
						ref={ editor => {
							if (editor) {
								editor.focus();
								this.searchEditor = editor;
							}
						}}
					/>
						<div style={{
							position: 'absolute',
							zIndex: 5,
							right: 18,
							bottom: 12,
							textAlign: 'right',
							width: 100
						}}> { searchLabel } </div>
				</atom-panel>
			</atom-panel-container>
		);
	}
};

export function initReact(store) {
	const rootElement = document.querySelector('atom-pane-container');
	const reactRoot = document.createElement('div');
	rootElement.insertAdjacentElement('afterend', reactRoot)
	ReactDOM.render(<FuzzyTokenWrapper store={ store }/>, reactRoot);
}

		// const fuzzyPattern = this.nameEditor.getModel().getBuffer().getText();
		//
		// if (this.ranges.length) {
		// 	this.resultContainer.innerText = `${this.selectedToken + 1} of ${this.ranges.length}`;
		// 	this.resultContainer.style.color = '#73c990';
		// } else {
		// 	this.resultContainer.style.color = fuzzyPattern >= 3 ? '#ff6347' : 'white';
		// 	this.resultContainer.innerText = fuzzyPattern >= 3 ? 'No results'  : '';
		// }
		//
		// if (fuzzyPattern.length < 3) {
		// 	this.headerTitle.innerText = 'Fuzzy search tokens';
		// } else {
		// 	this.headerTitle.innerText = `${this.ranges.length} results for '${fuzzyPattern}'`;
		// }
		//
		// if (this.nameEditor.classList.contains('is-focused')) {
		// 	if (fuzzyPattern.length < 3) {
		// 		this.nameEditor.style['border-color'] = '#568af2';
		// 		this.nameEditor.style['box-shadow'] = '0 0 0 1px #568af2';
		// 	} else {
		// 		const finalColor = this.ranges.length ? '#73c990' : '#ff6347';
		// 		this.nameEditor.style['border-color'] = finalColor;
		// 		this.nameEditor.style['box-shadow'] = `0 0 0 1px ${finalColor}`;
		// 	}
		// } else {
		// 	this.nameEditor.style['border-color'] = '';
		// 	this.nameEditor.style['box-shadow'] = '';
		// }
		//

	// selectCurrent() {
	// 		this.updateUI();
	// 		if (!this.ranges.length) {
	// 			return;
	// 		}
	// 		this.editor.setSelectedBufferRange(this.ranges[this.selectedToken]);
	// }
	//
	// selectAll() {
	// 	if (!this.ranges.length) {
	// 		this.updateUI();
	// 		return;
	// 	}
	// 	this.editor.setSelectedBufferRanges(this.ranges);
	// 	const view = atom.views.getView(this.editor);
	// 	view.focus();
	// 	this.updateUI();
	// }
