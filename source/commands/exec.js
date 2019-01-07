// @flow
import * as components from '../library/components.js'
import type {
	Argv
} from 'yargs'

export let command = 'exec <command>'
export let describe = 'print the names of the components and exit'
export let handler = (argv: Argv) =>
	components.batch(String(argv.command))
