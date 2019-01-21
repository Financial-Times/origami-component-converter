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
	 * @param {string} name the item name
	 * @param {any} [options] optional options
	 * @returns {BuilderList} this
	 */
	set(name, options) {
		this.items[name] = options
		return this
	}

	/**
	 * get an item
	 * @param {string} name item name
	 * @returns {any} item value
	 */
	get(name) {
		return this.items[name]
	}

	/**
	 * Call a function on each item and return a new set of items
	 * @param {function(string, object)} fn the function to run
	 * @returns {BuilderList} a new builderlist
	 */
	map(fn) {
		let list = new this.constructor

		// eslint-disable-next-line guard-for-in
		for (let key in this.items) {
			list.set(key, fn(key, this.items[key]))
		}

		return list
	}

	/**
	 * remove an item
	 * @param {string} name the item to remove
	 * @returns {BuilderList} this
	 */
	remove(name) {
		delete this.items[name]
		return this
	}

	/**
	 * get this thing as a good array
	 * @returns {(Preset | Plugin)[]} a simple js object representation
	 */
	valueOf() {
		let items = []
		this.map((name, options) =>
			items.push((options ? [name, options] : name))
		)
		return items
	}

	/**
	 * get this thing as a good array
	 * @returns {(Preset | Plugin)[]} a simple js object representation
	 */
	toJSON() {
		return this.valueOf()
	}
}

/**
 *
 */
export default class BabelBuilder {
	/**
	 * @param {{presets: BuilderList, plugins: BuilderList}} [builder] a previous builder to extend
	 */
	constructor (builder) {
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
	 * @param {string} name the preset name to add or set
	 * @param {any} [options] optional preset options
	 * @returns {this} this
	 */
	preset(name, options) {
		this.presets.set(name, options)

		return this
	}

	/**
	 * Get a preset item from the config
	 * @param {string} name the preset name
	 * @returns {BuilderItem} the preset
	 */
	getPreset(name) {
		return this.presets.get(name)
	}

	/**
	 * Add a plugin to the config
	 * @param {string} name the plugin name
	 * @param {any} [options] optional options for the plugin
	 * @returns {BabelBuilder} this
	 */
	plugin(name, options) {
		this.plugins.set(name, options)
		return this
	}

	/**
	 * Get a plugin item from the config
	 * @param {string} name the name of the plugin
	 * @returns {BuilderItem} a plugin
	 */
	getPlugin(name) {
		return this.plugins.get(name)
	}

	/**
	 * Set the includeTest pattern
	 * @param {string | string[]} test a pattern string
	 * @returns {BabelBuilder} this
	 */
	test(test) {
		this.includeTest = test
		return this
	}

	/**
	 * Set the excludeTest pattern
	 * @param {string | string[]} test a pattern string
	 * @returns {BabelBuilder} this
	 */
	exclude(test) {
		this.excludeTest = test
		return this
	}

	/**
	 * Add an override
	 * @param {BabelBuilder} override a babel config
	 * @returns {this} this
	 */
	override(override) {
		this.overrides && this.overrides.push(override)
		return this
	}

	/**
	 * get this thing as a jolly object
	 * @returns {Configuration} simple object representation of config
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
	 * @returns {Configuration} simple object representation of config
	 */
	toJSON() {
		return this.valueOf()
	}
}

export let builder = () => new BabelBuilder()
