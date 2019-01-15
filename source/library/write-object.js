//
import * as fs from "fs-extra"
import stringify from "./stringify.js"

export default (filename, object) => fs.outputFile(filename, stringify(object))
