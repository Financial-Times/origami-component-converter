import * as root from "./root.js"
import {readJsonSync} from "fs-extra"

export default filename =>
	readJsonSync(root.resolve(filename))
