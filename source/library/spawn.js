// @flow
import execa from 'execa'
import getStream from 'get-stream'
import log from './log.js'
import compose from './compose.js'

type SpawnOptions = {cwd: string}

export default (
	command: string,
	options: SpawnOptions = {cwd: '.'}
): Promise<void | string> => {
	log(`begin: ${command}`)

	let [
		commandName,
		...args
	] = command.split(/\s+/)

	let child = execa(commandName, args, options)

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
