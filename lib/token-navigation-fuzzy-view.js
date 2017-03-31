'use babel';

import TokenNavigationView from './token-navigation-view';
import fuzzy from 'fuzzy';

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
		this.nameEditor.addEventListener('core:confirm', () => this.hide());
		this.nameEditor.getModel().getBuffer().onDidChange(this.fuzzySearch)
		window.nameEditor = this.nameEditor;
		wrapper.appendChild(this.nameEditor);
		container.appendChild(wrapper);

		this.appendChild(container);
	}

	fuzzySearch() {
		const text = this.nameEditor.getModel().getBuffer().getText();
		console.log(text);
		console.log(this.editor);
	}
}

export default document.registerElement('token-navigation-fuzzy-token-view', {
	prototype: FuzzyTokenView.prototype
});
