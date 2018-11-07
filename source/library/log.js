// @flow
let vees = process.argv.filter(arg => arg.startsWith('-v')).join('').match(/v/g)

let userLogLevel: number = vees
	? vees.length
	: 0

export default (message: any, level: number = 1) => {
	if (userLogLevel >= level) {
		// eslint-disable-next-line no-console
		console.info(message)
	}

	return message
}
