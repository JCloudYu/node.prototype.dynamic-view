import fs from "fs";
import {RuntimeDir} from "/kernel.esm.js";

export async function Update(prev_version) {
	console.log("Creating runtime directory...");
	fs.mkdirSync(RuntimeDir, {recursive:true, mode:0o755});
}
