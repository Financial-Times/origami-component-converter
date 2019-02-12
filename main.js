import yargs from "yargs"

let {argv} = yargs
	.wrap(yargs.terminalWidth())
	.commandDir("./commands")
	.epilog("🐕")
	.demandCommand()
	.showHelpOnFail(false)
	.help("h")
	.alias("h", "help")

export default argv
