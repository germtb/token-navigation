'use babel';

export default class TokenNavigationView extends HTMLElement {

	initialize(model) {
		this.setModel(model);
		return this;
	}

	getModel() {
		return this.model;
	}

	setModel(model) {
		this.model = model;
	}

	destroy() {
		this.remove();
	}
}
