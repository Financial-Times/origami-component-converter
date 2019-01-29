import snap from "snap-shot-it"
import * as babel from "../../lib/babel"
import expect from "expect"

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
