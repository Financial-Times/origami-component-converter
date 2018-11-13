// @flow
import {
	spawn
} from 'child_process'
import getStream from 'get-stream'
import log from './log.js'
import compose from './compose.js'

export default (
	command: string,
	options: child_process$spawnOpts = {cwd: '.'}
): Promise<void | string> => {
	log(`begin: ${command}`)

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

		child.on('exit', code =>
			code === 0
				? yay(child)
				: nay(child)
		)
	})
}
