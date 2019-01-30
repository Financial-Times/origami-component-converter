import * as components from "../lib/components.js"
import * as npm from "../lib/npm.js"

export let command = "link"
export let describe = "npm link all the deps globally"

export let handler = async function() {
	await components.sequence("npm link")
	await components.sequence(async name => {
		if (!name) return false
		let dependencies = await components.sort([name])
		let names = dependencies.map(name =>
			npm.createComponentName(name)
		).join(" ")

		return Boolean(names.length) && `npm link ${names}`
	})
}
