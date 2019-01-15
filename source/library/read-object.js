//
import * as fs from "fs-extra"

import * as workingDirectory from "./working-directory.js"

export default async filename => fs.readJson(workingDirectory.resolve(filename))
