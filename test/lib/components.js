import expect from "expect"
import mock from "mock-require"
describe("components", () => {
	let getModule = (...mocks) => {
		mocks.forEach(([mockPath, mockObject]) => {
			mock(mockPath, mockObject)
		})

		return mock.reRequire("../../lib/components.js")
	}

	let origamiComponentNames = require("../../config/components.json")

	it("uses the names from components.json as all `names` by default", () => {
		let components = getModule()
		let {
			targets,
			origami,
			all
		} = components.names

		expect(targets).toEqual(origamiComponentNames)
		expect(origami).toEqual(origamiComponentNames)
		expect(all).toEqual(origamiComponentNames)
	})

	describe("setTargets", () => {
		it("accepts targets", () => {
			let {setTargets, names} = getModule()
			let targets = ["lol", "hey"]

			setTargets(targets)

			expect(names.targets).toEqual(targets)
		})

		it("doesn't touch names.origami", () => {
			let {setTargets, names} = getModule()
			let targets = ["lol", "hey"]

			setTargets(targets)

			expect(names.origami).toEqual(origamiComponentNames)
		})

		it("uses targets + origami for names.all", () => {
			let {setTargets, names} = getModule()
			let targets = ["lol", "hey"]

			setTargets(targets)

			expect(names.all).toEqual([
				...targets,
				...origamiComponentNames
			])
		})

		it("completely replaces targets when called again", () => {
			let {setTargets, names} = getModule()
			let firstTargets = ["something special"]

			setTargets(firstTargets)

			expect(names.targets).toEqual(firstTargets)

			let secondTargets = ["star spangled banner"]
			setTargets(secondTargets)

			expect(names.targets).toEqual(secondTargets)
		})
	})
})
