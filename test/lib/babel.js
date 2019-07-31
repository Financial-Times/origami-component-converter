import * as babel from "../../lib/babel"
import snap from "snap-shot-it"
export default {}

describe("createConfiguration", () => {
	it("creates the correct configuration", () => {
		snap(babel.createConfiguration())
		snap(babel.createConfiguration({}))
		snap(babel.createConfiguration({modules: "auto"}))
		snap(babel.createConfiguration({aliases: {a: "b"}}))
		snap(babel.createConfiguration({filename: "lol"}))
		snap(
			babel.createConfiguration({
				aliases: {something: "./something-else"},
				modules: "auto",
				filename: "lol",
			})
		)
	})
})

/*
	TODO: test {transform, buildFile, buildDirectory, compile} snapshots with
	o-test-component
*/
