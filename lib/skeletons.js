import * as root from "./root.js"
import {readJsonSync} from "fs-extra"

export let componentManifest = readJsonSync(root.resolve("skeletons/component/package.json"))
