// @flow
import yargs from 'yargs'

let userLogLevel = yargs
	.count('verbose')
	.alias('v', 'verbose')
	.argv
	.v

export default (message: any, level: number = 1) => {
	if (userLogLevel >= level) {
		// eslint-disable-next-line no-console
		console.log(message)
	}

	return message
}
