let assert = require("assert")
import path from "path"
import root, {resolve} from "../../lib/root.js"

describe('root', () => {
  describe('default', () => {
    it('should be the root path', () => {
			assert.equal(root, path.resolve(__dirname, "..", ".."))
    })
	})

	describe('resolve', () => {
		it('should return root path when called with no args', () => {
			assert.equal(root, resolve())
		})

		it('should resolve further paths', () => {
			assert.equal(path.resolve(root, "lol"), resolve("lol"))
			assert.equal(path.resolve(root, "lol/hey"), resolve("lol", "hey"))
		})
	})
})
