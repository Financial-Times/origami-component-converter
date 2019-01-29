import expect from "expect"
import path from "path"
import root, {resolve} from "../../lib/root.js"

describe('root', () => {
	describe('default', () => {
		it('should be the root path', () => {
			expect(root).toBe(path.resolve(__dirname, "..", ".."))
		})
	})

	describe('resolve', () => {
		it('should return root path when called with no args', () => {
			expect(root).toBe(resolve())
		})

		it('should resolve further paths', () => {
			expect(path.resolve(root, "lol")).toBe(resolve("lol"))
			expect(path.resolve(root, "lol/hey")).toBe(resolve("lol", "hey"))
		})
	})
})
