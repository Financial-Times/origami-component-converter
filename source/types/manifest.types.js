// @flow

import type {Dictionary} from '../library/dictionary.js'

export type LernaManifest = {
	packages: string[],
	version: string
}

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
}

export type BowerManifest = ComponentManifest & {
	/** the component's entry points */
	main: string[]
}

export type NpmManifest = ComponentManifest & {
	/** the component's javascript entry point */
	main: string,
	/** the component's es6 entry point */
	module: string,
	/** the component's precompiled entry point */
	source: string,
	/** scripts that can be run with `npm run-script` */
	scripts: Dictionary,
	/** the component's origami name */
	component: string,
	/** aliases for packages !! */
	aliases: Dictionary,
	/** optional dependencies */
	optionalDependencies?: Dictionary,
	/** optional dependencies */
	peerDependencies?: Dictionary,
}

export type Bowerrc = {
	directory: string,
	registries: {
		search: string[]
	}
}
