// @flow
import type {Dictionary} from './dictionary.js'
import {builder} from './babel-builder.js'

type Item = string | [string, any]

export type Preset = Item
export type Plugin = Item

export type Configuration = {
	presets: Preset[],
	plugins: Plugin[],
	test?: string,
	overrides?: Configuration[]
}

type Options = {
	aliases: Dictionary
}

export function createConfiguration ({aliases}: Options): Configuration {
	return builder()
		.preset('@babel/preset-env', {useBuiltIns: false})
		.plugin('@babel/plugin-transform-modules-commonjs')
		.plugin('module:babel-plugin-module-resolve', {alias: aliases})
		.override(
			'./main.js',
			builder()
				.plugin('module:babel-plugin-import-redirect', {
					redirect: {
						'./src/(.*)': './dist/$1'
					}
				})
		).toJSON()
}
