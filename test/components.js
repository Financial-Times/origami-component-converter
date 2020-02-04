import {dss as serializeDirectory} from "directory-snapshot"
import snap from "snap-shot-it"
import {handler as convertComponent} from "../commands/build"
import {resolve as resolvePath} from "path"

let components = [
	["o-colors", "4.0.0"],
	["o-forms", "7.0.0"],
	["o-table", "7.0.0"],
]

components.forEach(([name, semver]) => {
	describe(`occ ${name}@${semver}`, () => {
		it("matches snapshot", async () => {
			let directory = resolvePath(__dirname, "components", `${name}-${semver}`)
			delete process.env.CIRCLE_REPOSITORY_URL
			await convertComponent({
				directory,
				semver,
			})
			snap(serializeDirectory(directory))
		})
	})
})
