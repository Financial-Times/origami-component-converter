// @flow

import {
	clone
} from './dictionary.js'

import type {Configuration} from './babel'

class BuilderItem {
	name: string
	options: ?any

	constructor (name: string, options?: any) {
		this.name = name
		this.options = options
	}

	valueOf () {
		return this.options
			? [this.name, this.options]
			: this.name
	}

	toJSON () {
		return this.valueOf()
	}
}

class BuilderList {
	items: {
		[string]: any
	}

	constructor (list?: BuilderList) {
		this.items = list
			? clone(list.items)
			: {}
	}

	set (name: string, options?: any) {
		this.items[name] = options
	}

	get (name: string) {
		return this.items[name]
	}

	map (fn: (string, any) => any): Array<any> {
		let result = []

		for (let key in this.items) {
			result.push(fn(key, this.items[key]))
		}

		return result
	}

	remove (name: string): BuilderList {
		delete this.items[name]
		return this
	}

	valueOf () {
		return this.map((name, options) => options
			? [name, options]
			: name
		)
	}

	toJSON () {
		return this.valueOf()
	}
}

export default class BabelBuilder {
	test: ?string

	plugins: BuilderList

	presets: BuilderList

	overrides: ?BabelBuilder[]

	constructor (builder?: BabelBuilder) {
		if (builder) {
			this.presets = new BuilderList(builder.presets)
			this.plugins = new BuilderList(builder.plugins)
		} else {
			this.presets = new BuilderList()
			this.plugins = new BuilderList()
			this.overrides = []
		}
	}

	preset (name: string, options?: any): BabelBuilder {
		this.presets.set(name, options)

		return this
	}

	getPreset (name: string): ?BuilderItem {
		return this.presets.get(name)
	}

	plugin (name: string, options?: any): BabelBuilder {
		this.plugins.set(name, options)

		return this
	}

	getPlugin (name: string): ?BuilderItem {
		return this.plugins.get(name)
	}

	override (test: string, override: BabelBuilder, extend: boolean = true): BabelBuilder {
		let result = extend
			? new BabelBuilder(this)
			: new BabelBuilder()

		result.test = test

		override.presets.map((name, options) => {
			result.preset(name, options)
		})

		override.plugins.map((name, options) => {
			result.plugin(name, options)
		})

		this.overrides && this.overrides.push(result)

		return this
	}

	valueOf (): Configuration {
		let configuration = {}
		configuration.presets = this.presets.toJSON()
		configuration.plugins = this.plugins.toJSON()
		if (this.overrides) {
			configuration.overrides = this.overrides.map(override => {
				let object = override.toJSON()
				delete object.overrides
				return object
			})
		}
		return configuration
	}

	toJSON (): Configuration {
		return this.valueOf()
	}
}

let builder = () => new BabelBuilder()

export {builder}
