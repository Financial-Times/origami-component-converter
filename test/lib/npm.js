import * as npm from "../../lib/npm"
import expect from "expect"
import mappings from "../../config/mappings"
import snap from "snap-shot-it"
let specCompliantBowerConfig = require("o-spec-compliant-bower-config/bower.json")

describe("merge manifests", () => {
	it("overwrites deps from existing with generated", () => {
		let existing = {
			dependencies: {a: 1, b: 2, c: 3}
		}
		let generated = {
			dependencies: {b: 2, c: 5}
		}
		expect(npm.mergeManifests(existing, generated)).toEqual({
			dependencies: {
				a: 1,
				b: 2,
				c: 5,
			},
			devDependencies: {},
			scripts: {},
		})
	})

	it("overwrites dev-deps from existing with generated", () => {
		let existing = {
			devDependencies: {a: 1, b: 2, c: 3},
		}
		let generated = {
			devDependencies: {b: 2, c: 5},
		}
		expect(npm.mergeManifests(existing, generated)).toEqual({
			devDependencies: {
				a: 1,
				b: 2,
				c: 5,
			},
			dependencies: {},
			scripts: {},
		})
	})

	it("overwrites scripts from existing manifest with generated", () => {
		let existing = {
			scripts: {a: "old", b: "town", c: "yeet"},
		}
		let generated = {
			scripts: {c: "road"},
		}
		expect(npm.mergeManifests(existing, generated)).toEqual({
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
		expect(await npm.cleanManifest({aliases: true})).toEqual({})
	})
	it("doesnt mutate the object", async () => {
		let manifest = {aliases: true}
		let clean = await npm.cleanManifest()
		expect(clean).not.toBe(manifest)
		expect(manifest.aliases).toBe(true)
	})
})
