import { h } from 'preact'
import { connect } from 'preact-redux'
import fuzzy from 'fuzzy'
import classNames from 'classnames'

import { parse, toAtomRange } from './tokens-utils'
import {
	header,
	searchLabel,
	searchStatus,
	editor,
	visible as isVisible,
	results
} from './selectors'

const FuzzyTokenWrapper = ({ visible }) =>
	visible ? <EnhancedFuzzyToken /> : null

export default connect(state => ({
	visible: isVisible(state)
}))(FuzzyTokenWrapper)

class FuzzyToken extends React.PureComponent {
	constructor(props) {
		super(props)
		this.search = this.search.bind(this)
		this.hide = this.hide.bind(this)
		this.next = this.next.bind(this)
		this.previous = this.previous.bind(this)
		this.selectAll = this.selectAll.bind(this)
		this.focus = this.focus.bind(this)
		this.bufferDisposable = null
		this.workspaceDisposable = null
	}

	componentDidMount() {
		this.props.setSearchEditor(this.searchEditor)
		this.searchEditor.addEventListener('core:cancel', this.hide)
		this.searchEditor.addEventListener('token-navigation:next', this.next)
		this.searchEditor.addEventListener(
			'token-navigation:previous',
			this.previous
		)
		this.searchEditor.addEventListener('token-navigation:all', this.selectAll)

		const model = this.searchEditor.getModel()
		model.setPlaceholderText('Fuzzy search in this buffer')

		const buffer = this.searchEditor.getModel().getBuffer()
		this.bufferDisposable = buffer.onDidChange(() => {
			this.search()
		})
		this.workspaceDisposable = atom.workspace.onDidStopChangingActivePaneItem(
			editor => {
				if (editor.getBuffer) {
					this.props.setEditor(editor)
					this.search()
				} else {
					this.hide()
				}
			}
		)
	}

	componentWillUnmount() {
		this.bufferDisposable.dispose()
		this.workspaceDisposable.dispose()
	}

	search() {
		const buffer = this.searchEditor.getModel().getBuffer()
		const pattern = buffer.getText()
		const text = this.props.editor.getBuffer().getText()

		if (text.length < 3) {
			return
		}

		const tokens = parse(text)
		const tokenValues = tokens.map(t => t.value || t.type.label).map(String)
		const results = fuzzy
			.filter(pattern, tokenValues, {
				pre: '<',
				post: '>'
			})
			.map(t => tokens[t.index].loc)
			.map(toAtomRange)

		this.props.setSearchResults({
			pattern,
			results
		})
	}

	hide() {
		this.props.hide()
		const view = atom.views.getView(this.props.editor)
		view.focus()
	}

	next() {
		if (this.props.status !== 'SEARCH_SUCCESS') {
			return
		}
		this.props.next({ resultsCount: this.props.results.length })
		this.focus()
	}

	previous() {
		if (this.props.status !== 'SEARCH_SUCCESS') {
			return
		}
		this.props.previous({ resultsCount: this.props.results.length })
		this.focus()
	}

	focus() {
		this.searchEditor.focus()
	}

	selectAll() {
		if (!this.props.results.length) {
			return
		}
		this.props.editor.setSelectedBufferRanges(this.props.results)
		const view = atom.views.getView(this.props.editor)
		view.focus()
	}

	render() {
		const { header, searchLabel, status } = this.props

		const findAndReplaceClassNames = classNames('find-and-replace', {
			'has-no-results': status === 'SEARCH_FAILED',
			'has-results': status === 'SEARCH_SUCCESS'
		})

		return (
			<div className="bottom">
				<atom-panel
					ref={e => {
						if (!e) {
							return
						}
						e.className = 'tool-panel panel-bottom bottom'
					}}
				>
					<div className={findAndReplaceClassNames}>
						<header className="header">
							<span className="header-item description">{header}</span>
						</header>
						<section
							style={{ justifyContent: 'center' }}
							className="input-block find-container"
						>
							<div className="input-block-item input-block-item--flex editor-container">
								<atom-text-editor
									style={{
										transition: 'ease-in-out .2s'
									}}
									mini
									ref={element => {
										if (!element) {
											return
										}
										element.className = classNames('editor mini fuzzy-view', {
											'is-focused': element.classList.contains('is-focused')
										})
										this.searchEditor = element
										this.focus()
									}}
									placeholder="SOMETHING"
								/>
							</div>
							<div
								style={{
									position: 'absolute',
									zIndex: 5,
									right: 18,
									top: 4,
									textAlign: 'right',
									width: 100,
									margin: 0
								}}
								className="find-meta-container"
							>
								<span
									style={{
										transition: 'ease-in-out .2s'
									}}
									className="text-subtle result-counter"
								>
									{searchLabel}
								</span>
							</div>
						</section>
					</div>
				</atom-panel>
			</div>
		)
	}
}

const EnhancedFuzzyToken = connect(
	state => ({
		header: header(state),
		searchLabel: searchLabel(state),
		editor: editor(state),
		status: searchStatus(state),
		results: results(state)
	}),
	dispatch => ({
		next: payload => dispatch({ type: 'NEXT', payload }),
		previous: payload => dispatch({ type: 'PREVIOUS', payload }),
		hide: () => dispatch({ type: 'HIDE' }),
		setSearchResults: payload =>
			dispatch({ type: 'SET_SEARCH_RESULTS', payload }),
		setSearchEditor: payload =>
			dispatch({ type: 'SET_SEARCH_EDITOR', payload }),
		setEditor: payload => dispatch({ type: 'SET_EDITOR', payload })
	})
)(FuzzyToken)
