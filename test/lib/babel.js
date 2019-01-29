import snap from "snap-shot-it"
import * as babel from "../../lib/babel"

describe("babel suite", () => {
	it("returns the same babel config", () => {
		snap("babel config", babel.createConfiguration({
			aliases: {
				"alice": "banana",
				"charlie": "delta"
			}
		}))
	})
})
