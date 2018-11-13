let args = [].reduce.call(process.argv.slice(2).filter(argument => argument.startsWith('-')).join(''), (args, argument) => {
	args[argument] = args[argument] ? args[argument] + 1 : true
	return args
}, {})

delete args['-']

export default args
