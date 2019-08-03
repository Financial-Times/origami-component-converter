import {
	normalize,
	replace,
	rewrite
} from "../../lib/babel-plugin-import-rewrite.js"

import { expect } from 'chai';

describe("normalize", () => {
	it("leaves bare paths alone", () => {
		expect(normalize("x/x")).to.eql("x/x")
	})
	it("leaves absolute paths alone", () => {
		expect(normalize("/xx")).to.eql("/xx")
	})
	it("leaves ./ paths alone", () => {
		expect(normalize("./x")).to.eql("./x")
	})

	it("leaves ../ paths alone", () => {
		expect(normalize("../x")).to.eql("../x")
	})

	it("fixes ./..", () => {
		expect(normalize("./../x")).to.eql("../x")
	})

	it("removes noisy dots", () => {
		expect(normalize("./.././../y")).to.eql("../../y")
	})
})

describe("replace", () => {
	it("fixes main to browser", () => {
		expect(replace("../../main.js")).to.eql("../../browser.js")
	})

	it("fixes deeper main to deeper browser", () => {
		expect(replace("../../../../main")).to.eql("../../../../browser")
	})

	it("fixes src to dist", () => {
		expect(replace("../src/lol")).to.eql("../dist/lol")
	})

	it("fixes src to dist even on barebois", () => {
		expect(replace("@x/src/lol")).to.eql("@x/dist/lol")
	})
})

describe("rewrite", () => {
	it("normalizes", () => {
		expect(rewrite("./..", {})).to.eql("..")
	})

	let aliases = {
		friend: "@special/friend"
	}

	it("rewrites aliases", () => {
		expect(rewrite("friend/lol", aliases)).to.eql("@special/friend/lol")
	})

	it("leaves non-aliases items alone", () => {
		expect(rewrite("o-colors/main", aliases)).to.eql("o-colors/main")
	})

	it("replaces src with dist in aliases", () => {
		expect(rewrite("friend/src/lol", aliases)).to.eql("@special/friend/dist/lol")
	})

	it("replaces longer src paths with dist in aliases", () => {
		expect(rewrite("friend/src/monkey/lol", aliases))
			.to.eql("@special/friend/dist/monkey/lol")
	})

	it("replaces local main with local browser", () => {
		expect(rewrite("../../../main", aliases)).to.eql("../../../browser")
	})

	it("replaces local main.js with local browser.js", () => {
		expect(rewrite("../../../main.js", aliases)).to.eql("../../../browser.js")
	})

	it("replaces local src with local dist", () => {
		expect(rewrite("../../src/lol", aliases)).to.eql("../../dist/lol")
	})
})

export default {}
