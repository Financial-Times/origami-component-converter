// @flow
import {
	spawn
} from 'child_process'
import getStream from 'get-stream'
import log from './log.js'
import compose from './compose.js'

let createPrinter = (command: string, cwd: string) => (state: string) =>
	log(`${state}: ${command} in ${cwd}`)

export default (
	command: string,
	options: child_process$spawnOpts = {cwd: '.'}
): Promise<void | string> => {
	let print = createPrinter(command, options.cwd || '.')

	print('gogo')

	let [
		commandName,
		...args
	] = command.split(/\s+/)

	let child = spawn(commandName, args, options)

	child.stdout.pipe(process.stdout)
	child.stderr.pipe(process.stderr)

	return new Promise((resolve, reject) => {
		let yay = compose(resolve, getStream, child => child.stdout)
		let nay = compose(reject, getStream, child => child.stderr)

		child.on('exit', code => {
			if (code === 0) {
				print('good')
				return yay(child)
			} else {
				print('ohno')
				return nay(child)
			}
		})
	})
}
