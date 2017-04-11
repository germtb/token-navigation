'use babel';

import { combineReducers } from 'redux'

const visible = (state = false, { type }) => {
	if (type === 'SHOW') {
		return true;
	} else if (type === 'HIDE') {
		return false;
	}

	return state;
};

const editor = (state = null, { type, payload }) => {
	if (type === 'SHOW') {
		return payload;
	} else if (type === 'FOCUS'){
		return payload;
	} else if (type === 'SET_EDITOR'){
		return payload;
	}

	return state;
};

const searchEditor = (state = null, { type, payload }) => {
	if (type === 'SET_SEARCH_EDITOR') {
		return payload;
	}

	return state;
};

const results = (state = [], { type, payload }) => {
	if (type === 'HIDE') {
		return [];
	} else if (type === 'SET_SEARCH_RESULTS') {
		return payload.results;
	}

	return state;
};

const selectedToken = (state = 0, { type, payload }) => {
	if (type === 'HIDE') {
		return 0;
	} else if (type === 'NEXT') {
		const { resultsCount } = payload;
		let selectedToken = state + 1;
		if (selectedToken >= resultsCount) {
			selectedToken = 0;
		}

		return selectedToken;
	} else if (type === 'PREVIOUS') {
		const { resultsCount } = payload;
		let selectedToken = state - 1;
		if (selectedToken < 0) {
			selectedToken = resultsCount - 1;
		}

		return selectedToken;
	}

	return state;
};

const pattern = (state = '', { type, payload }) => {
	if (type === 'HIDE') {
		return '';
	} else if (type === 'SET_SEARCH_RESULTS') {
		return payload.pattern;
	}

	return state;
};

export default combineReducers({
	visible,
	editor,
	searchEditor,
	pattern,
	selectedToken,
	results
});
