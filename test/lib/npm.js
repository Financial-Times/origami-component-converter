import * as npm from "../../lib/npm"
import expect from "expect"
import mappings from "../../config/mappings"
import snap from "snap-shot-it"
let specCompliantBowerConfig = require("o-spec-compliant-bower-config/bower.json")

let props = {
	name: "yeet",
	version: "0.0.0-yeet",
}

describe("merge manifests", () => {
	it("overwrites deps from existing with generated", () => {
		let existing = {
			...props,
			dependencies: {a: "1", b: "2", c: "3"},
		}
		let generated = {
			...props,
			dependencies: {b: "2", c: "5"},
		}
		expect(npm.mergeManifests(existing, generated)).toEqual({
			...props,
			dependencies: {
				a: "1",
				b: "2",
				c: "5",
			},
			devDependencies: {},
			scripts: {},
		})
	})

	it("overwrites dev-deps from existing with generated", () => {
		let existing = {
			...props,
			devDependencies: {a: "1", b: "2", c: "3"},
		}
		let generated = {
			...props,
			devDependencies: {b: "2", c: "5"},
		}
		expect(npm.mergeManifests(existing, generated)).toEqual({
			...props,
			devDependencies: {
				a: "1",
				b: "2",
				c: "5",
			},
			dependencies: {},
			scripts: {},
		})
	})

	it("overwrites scripts from existing manifest with generated", () => {
		let existing = {
			...props,
			scripts: {a: "old", b: "town", c: "yeet"},
		}
		let generated = {
			...props,
			scripts: {c: "road"},
		}
		expect(npm.mergeManifests(existing, generated)).toEqual({
			...props,
			scripts: {
				a: "old",
				b: "town",
				c: "road",
			},
			dependencies: {},
			devDependencies: {},
		})
	})
})

describe("createComponentName", () => {
	it("adds the default npm org", () => {
		expect(npm.createComponentName("yeet")).toBe("@financial-times/yeet")
	})

	it("accepts another npm org", () => {
		expect(npm.createComponentName("monkey", "ftlabs")).toBe("@ftlabs/monkey")
	})
})

describe("createDependencyVersion", () => {
	it("uses version from mapping config", async () => {
		let [[from, to]] = Object.entries(mappings.version)
		let result = await npm.createDependencyVersion(["yeet", from])
		expect(result).toBe(to)
	})

	it("uses a valid semver if there is one", async () => {
		let version = "0.0.0-0.0.0-0.0.0-yeet"
		let result = await npm.createDependencyVersion(["yeet", version])
		expect(result).toBe(version)
	})

	it("uses a valid semver if there is one in a hash", async () => {
		let semver = "0.0.0-0.0.0-0.0.0-yeet"
		let version = `blablahblah#${semver}`
		let result = await npm.createDependencyVersion(["yeet", version])
		expect(result).toBe(semver)
	})

	it("throws otherwise", async () => {
		let nonSemver = "$0.$0.0-0.0.0-0.0.0-yeet$17"
		let version = `blablahblah#${nonSemver}`
		expect(npm.createDependencyVersion(["yeet", version])).rejects.toThrow()
		expect(npm.createDependencyVersion(["yeet", nonSemver])).rejects.toThrow()
	})
})

describe("createManifest", () => {
	it("creates the same manifest as last time", async () => {
		snap(await npm.createManifest(specCompliantBowerConfig))
	})
})

describe("cleanManifest", async () => {
	it("removes aliases", async () => {
		expect(
			await npm.cleanManifest(
				Promise.resolve({
					...props,
					aliases: {
						a: "b",
					},
				})
			)
		).toEqual(props)
	})
	it("doesnt mutate the object", async () => {
		let aliases = {
			a: "b",
		}
		let manifest = {...props, aliases}
		let clean = await npm.cleanManifest(Promise.resolve(manifest))
		expect(clean).not.toBe(manifest)
		expect(manifest.aliases).toBe(aliases)
	})
})
