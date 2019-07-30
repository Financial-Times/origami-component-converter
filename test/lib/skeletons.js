import * as skeletons from "../../lib/skeletons"
import snap from "snap-shot-it"

describe("skeletons.js", () => {
	it("is the same as last time", () => {
		snap(skeletons.componentManifest)
	})
})
