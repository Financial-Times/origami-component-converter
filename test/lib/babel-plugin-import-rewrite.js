import {
	normalize,
	replace,
	rewrite
} from "../../lib/babel-plugin-import-rewrite.js"

import expect from "expect"

describe("normalize", () => {
	it("leaves bare paths alone", () => {
		expect(normalize("x/x")).toBe("x/x")
	})
	it("leaves absolute paths alone", () => {
		expect(normalize("/xx")).toBe("/xx")
	})
	it("leaves ./ paths alone", () => {
		expect(normalize("./x")).toBe("./x")
	})

	it("leaves ../ paths alone", () => {
		expect(normalize("../x")).toBe("../x")
	})

	it("fixes ./..", () => {
		expect(normalize("./../x")).toBe("../x")
	})

	it("removes noisy dots", () => {
		expect(normalize("./.././../y")).toBe("../../y")
	})
})

describe("replace", () => {
	it("fixes main to browser", () => {
		expect(replace("../../main.js")).toBe("../../browser.js")
	})

	it("fixes deeper main to deeper browser", () => {
		expect(replace("../../../../main")).toBe("../../../../browser")
	})

	it("fixes src to dist", () => {
		expect(replace("../src/lol")).toBe("../dist/lol")
	})

	it("fixes src to dist even on barebois", () => {
		expect(replace("@x/src/lol")).toBe("@x/dist/lol")
	})
})

describe("rewrite", () => {
	it("normalizes", () => {
		expect(rewrite("./..", {})).toBe("..")
	})

	let aliases = {
		friend: "@special/friend"
	}

	it("rewrites aliases", () => {
		expect(rewrite("friend/lol", aliases)).toBe("@special/friend/lol")
	})

	it("leaves non-aliases items alone", () => {
		expect(rewrite("o-colors/main", aliases)).toBe("o-colors/main")
	})

	it("replaces src with dist in aliases", () => {
		expect(rewrite("friend/src/lol", aliases)).toBe("@special/friend/dist/lol")
	})

	it("replaces longer src paths with dist in aliases", () => {
		expect(rewrite("friend/src/monkey/lol", aliases))
			.toBe("@special/friend/dist/monkey/lol")
	})

	it("replaces local main with local browser", () => {
		expect(rewrite("../../../main", aliases)).toBe("../../../browser")
	})

	it("replaces local main.js with local browser.js", () => {
		expect(rewrite("../../../main.js", aliases)).toBe("../../../browser.js")
	})

	it("replaces local src with local dist", () => {
		expect(rewrite("../../src/lol", aliases)).toBe("../../dist/lol")
	})
})

export default {}
