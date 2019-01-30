import * as components from "../lib/components.js"

export let command = "exec <command>"
export let describe = "run a command in each component"
export let handler = argv => components.sequence(String(argv.command))
