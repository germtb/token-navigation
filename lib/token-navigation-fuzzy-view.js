'use babel';

import TokenNavigationView from './token-navigation-view';
import fuzzy from 'fuzzy';
import { parse, toAtomRange } from './tokens-utils';

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
		this.nameEditor.addEventListener('core:confirm', this.next.bind(this));
		this.nameEditor.addEventListener('core:cancel', () => this.hide());
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

	show() {
		this.updateUI();
	}
}

export default document.registerElement('token-navigation-fuzzy-token-view', {
	prototype: FuzzyTokenView.prototype
});
