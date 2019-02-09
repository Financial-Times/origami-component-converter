import snap from "snap-shot-it"
import mock from "mock-require"

describe("babel suite", () => {
	it("returns the same babel config", () => {
		mock("../../lib/root", {
			resolve: (...paths) =>
				"~root~/" + paths.join("/")
		})
		let babel = mock.reRequire("../../lib/babel")
		snap("babel config", babel.createConfiguration({
			aliases: {
				"alice": "banana",
				"charlie": "delta"
			}
		}))
		mock.stopAll()
	})
})
