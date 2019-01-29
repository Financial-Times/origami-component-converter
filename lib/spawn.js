import {spawn} from "child_process"
import getStream from "get-stream"
import log from "./log.js"
import compose from "./compose.js"
import chalk from "chalk"
import * as workingDirectory from "./working-directory.js"

let getStateColor = state => {
	switch (state) {
		case "go":
			return chalk.magenta
		case "yay":
			return chalk.green
		case "oh no":
			return chalk.red
		default:
			return chalk.cyan
	}
}

export let createPrinter = (command, cwd) => state =>
	log(getStateColor(state)(`${state}: ${command} in ${cwd}`))

export default (command, options = {cwd: workingDirectory.resolve()}) => {
	let print = createPrinter(command, options.cwd || ".")

	print("go")

	let [commandName, ...args] = command.split(/\s+/)

	let child = spawn(commandName, args, options)

	child.stdout.pipe(process.stdout)
	child.stderr.pipe(process.stderr)

	return new Promise((resolve, reject) => {
		let yay = compose(
			resolve,
			getStream,
			child => child.stdout
		)

		let nay = compose(
			reject,
			getStream,
			child => child.stderr
		)

		child.on("exit", code => {
			if (code === 0) {
				print("yay")
				return yay(child)
			} else {
				print("oh no")
				return nay(child)
			}
		})
	})
}
