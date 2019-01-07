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
import settings from '../library/settings.js'

export let command = 'convert <component> <branch> <at>'
export let desc = 'fetch an origami component at branch and create an npm version'

export let builder = (yargs: Argv) =>
	yargs
		.positional('component', {
			describe: 'the component to operate on',
			type: 'string'
		})
		.positional('branch', {
			alias: 'brank',
			describe: 'the branch to fetch',
			type: 'string'
		})
		.positional('at', {
			describe: 'the version (or semver increment) to release',
			type: 'string'
		})
		.option('npm-registry', {
			default: 'http://localhost:4873',
			type: 'string',
			describe: 'the npm registry to use'
		})
		.option('npm-organisation', {
			describe: 'npm organisation to use',
			default: settings.npmOrganisation
		})
		.option('github-organisation', {
			describe: 'github organisation to use',
			default: settings.githubOrganisation
		})
		.argv

export let handler = async function ဪ (args: Argv) {
	args.components && components.setTargets(args.components)
	await workingDirectory.copyPackageJson()

	let registryArgument = npm.createRegistryArgument(args.npmRegistry)

	await spawn(`npm install ${registryArgument}`)
	// await fs.remove(components.resolve())

	await github.extractTarballFromUri(await github.getBranchTarballUri(
		args.component,
		args.brank,
		args.githubOrganisation
	))

	await npm.createAndWriteManifest(args.component)
	await babel.compile(args.component)

	let hooray = chalk.rainbow('oh good')
	hooray.start()
	setImmediate(hooray.stop.bind(hooray))
}
