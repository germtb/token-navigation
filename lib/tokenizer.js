const simpleTokens = [
	'**',
	'&&',
	'||',
	'==',
	'!=',
	'<=',
	'>=',
	'=>',
	'->',
	'|>',
	'[',
	']',
	'{',
	'}',
	')',
	'(',
	'=',
	'+',
	'-',
	'_',
	'*',
	'/',
	'%',
	',',
	':',
	'&',
	'|',
	'!',
	'.',
	'>',
	'<'
]

const keywords = {
	let: {
		type: 'let'
	},
	in: {
		type: 'in'
	},
	true: {
		type: 'Boolean',
		value: true
	},
	false: {
		type: 'Boolean',
		value: false
	},
	type: {
		type: 'TypeOperator'
	}
}

export default code => {
	let inString = false
	let inIdentifier = false
	let currentToken = ''
	const tokens = []

	for (let i = 0; i < code.length; i++) {
		const character = code[i]
		const peek = i < code.length - 1 ? code[i + 1] : null

		if (inString) {
			if (character === "'") {
				tokens.push({ type: 'String', value: currentToken })
				inString = false
				currentToken = ''
			} else {
				currentToken += character
			}
		} else if (/\s/.test(character)) {
			continue
		} else if (character === '.' && peek === '.') {
			tokens.push({ type: '...' })
			i += 2
		} else if (character === "'") {
			currentToken = ''
			inString = true
		} else if (peek && simpleTokens.includes(character + peek)) {
			tokens.push({ type: character + peek })
			i += 1
		} else if (simpleTokens.includes(character)) {
			tokens.push({ type: character })
		} else if (!inIdentifier && /[0-9]/.test(character)) {
			currentToken += character
			if (peek && /[0-9]/.test(peek) && i !== code.length - 1) {
				continue
			} else {
				tokens.push({ type: 'Number', value: parseInt(currentToken) })
				currentToken = ''
			}
		} else if (!inIdentifier && /[a-zA-Z]/.test(character)) {
			currentToken += character
			inIdentifier = true

			if (i === code.length - 1 || !/[a-zA-Z0-9]/.test(peek)) {
				tokens.push(
					keywords[currentToken]
						? keywords[currentToken]
						: { type: 'Identifier', value: currentToken }
				)

				inIdentifier = false
				currentToken = ''
			}
		} else if (inIdentifier && /[a-zA-Z0-9]/.test(character)) {
			currentToken += character
			if (i === code.length - 1 || !/[a-zA-Z0-9]/.test(peek)) {
				tokens.push(
					keywords[currentToken]
						? keywords[currentToken]
						: { type: 'Identifier', value: currentToken }
				)

				inIdentifier = false
				currentToken = ''
			}
		}
	}

	return tokens
}
