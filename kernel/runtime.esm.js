/**
 *	Author: JCloudYu
 *	Create: 2019/12/23
**/
import fs from "fs";
import path from "path";
import beson from "beson";

import {WorkingRoot} from "/kernel-info.esm.js";
import {Config} from "/kernel/config.esm.js";
import {Watchable} from "/kernel/watchable.esm.js";

export const RuntimeDir = path.resolve(WorkingRoot, Config.runtime_dir);



let _runtime_data = {};
const RuntimePath = `${RuntimeDir}/runtime.bes`;
export const RuntimeData = new Proxy({}, {
	has:(_, prop)=>{
		return (prop in _runtime_data);
	},
	get:(_, prop)=>{
		return _runtime_data[prop];
	},
	set:(_, prop, value)=>{
		_runtime_data[prop] = value;
		__StoreRuntimeData();
		return true;
	},
	deleteProperty(_, prop) {
		delete _runtime_data[prop];
		__StoreRuntimeData();
		return true;
	}
});
export const VolatileData = Watchable();
export async function Init() {
	const stat = (()=>{
		try {
			return fs.statSync(RuntimeDir);
		}
		catch(e) {
			if ( e.code === 'ENOENT' ) {
				return null;
			}
			
			throw e;
		}
	})();
	if ( !stat ) {
		fs.mkdirSync(RuntimeDir, {recursive:true, mode:0o755});
	}
	else
	if ( !stat.isDirectory() ) {
		throw new Error(`Runtime dir \`${RuntimeDir}\` must be a directory!`);
	}
	else {
		try {
			fs.accessSync(RuntimeDir, fs.constants.W_OK|fs.constants.R_OK|fs.constants.X_OK);
		}
		catch(e) {
			throw new Error(`Current user has no access to the runtime dir \`${RuntimeDir}\`!`);
		}
	}
	

	return __ReloadRuntimeData();
}






function __StoreRuntimeData() {
	const content = beson.Serialize(_runtime_data);
	fs.writeFileSync(RuntimePath, Buffer.from(content));
	return this;
}
function __ReloadRuntimeData() {
	try {
		const content = fs.readFileSync(RuntimePath);
		const decoded = beson.Deserialize(ArrayBuffer.from(content));
		if ( Object(decoded) === decoded ) {
			_runtime_data = decoded;
		}
	}
	catch(e) {}
}
