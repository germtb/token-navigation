import { expect } from 'chai'
import * as tokenNavigation from './token-navigation'

describe('token-navigation', () => {
	const { isInToken, isAfterToken, isBeforeToken } = tokenNavigation.default
	const token = {
		loc: {
			start: {
				line: 10,
				column: 5
			},
			end: {
				line: 10,
				column: 10
			}
		}
	}

	const positionInside = {
		line: 10,
		column: 7
	}

	const positionSameLineBefore = {
		line: 10,
		column: 1
	}

	const positionBefore = {
		line: 9,
		column: 1
	}

	const positionSameLineAfter = {
		line: 10,
		column: 15
	}

	const positionAfter = {
		line: 12,
		column: 1
	}

	context('isInToken', () => {
		it('should return true when position is inside token', () => {
			expect(isInToken(positionInside)(token)).to.be.true
		})

		it('should return false when position is not inside token', () => {
			expect(isInToken(positionBefore)(token)).to.be.false
		})
	})

	context('isBeforeToken', () => {
		it('should return true when position is before token', () => {
			expect(isBeforeToken(positionBefore)(token)).to.be.true
		})

		it('should return true when position is before token and in same line', () => {
			expect(isBeforeToken(positionSameLineBefore)(token)).to.be.true
		})

		it('should be false when token is inside', () => {
			expect(isBeforeToken(positionInside)(token)).to.be.false
		})

		it('should be false when token is after', () => {
			expect(isBeforeToken(positionAfter)(token)).to.be.false
		})
	})

	context('isAfterToken', () => {
		it('should return true when position is after token', () => {
			expect(isAfterToken(positionAfter)(token)).to.be.true
		})

		it('should return true when position is after token and in the same line', () => {
			expect(isAfterToken(positionSameLineAfter)(token)).to.be.true
		})

		it('should return false when position is inside', () => {
			expect(isAfterToken(positionInside)(token)).to.be.false
		})

		it('should return false when position is before', () => {
			expect(isAfterToken(positionBefore)(token)).to.be.false
		})
	})
})
