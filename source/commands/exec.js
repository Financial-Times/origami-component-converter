//
import * as components from "../library/components.js"

export let command = "exec <command>"
export let describe = "print the names of the components and exit"
export let handler = argv => components.batch(String(argv.command))
