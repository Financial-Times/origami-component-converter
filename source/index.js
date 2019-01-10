#!/usr/bin/env node
// @flow
import yargs from 'yargs'
import path from 'path'
import os from 'os'
import {mkdirp} from 'fs-extra'

let {argv} = yargs
	.showHelpOnFail(true, '🐕')
	.wrap(yargs.terminalWidth())
	.commandDir('./commands')
	.options('working-directory', {
		global: true,
		default: path.resolve(os.homedir(), 'tmp/origami'),
		coerce: (directory: string) => path.resolve(process.cwd(), directory)
	})
	.epilog('🐕')
	.demandCommand()
	.help('h')
	.alias('h', 'help')

mkdirp(argv.workingDirectory)

export default argv
