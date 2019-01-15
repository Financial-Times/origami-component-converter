//
import * as components from "../library/components.js"

export let command = "print-components"
export let aliases = ["ls"]
export let describe = "print the names of the components and exit"
export let handler = async function printComponents() {
	let names

	try {
		names = await components.sort()
	} catch (error) {
		names = await components.names.all
	}

	console.info(names.join("\n"))
}
