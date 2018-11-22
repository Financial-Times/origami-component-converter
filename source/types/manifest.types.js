// @flow

import type {Dictionary} from '../library/dictionary.js'
import type {Configuration as BabelConfiguration} from '../library/babel.js'

type ComponentManifest = {
	/** the name of the component */
	name: string,
	/** a little something about the component */
	description: string,
	/** version string */
	version: string,
	/** all the component's dependencies */
	dependencies: Dictionary,
	/** the component's canonical homepage */
	homepage: string,
	/** the component's developer dependencies */
	devDependencies?: Dictionary,
	/** the license the code is released onder */
	license: string
}

export type BowerManifest = ComponentManifest & {
	/** the component's entry points */
	main: string | string[]
}

export type NpmManifest = ComponentManifest & {
	/** the component's javascript entry point */
	main: string,
	/** the component's es6 entry point */
	module: string,
	/** the component's precompiled entry point */
	source: string,
	/** scripts that can be run with `npm run-script` */
	scripts?: Dictionary,
	/** the component's origami name */
	component: string,
	/** aliases for packages !! */
	aliases?: Dictionary,
	/** optional dependencies */
	optionalDependencies?: Dictionary,
	/** peer dependencies */
	peerDependencies?: Dictionary,
	/** babel config */
	babel?: BabelConfiguration
}

export type Bowerrc = {
	directory: string,
	registry: {
		search: string[]
	},
	ca: {
		search: []
	}
}
