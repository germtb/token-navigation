'use babel';

import TokenNavigationView from './token-navigation-view';
import fuzzy from 'fuzzy';
import { parse, toAtomRange } from './tokens-utils';

class FuzzyTokenView extends TokenNavigationView {

	createdCallback() {
		this.classList.add('token-navigation-fuzzy-token-view');

		const container = document.createElement('div');
		const wrapper = document.createElement('div');
		wrapper.style.cssText = `
			padding: 10px;
		`;

		this.nameEditor = document.createElement('atom-text-editor');
		this.nameEditor.setAttribute('mini', true);
		this.nameEditor.addEventListener('core:confirm', this.next.bind(this));
		this.nameEditor.addEventListener('core:cancel', () => this.hide());
		this.nameEditor.getModel().getBuffer().onDidChange(this.fuzzySearch.bind(this))
		wrapper.appendChild(this.nameEditor);
		container.appendChild(wrapper);

		this.appendChild(container);
		this.selectedToken = 0;
		this.ranges = [];
	}

	fuzzySearch() {
		const fuzzyPattern = this.nameEditor.getModel().getBuffer().getText();
		const text = this.editor.getBuffer().getText();
		const tokens = parse(text);
		const tokenValues = tokens.map(t => t.value || t.type.label).map(String);

		try {
			const results = fuzzy.filter(fuzzyPattern, tokenValues, {
				pre: '<',
				post: '>'
			});
			const ranges = results.map(t => tokens[t.index].loc).map(toAtomRange);
			this.selectedToken = 0;
			this.ranges = ranges;
			if (!ranges.length) {
				return;
			}
			this.editor.setSelectedBufferRange(this.ranges[this.selectedToken]);
		} catch (e) {
			console.log(e);
		}
	}

	next() {
		this.selectedToken += 1;
		if (this.selectedToken >= this.ranges.length) {
			this.selectedToken = 0;
		}

		if (!this.ranges.length) {
			return;
		}
		this.editor.setSelectedBufferRange(this.ranges[this.selectedToken]);
	}
}

export default document.registerElement('token-navigation-fuzzy-token-view', {
	prototype: FuzzyTokenView.prototype
});
