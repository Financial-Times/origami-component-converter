import assert from "assert"
import {constants} from "fs"
import mock from "mock-require"

describe("check file is accessible", () => {
	mock("fs-extra", {
		access: (path, mode) => {
			assert.equal(mode, constants.W_OK | constants.R_OK)
			return path == "bad"
				? Promise.reject()
				: Promise.resolve()
		}
	})

	let check = require("../../lib/check-file-is-accessible.js").default

	it("demands read/write", async () => {
		await check("good")
	})

	it("resolves with `true` if path is read/writeable", async () => {
		assert.equal(await check("good"), true)
	})

	it("resolves with `false` if path is not read/writeable", async () => {
		assert.equal(await check("bad"), false)
	})
})
