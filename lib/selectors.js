import { createSelector } from 'reselect'

const pattern = state => state.pattern
export const results = state => state.results
export const editor = state => state.editor
export const visible = state => state.visible
const tokenIndex = state => state.tokenIndex
const searchEditor = state => state.searchEditor

export const searchStatus = createSelector(
	pattern,
	results,
	(pattern, results) => {
		if (!pattern || pattern.length < 3) {
			return 'NO_SEARCH'
		} else if (results && results.length > 0) {
			return 'SEARCH_SUCCESS'
		}
		return 'SEARCH_FAILED'
	}
)

export const header = createSelector(
	searchStatus,
	results,
	pattern,
	(status, results, pattern) => {
		if (status === 'NO_SEARCH') {
			return 'Fuzzy token search'
		}

		return `${results.length} results for '${pattern}'`
	}
)

export const searchLabel = createSelector(
	searchStatus,
	tokenIndex,
	results,
	(status, index, results) => {
		if (status === 'NO_SEARCH') {
			return ''
		} else if (status === 'SEARCH_SUCCESS') {
			return `${index + 1} of ${results.length}`
		}
		return 'No results'
	}
)

export const isFocused = state =>
	searchEditor(state) && searchEditor(state).classList.contains('is-focused')

export const selectedToken = createSelector(
	results,
	tokenIndex,
	(results, index) => results[index]
)
