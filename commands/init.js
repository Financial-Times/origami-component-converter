import * as fs from "fs-extra"
import {builderManifest} from "../lib/skeletons.js"
import write from "../lib/write-object.js"
import * as workingDirectory from "../lib/working-directory.js"
import * as components from "../lib/components.js"
import spawn from "../lib/spawn.js"

export let command = "init"
export let describe = "initialise the build directory"

export let handler = async () => {
	await write(workingDirectory.resolve("package.json"), builderManifest)
	await spawn("npm install")
}
