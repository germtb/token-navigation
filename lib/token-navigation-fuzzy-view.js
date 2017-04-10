'use babel';

import ReactDOM from 'react-dom';
import React from 'react';

import TokenNavigationView from './token-navigation-view';
import fuzzy from 'fuzzy';
import { parse, toAtomRange } from './tokens-utils';

export const storeCreator = () => {
	let state = {};
	const listeners = [];
	return {
		getState: () => {
			return state;
		},
		dispatch: action => {
			state = reducers(state, action);
			listeners.forEach(l => l(state));
		},
		subscribe: l => {
			listeners.push(l);
		}
	}
};

const reducedState = (state, property, payload) => {
	return {
		...state,
		[property]: payload
	};
};

const reducers = (state, { type, payload }) => {
	if (type === 'SET_VISIBILITY') {
		return reducedState(state, 'visible', payload);
	} else if (type === 'SET_HEADER') {
		return reducedState(state, 'header', payload);
	}

	return state;
};

class FuzzyToken extends React.Component {

	constructor(props) {
		super(props);
		this.store = props.store;
		this.store.subscribe(state => this.setState({ visible: state.visible }));
		this.state = {
			visible: true,
			header: 'Fuzzy search token',
			selectedToken: 0,
			ranges: []
		};
	}

	componentDidMount() {
		this.editor.focus();
	}

	componentWillUnmount() {

	}

	render() {
		if (!this.state.visible) {
			return null;
		}

		const { selectedToken, ranges, header } = this.state;

		return <atom-panel-container className='bottom'>
			<atom-panel style={{
				padding: '5px 10px'
			}} className='bottom tool-panel panel-bottom'>
				<div style={{ paddingBottom: 5 }}>{ header }</div>
				<atom-text-editor
					mini
					className='editor fuzzy-view mini'
					ref={ editor => { editor && editor.focus() } }
				/>
				<div style={{
					position: 'absolute',
			    zIndex: 5,
			    right: 18,
			    bottom: 12,
			    textAlign: 'right',
			    width: 100
				}}>{ `${selectedToken} of ${ranges.length}` }</div>
			</atom-panel>
		</atom-panel-container>;
	}
};

export function initReact(store) {
	const rootElement = document.querySelector('atom-pane-container');
	const reactRoot = document.createElement('div');
	rootElement.insertAdjacentElement('afterend', reactRoot)
	ReactDOM.render(<FuzzyToken store={ store }/>, reactRoot);
}

class FuzzyTokenView extends TokenNavigationView {

	createdCallback() {
		this.classList.add('token-navigation-fuzzy-token-view');

		const container = document.createElement('div');
		container.style.cssText = `
			padding: 10px;
		`;
		const wrapper = document.createElement('div');

		const header = document.createElement('header');
		header.style.cssText = `
			padding-bottom: 10px;
		`;

		this.headerTitle = document.createElement('span');

		this.nameEditor = document.createElement('atom-text-editor');
		this.nameEditor.setAttribute('mini', true);
		this.nameEditor.classList.add('fuzzy-view');

		this.nameEditor.addEventListener('core:cancel', () => this.hide());
		this.nameEditor.addEventListener('token-navigation:nextFuzzyToken', this.next.bind(this));
		this.nameEditor.addEventListener('token-navigation:previousFuzzyToken', this.previous.bind(this));
		this.nameEditor.addEventListener('token-navigation:allFuzzyToken', this.selectAll.bind(this))
		this.nameEditor.addEventListener('blur', this.updateUI.bind(this));
		this.nameEditor.getModel().getBuffer().onDidChange(this.fuzzySearch.bind(this))

		this.resultContainer = document.createElement('div');
		this.resultContainer.style.cssText = `
			min-width: 100px;
			text-align: right;
			padding-right: 5px;
			color: while;
		`;

		this.nameEditor.appendChild(this.resultContainer);
		header.appendChild(this.headerTitle);
		container.appendChild(header);
		wrapper.appendChild(this.nameEditor);
		container.appendChild(wrapper);
		this.appendChild(container);

		this.selectedToken = 0;
		this.ranges = [];

		this.updateUI();
	}

	fuzzySearch() {
		const fuzzyPattern = this.nameEditor.getModel().getBuffer().getText();
		const text = this.editor.getBuffer().getText();
		const tokens = parse(text);
		const tokenValues = tokens.map(t => t.value || t.type.label).map(String);
		if (fuzzyPattern.length < 3) {
			this.updateUI();
			return;
		}

		try {
			const results = fuzzy.filter(fuzzyPattern, tokenValues, {
				pre: '<',
				post: '>'
			});
			const ranges = results.map(t => tokens[t.index].loc).map(toAtomRange);
			this.selectedToken = 0;
			this.ranges = ranges;
			this.selectCurrent();
			this.updateUI();
		} catch (e) {
			console.log(e);
		}
	}

	updateUI() {
		const fuzzyPattern = this.nameEditor.getModel().getBuffer().getText();

		if (this.ranges.length) {
			this.resultContainer.innerText = `${this.selectedToken + 1} of ${this.ranges.length}`;
			this.resultContainer.style.color = '#73c990';
		} else {
			this.resultContainer.style.color = fuzzyPattern >= 3 ? '#ff6347' : 'white';
			this.resultContainer.innerText = fuzzyPattern >= 3 ? 'No results'  : '';
		}

		if (fuzzyPattern.length < 3) {
			this.headerTitle.innerText = 'Fuzzy search tokens';
		} else {
			this.headerTitle.innerText = `${this.ranges.length} results for '${fuzzyPattern}'`;
		}

		if (this.nameEditor.classList.contains('is-focused')) {
			if (fuzzyPattern.length < 3) {
				this.nameEditor.style['border-color'] = '#568af2';
				this.nameEditor.style['box-shadow'] = '0 0 0 1px #568af2';
			} else {
				const finalColor = this.ranges.length ? '#73c990' : '#ff6347';
				this.nameEditor.style['border-color'] = finalColor;
				this.nameEditor.style['box-shadow'] = `0 0 0 1px ${finalColor}`;
			}
		} else {
			this.nameEditor.style['border-color'] = '';
			this.nameEditor.style['box-shadow'] = '';
		}

	}

	selectCurrent() {
			this.updateUI();
			if (!this.ranges.length) {
				return;
			}
			this.editor.setSelectedBufferRange(this.ranges[this.selectedToken]);
	}

	next() {
		this.selectedToken += 1;
		if (this.selectedToken >= this.ranges.length) {
			this.selectedToken = 0;
		}

		this.selectCurrent();
	}

	previous() {
		this.selectedToken -= 1;
		if (this.selectedToken < 0) {
			this.selectedToken = this.ranges.length - 1;
		}

		this.selectCurrent();
	}

	show() {
		this.updateUI();
	}

	selectAll() {
		if (!this.ranges.length) {
			this.updateUI();
			return;
		}
		this.editor.setSelectedBufferRanges(this.ranges);
		const view = atom.views.getView(this.editor);
		view.focus();
		this.updateUI();
	}
}

export default document.registerElement('token-navigation-fuzzy-token-view', {
	prototype: FuzzyTokenView.prototype
});
