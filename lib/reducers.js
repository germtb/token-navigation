'use babel';

import { combineReducers } from 'redux'

const reducerCreator = actions => initialState => {
	return (state = initialState, { type, payload }) => {
		if (actions[type] !== null && actions[type] !== undefined) {
			if (typeof actions[type] === 'function') {
				return actions[type](state, payload);
			} else {
				return actions[type];
			}
		} else {
			return state;
		}
	}
};

const returnPayload = (field) => (state, payload) => field ? payload[field] : payload;

const visible = reducerCreator({
	SHOW: true,
	HIDE: false
})(false);

const editor = reducerCreator({
	SHOW: returnPayload(),
	FOCUS: returnPayload(),
	['SET_EDITOR']: returnPayload()
})(null);

const searchEditor = reducerCreator({
	['SET_SEARCH_EDITOR']: returnPayload()
})(null);

const results = reducerCreator({
	HIDE: _ => [],
	['SET_SEARCH_RESULTS']: returnPayload('results')
})([]);

const selectedToken = reducerCreator({
	HIDE: 0,
	NEXT: (state, { resultsCount }) => {
		let next = state + 1;
		if (next >= resultsCount) {
			next = 0;
		}
		return next;
	},
	PREVIOUS: (state, { resultsCount }) => {
		let previous = state - 1;
		if (previous < 0) {
			previous = resultsCount - 1;
		}
		return previous;
	}
})(0);

const pattern = reducerCreator({
	HIDE: '',
	['SET_SEARCH_RESULTS']: returnPayload('pattern')
})('');

export default combineReducers({
	visible,
	editor,
	searchEditor,
	pattern,
	selectedToken,
	results
});
