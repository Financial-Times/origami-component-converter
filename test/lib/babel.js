import snap from "snap-shot-it"
import mock from "mock-require"

describe("babel suite", () => {
	it("returns the same babel config", () => {
		mock("path", {
			...require("path"),
			resolve: (...paths) =>
				// .slice(2) because the first two args are getting to root
				"~root~/" + paths.slice(2).join("/")
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
