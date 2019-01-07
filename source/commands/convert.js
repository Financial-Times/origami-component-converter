#!/usr/bin/env node
// @flow
import spawn from '../library/spawn.js'
import * as components from '../library/components.js'
import * as npm from '../library/npm.js'
import * as babel from '../library/babel.js'
import * as fs from 'fs-extra'
import * as github from '../library/github.js'
import * as workingDirectory from '../library/working-directory.js'
import type {
	Argv
} from 'yargs'
import chalk from 'chalk-animation'

export let command = 'convert <component> <branch> <semver>'
export let desc = 'fetch an origami component at branch and create an npm version'

export let builder = (yargs: Argv) =>
	yargs
		.positional('component', {
			default: true,
			describe: 'the component to operate on',
			type: 'string'
		})
		.positional('branch', {
			default: true,
			alias: 'brank',
			describe: 'the branch to fetch',
			type: 'string'
		})
		.positional('semver', {
			default: true,
			describe: 'the version to create',
			type: 'string'
		})

export let handler = async function ဪ (argv: Argv) {
	let {
		component,
		brank,
		githubOrganisation,
		semver: version
	} = argv

	components.setTargets([component])
	await workingDirectory.copyPackageJson()

	await spawn('npm install')
	await fs.remove(components.resolve())

	await github.extractTarballFromUri(await github.getBranchTarballUri(
		component,
		brank,
		githubOrganisation
	), components.resolve(component))

	await fs.outputFile(components.getVersionFilePath(component), version)

	await npm.createAndWriteManifest(component)
	await babel.compile(component)
	await npm.cleanAndWriteManifest(component)

	let hooray = chalk.rainbow('oh good')
	hooray.start()
	setImmediate(hooray.stop.bind(hooray))
}
