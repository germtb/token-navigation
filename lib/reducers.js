import { combineReducers } from 'redux'

const reducerCreator = actions => initialState => (
	state = initialState,
	{ type, payload }
) => {
	const action = actions[type]
	if (action !== null && action !== undefined) {
		return typeof action === 'function' ? action(state, payload) : action
	}
	return state
}

const returnPayload = field => (state, payload) =>
	field ? payload[field] : payload

const visible = reducerCreator({
	SHOW: true,
	HIDE: false
})(false)

const editor = reducerCreator({
	SHOW: returnPayload(),
	FOCUS: returnPayload(),
	SET_EDITOR: returnPayload()
})(null)

const searchEditor = reducerCreator({
	SET_SEARCH_EDITOR: returnPayload()
})(null)

const results = reducerCreator({
	HIDE: [],
	SET_SEARCH_RESULTS: returnPayload('results')
})([])

const tokenIndex = reducerCreator({
	HIDE: 0,
	NEXT: (state, { resultsCount }) => {
		let next = state + 1
		if (next >= resultsCount) {
			next = 0
		}
		return next
	},
	PREVIOUS: (state, { resultsCount }) => {
		let previous = state - 1
		if (previous < 0) {
			previous = resultsCount - 1
		}
		return previous
	},
	SET_SEARCH_RESULTS: (state, payload) =>
		state >= payload.results.length ? 0 : state
})(0)

const pattern = reducerCreator({
	HIDE: '',
	SET_SEARCH_RESULTS: returnPayload('pattern')
})('')

export default combineReducers({
	visible,
	editor,
	searchEditor,
	pattern,
	tokenIndex,
	results
})
