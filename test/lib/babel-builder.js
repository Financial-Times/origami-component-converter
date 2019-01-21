let assert = require("assert")
let {
	default: BabelBuilder,
	builder
} = require("../../lib/babel-builder")

describe("Babel Configuration Builder", () => {
	describe("exports", () => {
		it("exports a BabelBuilder class as default", () => {
			assert.equal(typeof BabelBuilder, "function")
			assert.throws(() => {
				// eslint-disable-next-line new-cap
				BabelBuilder()
			})

			assert.doesNotThrow(() => {
				// eslint-disable-next-line new-cap
				new BabelBuilder()
			})
		})

		it("exports a builder function", () => {
			assert.equal(builder().constructor, BabelBuilder)
		})
	})

	describe("BuilderList", () => {
		let BuilderList = builder().presets.constructor

		it("returns a BuilderList instance", () => {
			let list = new BuilderList()
			assert.equal(list.constructor, BuilderList)
		})

		it("implements a length", () => {
			let list = new BuilderList()
			assert.equal(list.length, 0)
			list.set("LOL", "HELLO")
			list.set("X", "HELLO")
			assert.equal(list.length, 2)
		})

		it("has only one entry for each name", () => {
			let list = new BuilderList()
			assert.equal(list.length, 0)
			list.set("LOL", "HELLO")
			list.set("LOL", "MONKEY")
			assert.equal(list.length, 1)
		})

		it("returns the set value for a key", () => {
			let list = new BuilderList()
			let key = "LOL"
			let honk = {inthiscase: "honk"}
			let bonk = {inthiscase: "bonk"}
			list.set(key, honk)
			assert.equal(list.get(key), honk)
			list.set(key, bonk)
			assert.equal(list.get(key), bonk)
		})

		it("removes a value when .remove is called", () => {
			let list = new BuilderList()
			let key = "abe"
			let value = {is: "cute"}
			list.set(key, value)
			assert.equal(list.get(key), value)
			list.remove(key)
			assert.equal(list.get(key), null)
		})

		describe(".map", () => {
			it("does not mutate", () => {
				let list = new BuilderList()
				for (let key of ["a", "b", "c", "d"]) {
					list.set(key, {})
				}

				let nextList = list.map(() => ({}))

				assert.notEqual(list.get("a"), nextList.get(""))
			})

			it("returns a new BuilderList", () => {
				let list = new BuilderList()
				list.set("a", {})
				let nextList = list.map(() => ({}))
				assert.strictEqual(nextList.constructor, BuilderList)
			})

			it("passes `(key, value)` to `fn` for some reason", () => {
				let list = new BuilderList()
				let key = "key"
				let value = {}
				list.set(key, value)
				list.map((mapkey, mapvalue) => {
					assert.strictEqual(key, mapkey)
					assert.strictEqual(value, mapvalue)
				})
			})
		})

		describe("constructor", () => {
			it("takes an old BuilderList and uses its items", () => {
				let list = new BuilderList()
				let mario = {mario: true}
				list.set("me", mario)

				let copy = new BuilderList(list)

				assert.deepEqual(copy.get("me"), mario)

				assert.deepEqual(list.toJSON(), copy.toJSON())
			})
		})

		describe("toJSON", () => {
			it("implements valueOf", () => {
				assert.equal("function", typeof new BuilderList().valueOf)
			})

			it("implements toJSON", () => {
				assert.equal("function", typeof new BuilderList().toJSON)
			})

			it("returns the same results for toJSON and valueOf", () => {
				let list = new BuilderList()
				list.set("why", {no: "eggs"})
				assert.deepStrictEqual(list.valueOf(), list.toJSON())
			})

			it("returns a string for items with no value", () => {
				let list = new BuilderList()
				list.set("undefined", undefined)
				list.set("not passed")
				list.set("null", null)
				assert.deepStrictEqual(list.toJSON(), [
					"undefined",
					"not passed",
					"null"
				])
			})

			it("returns an entry for items with value", () => {
				let list = new BuilderList()
				list.set("object", {what: "shown"})
				assert.deepStrictEqual(list.toJSON(), [
					["object", {what: "shown"}]
				])
			})
		})

		// Commenting this out because, is this part of the contract?
		//
		// it("returns the undefined for a bad key", () => {
		// 	let list = new BuilderList()
		// 	assert.equal(list.get("LOL"), undefined)
		// })
	})

	describe("builder", () => {
		it("implements valueOf", () => {
			assert.equal("function", typeof builder().valueOf)
		})

		it("implements toJSON", () => {
			assert.equal("function", typeof builder().toJSON)
		})

		it("returns the same results for toJSON and valueOf", () => {
			let config = builder()
			config.preset("lol")
			assert.deepStrictEqual(config.valueOf(), config.toJSON())
		})

		it("adds a preset to the list when .preset is called", () => {
			let config = builder()
			assert.equal(config.presets.length, 0)
			config.preset("im-happy")
			assert.equal(config.presets.length, 1)
		})

		it("adds a plugin to the list when .plugin is called", () => {
			let config = builder()
			assert.equal(config.plugins.length, 0)
			config.plugin("im-happy")
			assert.equal(config.plugins.length, 1)
		})

		it("returns a correct config", () => {
			let config = builder()
			config.preset("preset")
			config.preset("preset-with-option", {option: true})
			config.plugin("plugin")
			config.plugin("plugin-with-option", {option: "replace-this"})
			config.plugin("plugin-with-option", {option: "cool"})
			config.override(
				builder()
					.test("test")
					.exclude("exclude")
					.preset("override-preset-with-option", {header: "wrong"})
			)
			assert.deepStrictEqual(config.toJSON(),
				{
					presets: [
						"preset",
						["preset-with-option", {option: true}]
					],
					plugins: [
						"plugin",
						["plugin-with-option", {option: "cool"}]
					],
					overrides: [
						{
							test: "test",
							exclude: "exclude",
							plugins: [],
							presets: [
								["override-preset-with-option", {header: "wrong"}]
							]
						}
					]
				}
			)
		})
	})
})
