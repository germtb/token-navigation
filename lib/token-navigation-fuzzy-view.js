'use babel';

import ReactDOM from 'react-dom';
import React from 'react';
import fuzzy from 'fuzzy';
import classNames from 'classnames';

import { parse, toAtomRange } from './tokens-utils';

export const searchStatus = (state) => {
	if (!state.pattern || state.pattern.length < 3) {
		return 'NO_SEARCH';
	} else if (state.results && state.results.length > 0) {
		return 'SEARCH_SUCCESS';
	} else {
		return 'SEARCH_FAILED';
	}
}

const header = (state) => {
	if (searchStatus(state) === 'NO_SEARCH') {
		return 'Fuzzy token search';
	}

	return `${state.results.length} results for '${state.pattern}'`;
};

const searchLabel = (state) => {
	const search = searchStatus(state);
	if (search === 'NO_SEARCH') {
		return '';
	} else if (search === 'SEARCH_SUCCESS') {
		return `${state.selectedToken + 1} of ${state.results.length}`;
	} else {
		return 'No results'
	}
};

export const isFocused = (state) => {
	return state.searchEditor.classList.contains('is-focused');
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
		if (searchStatus(state) !== 'SEARCH_SUCCESS') {
			return state;
		}

		let selectedToken = state.selectedToken + 1;
		if (selectedToken >= state.results.length) {
			selectedToken = 0;
		}

		return {
			...state,
			selectedToken
		};
	} else if (type === 'PREVIOUS') {
		if (searchStatus(state) !== 'SEARCH_SUCCESS') {
			return state;
		}


		let selectedToken = state.selectedToken - 1;
		if (selectedToken < 0) {
			selectedToken = state.results.length - 1;
		}

		return {
			...state,
			selectedToken
		};
	} else if (type === 'SET_SEARCH') {
		return {
			...state,
			pattern: payload.pattern,
			results: payload.results
		};
	} else if (type === 'SET_EDITOR') {
		return updatedState(state, 'editor', payload);
	} else if (type === 'SET_SEARCH_EDITOR') {
		return updatedState(state, 'searchEditor', payload);
	} else if (type === 'FOCUS') {
		state.searchEditor.focus();
		return state;
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
			editor: state.editor,
			status: searchStatus(state)
		};

		this.mapStateToProps = this.mapStateToProps.bind(this);
		this.search = this.search.bind(this);
		this.hide = this.hide.bind(this);
		this.next = this.next.bind(this);
		this.previous = this.previous.bind(this);
		this.selectAll = this.selectAll.bind(this);
		this.focus = this.focus.bind(this);
	}

	mapStateToProps(state) {
		this.setState({
			header: header(state),
			searchLabel: searchLabel(state),
			editor: state.editor,
			status: searchStatus(state),
			results: state.results
		});
	}

	componentDidMount() {
		this.store.dispatch({
			type: 'SET_SEARCH_EDITOR',
			payload: this.searchEditor
		});
		this.store.subscribe('FuzzyToken', this.mapStateToProps);
		this.searchEditor.addEventListener('core:cancel', this.hide);
		this.searchEditor.addEventListener('token-navigation:next', this.next);
		this.searchEditor.addEventListener('token-navigation:previous', this.previous);
		this.searchEditor.addEventListener('token-navigation:all', this.selectAll)
		const buffer = this.searchEditor.getModel().getBuffer();
		buffer.onDidChange(_ => {
			const pattern = buffer.getText();
			this.search(pattern);
		});
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
		this.focus();
	}

	previous() {
		this.store.dispatch({
			type: 'PREVIOUS'
		});
		this.focus();
	}

	focus() {
		this.searchEditor.focus();
	}

	selectAll() {
		this.state.editor.setSelectedBufferRanges(this.state.results);
		const view = atom.views.getView(this.state.editor);
		view.focus();
	}

	render() {
		const {
			header,
			searchLabel,
			status
		} = this.state;

		const findAndReplaceClassNames = classNames('find-and-replace', {
			'has-no-results': status === 'SEARCH_FAILED',
			'has-results': status === 'SEARCH_SUCCESS'
		});

		return (
			<atom-panel-container ref={ element => {
				if (!element) {
					return;
				}
				element.className = 'bottom';
			}}>
					<atom-panel ref={ element => {
						if (!element) {
							return;
						}
						element.className = 'tool-panel panel-bottom bottom';
					}}>
						<div className={ findAndReplaceClassNames } >
							<header className='header' >
								<span className='header-item description'>
									{ header }
								</span>
							</header>
							<section className='input-block find-container'>
								<div className='input-block-item input-block-item--flex editor-container'>
									<atom-text-editor
										mini
										ref={ element => {
											if (!element) {
												return;
											}
											element.className = classNames('editor mini fuzzy-view', {
												'is-focused': element.classList.contains('is-focused')
											});
											this.searchEditor = element;
											this.focus();
										}}
									/>
								</div>
								<div style={{
									position: 'absolute',
									zIndex: 5,
									right: 18,
									top: 5,
									textAlign: 'right',
									width: 100,
									margin: 0
								}} className='find-meta-container'>
									<span className='text-subtle result-counter'>
										{ searchLabel }
									</span>
								</div>
							</section>
						</div>
					</atom-panel>
			</atom-panel-container>
		);
	}
};

export function initReact(store) {
	const rootElement = document.querySelector('atom-pane-container');
	const reactRoot = document.createElement('div');
	rootElement.insertAdjacentElement('afterend', reactRoot);
	ReactDOM.render(<FuzzyTokenWrapper store={ store }/>, reactRoot);
}
