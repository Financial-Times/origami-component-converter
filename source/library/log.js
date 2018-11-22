// @flow
import args from './args.js'
import 'colors'

let userLogLevel = args.v

export default (message: any, level: number = 1) => {
	if (userLogLevel >= level) {
		// eslint-disable-next-line no-console
		console.log(message)
	}

	return message
}
