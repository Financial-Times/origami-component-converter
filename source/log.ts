let vees = process.argv.filter(arg => arg.startsWith('-v')).join('').match(/v/g)

let userLogLevel = vees
	? vees.length
	: 0

enum LogLevel {
	None,
	Verbose,
	Untamed,
	Wild
}

export default (message: any, level = LogLevel.Verbose) => {
	if (userLogLevel >= level) {
		console.info(message)
	}

	return message
}
