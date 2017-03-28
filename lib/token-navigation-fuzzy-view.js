'use babel';

export default class FuzzyView {

	constructor(serializedState) {
		// Create root element
		this.element = document.createElement('div');
		this.element.classList.add('fuzzy-view');

		// Create message element
		// const editor = atom.workspace.buildTextEditor();
		const editor = document.createElement('atom-text-editor');
		// const message = document.createElement('div');
		// message.textContent = 'The MyPackage package is Alive! It\'s ALIVE!';
		// message.classList.add('message');
		editor.classList.add('editor');
		editor.classList.add('mini');
		this.element.appendChild(editor);
	}

	// Returns an object that can be retrieved when package is activated
	serialize() {}

	// Tear down any state and detach
	destroy() {
		this.element.remove();
	}

	getElement() {
		return this.element;
	}

}
