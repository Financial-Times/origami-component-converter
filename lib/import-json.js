//
import {readFileSync} from "fs"

import * as root from "./root.js"

import compose from "./compose.js"

let parse = json => JSON.parse(json)

let encoding = "utf-8"

let read = filename => readFileSync(root.resolve(filename), {encoding})

export default compose(
	parse,
	read
)
