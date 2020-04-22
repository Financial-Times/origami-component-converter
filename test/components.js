import {dss as serializeDirectory} from "directory-snapshot"
import snap from "snap-shot-it"
import {handler as convertComponent} from "../commands/build"
import {resolve as resolvePath} from "path"
import fs from "fs"

let components = fs.readdirSync(resolvePath(__dirname, "components"))

components.forEach(item => {
	describe(`occ ${item}`, () => {
		context(`${item} without CIRCLE_REPOSITORY_URL set`, function() {
			it("matches snapshot", async () => {
				delete process.env.CIRCLE_REPOSITORY_URL
				let directory = resolvePath(__dirname, "components", item)
				await convertComponent({
					directory,
					semver: "0.0.0",
				})
				snap(serializeDirectory(directory))
			})
		})

		context(`${item} with CIRCLE_REPOSITORY_URL set`, function() {
			it("matches snapshot", async () => {
				process.env.CIRCLE_REPOSITORY_URL = "https://origami.ft.com"
				let directory = resolvePath(__dirname, "components", item)
				await convertComponent({
					directory,
					semver: "0.0.0",
				})
				snap(serializeDirectory(directory))
			})
		})
	})
})
