#!/usr/bin/env node
// @flow
require('dotenv').config()
import yargs from 'yargs'

export default yargs
	.commandDir('./commands')
	.demandCommand()
	.argv
