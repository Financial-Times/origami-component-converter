import * as components from "../library/components.js"
import * as npm from "../library/npm.js"
import unary from "../library/unary.js"

export let command = "link"
export let describe = "npm link all the deps globally"

export let handler = async function() {
	await components.batch("npm link")
	await components.sequence(async name => {
		if (!name) return false
		let dependencies = await components.sort([name])
		let names = dependencies.map(unary(npm.createComponentName)).join(" ")

		return Boolean(names.length) && `npm link ${names}`
	})
}
