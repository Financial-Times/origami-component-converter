/**
 * @typedef {import('./babel').Configuration} Configuration
 * @typedef {import('./babel').Plugin} Plugin
 * @typedef {import('./babel').Preset} Preset
 * @typedef {import('./dictionary').Dictionary} Dictionary
 */

/**
 * @typedef {string | [string, Bbject]} BuilderItem
 */

import {clone} from "./dictionary.js"

class BuilderList {
	/**
	 * @param {{items: Dictionary}} [list] a previous builder list to extend
	 */
	constructor(list) {
		this.items = list ? clone(list.items) : {}
	}

	get length () {
		return Object.keys(this.items).length
	}

	/**
	 * set an item
	 * @param {string} name
	 * @param {any} [options]
	 */
	set(name, options) {
		this.items[name] = options
		return this
	}

	/**
	 * get an item
	 * @param {string} name
	 * @returns {any}
	 */
	get(name) {
		return this.items[name]
	}

	/**
	 * call a function on each item and return a new set of items
	 * @param {(key: string, value: any) => any} fn
	 * @returns {Array}
	 */
	map(fn) {
		let result = []

		for (let key in this.items) {
			result.push(fn(key, this.items[key]))
		}

		return result
	}

	/**
	 * remove an item
	 * @param {string} name
	 * @returns {BuilderList}
	 */
	remove(name) {
		delete this.items[name]
		return this
	}

	/**
	 * get this thing as a good array
	 * @returns {(Preset | Plugin)[]}
	 */
	valueOf() {
		return this.map((name, options) => (options ? [name, options] : name))
	}

	/**
	 * get this thing as a good array
	 * @returns {(Preset | Plugin)[]}
	 */
	toJSON() {
		return this.valueOf()
	}
}

/**
 *
 */
export default class BabelBuilder {
	// includeTest: ?(string | string[])
	// excludeTest: ?(string | string[])

	// plugins: BuilderList

	// presets: BuilderList

	// overrides: ?BabelBuilder[]

	/**
	 * @param {{presets: BuilderList, plugins: BuilderList}} [builder] a previous builder to extend
	 */
	constructor(builder) {
		if (builder) {
			this.presets = new BuilderList(builder.presets)
			this.plugins = new BuilderList(builder.plugins)
		} else {
			this.presets = new BuilderList()
			this.plugins = new BuilderList()
			/**
			 * @type BabelBuilder[]
			 */
			this.overrides = []
		}
	}

	/**
	 * Add a preset to the config
	 * @param {string} name
	 * @param {any} [options]
	 * @returns this
	 */
	preset(name, options) {
		this.presets.set(name, options)

		return this
	}

	/**
	 * Get a preset item from the config
	 * @param {string} name
	 * @returns {BuilderItem}
	 */
	getPreset(name) {
		return this.presets.get(name)
	}

	/**
	 * Add a plugin to the config
	 * @param {string} name
	 * @param {any} [options]
	 * @returns {BabelBuilder}
	 */
	plugin(name, options) {
		this.plugins.set(name, options)
		return this
	}

	/**
	 * Get a plugin item from the config
	 * @param {string} name
	 * @returns {BuilderItem}
	 */
	getPlugin(name) {
		return this.plugins.get(name)
	}

	/**
	 * Set the includeTest pattern
	 * @param {string | string[]} test
	 * @returns {BabelBuilder}
	 */
	test(test) {
		this.includeTest = test
		return this
	}

	/**
	 * Set the excludeTest pattern
	 * @param {string | string[]} test
	 * @returns {BabelBuilder}
	 */
	exclude(test) {
		this.excludeTest = test
		return this
	}

	/**
	 * Add an override
	 * @param {BabelBuilder} override
	 */
	override(override) {
		this.overrides && this.overrides.push(override)
		return this
	}

	/**
	 * get this thing as a jolly object
	 * @returns {Configuration}
	 */
	valueOf() {
		/**
		 * @type {Configuration}
		 */
		let configuration = {}
		configuration.presets = this.presets.toJSON()
		configuration.plugins = this.plugins.toJSON()
		this.includeTest && (configuration.test = this.includeTest)
		this.excludeTest && (configuration.exclude = this.excludeTest)
		if (this.overrides) {
			configuration.overrides = this.overrides.map(override => {
				let object = override.toJSON()
				delete object.overrides
				return object
			})
		}
		return configuration
	}

	/**
	 * get this thing as a jolly object
	 * @returns {Configuration}
	 */
	toJSON() {
		return this.valueOf()
	}
}

let builder = () => new BabelBuilder()

export {builder}
