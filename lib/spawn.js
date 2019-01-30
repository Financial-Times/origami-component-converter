import {spawn} from "child_process"
import log, {quietModeEnabled} from "./log.js"
import chalk from "chalk"
import * as workingDirectory from "./working-directory.js"

let printer = {
	log (color, stage, command, cwd) {
		log(chalk[color](`${stage} "${command}" in "${cwd}"`))
	},
	start (command, cwd) {
		this.log("white", "starting", command, cwd)
	},
	good (command, cwd) {
		this.log("cyan", "complete", command, cwd)
	},
	bad (command, cwd) {
		this.log("red", "couldn't", command, cwd)
	}
}

export default (command, options = {
	cwd: workingDirectory.resolve(),
	stdio: quietModeEnabled
		? "pipe"
		: [0, 1, 2]
}) => {
	let {cwd} = options

	printer.start(command, cwd)

	let [
		commandName,
		...args
	] = command.split(/\s+/)

	let child = spawn(commandName, args, options)

	return new Promise((yay, nay) => {
		child.on("exit", code => {
			if (code === 0) {
				printer.good(command, cwd)
				return yay()
			} else {
				printer.bad(command, cwd)
				return nay()
			}
		})
	})
}
