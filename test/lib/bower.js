let assert = require("assert")
let mock = require("mock-require")
let bower = require("../../lib/bower.js")

describe("bower.js", () => {
	describe("getAllDependencyNames", () => {
		it("returns all dependency names", () => {
			let dependencyNames = bower.getAllDependencyNames({
				devDependencies: {
					a: 1,
					b: 2
				},
				dependencies: {
					c: 3,
					d: 4
				}
			})
			assert.deepStrictEqual(dependencyNames, ["a", "b", "c", "d"])
		})
	})

	describe("getManifestPath", () => {
		it("uses components.resolve for its work", () => {
			let componentName = "component"
			mock("../../lib/components.js", {
				resolve: (name, filename) => {
					assert.equal(name, componentName)
					assert.equal(filename, "bower.json")
				}
			})
			bower = mock.reRequire("../../lib/bower.js")
			bower.getManifestPath(componentName)
			mock.stop("../../lib/components.js")
		})
	})
})