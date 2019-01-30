import yargs from "yargs"
import path from "path"
import os from "os"
import {mkdirp} from "fs-extra"
let origamiComponentNames = require("./config/components.json")

/**
 * coerce components argument into an array if it was comma separated
 *
 * @param {string | string[]} components components args
 * @returns {string[]} components
 */
let parseComponentsArgument = components =>
	Array.isArray(components) ? components : components.split(/,/)

let {argv} = yargs
	.wrap(yargs.terminalWidth())
	.option("components", {
		global: true,
		describe: "the components to use",
		default: origamiComponentNames,
		coerce: parseComponentsArgument,
		type: undefined
	})
	.commandDir("./commands")
	.options("working-directory", {
		global: true,
		default: path.resolve(os.homedir(), "tmp/origami"),
		coerce: directory => path.resolve(process.cwd(), directory)
	})
	.epilog("🐕")
	.demandCommand()
	.showHelpOnFail(false)
	.help("h")
	.alias("h", "help")

mkdirp(argv.workingDirectory)

export default argv
