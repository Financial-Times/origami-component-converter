import expect from "expect"
import mock from "mock-require"

describe("bower.js", () => {
	describe("getAllDependencyNames", () => {
		it("returns all dependency names", () => {
			let bower = require("../../lib/bower.js")
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
			expect(dependencyNames).toEqual(["a", "b", "c", "d"])
		})
	})

	describe("getManifestPath", () => {
		it("uses components.resolve for its work", () => {
			let componentName = "component"
			mock("../../lib/components.js", {
				resolve: (name, filename) => {
					expect(name).toBe(componentName)
					expect(filename).toBe("bower.json")
				}
			})
			let bower = mock.reRequire("../../lib/bower.js")
			bower.getManifestPath(componentName)
			mock.stop("../../lib/components.js")
		})
	})
})
