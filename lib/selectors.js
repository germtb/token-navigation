'use babel';

export const searchStatus = (state) => {
	if (!state.pattern || state.pattern.length < 3) {
		return 'NO_SEARCH';
	} else if (state.results && state.results.length > 0) {
		return 'SEARCH_SUCCESS';
	} else {
		return 'SEARCH_FAILED';
	}
}

export const header = (state) => {
	if (searchStatus(state) === 'NO_SEARCH') {
		return 'Fuzzy token search';
	}

	return `${state.results.length} results for '${state.pattern}'`;
};

export const searchLabel = (state) => {
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
	return state.searchEditor && state.searchEditor.classList.contains('is-focused');
};
