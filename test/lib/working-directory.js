import expect from "expect"
import path from "path"
import mock from "mock-require"

describe('working-directory', () => {
	let getResolve = () => {
		mock("yargs", {
			argv: {
				workingDirectory
			}
		})
		return mock.reRequire("../../lib/working-directory").resolve
	}

	let unmock = () => mock.stop("yargs")

	let workingDirectory =	"directory@chee.rabbits"

	describe('resolve', () => {
		it('should return root path when called with no args', () => {
			let resolve = getResolve()
			expect(resolve()).toBe(path.resolve(workingDirectory))
			unmock()
		})

		it('should resolve further paths', () => {
			let resolve = getResolve()
			expect(resolve("bunny"))
				.toBe(path.resolve(workingDirectory, "bunny"))

			expect(resolve("monkey"))
				.toBe(path.resolve(workingDirectory, "monkey"))
			unmock()
		})
	})

	mock.stop("yargs")
})
