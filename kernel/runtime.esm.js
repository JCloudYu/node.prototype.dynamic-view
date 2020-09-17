/**
 *	Author: JCloudYu
 *	Create: 2019/12/23
**/
import fs from "fs";
import path from "path";
import beson from "beson";

import {_WorkingRoot as WorkingRoot} from "/kernel-info.esm.js";
import {_Config as Config} from "/kernel/config.esm.js";
import {Watchable} from "/kernel/watchable.esm.js";

export const _RuntimeDir = path.resolve(WorkingRoot, Config.runtime_dir);



let _runtime_data = {};
const RuntimePath = `${_RuntimeDir}/runtime.bes`;
export const _RuntimeData = new Proxy({}, {
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
export const _VolatileData = Watchable();
export async function Init() {
	try {
		const stat = fs.statSync(_RuntimeDir);
		if ( !stat.isDirectory() ) {
			throw new Error(`Runtime dir \`${_RuntimeDir}\` must be a directory!`);
		}
		else {
			try {
				fs.accessSync(_RuntimeDir, fs.constants.W_OK|fs.constants.R_OK|fs.constants.X_OK);
			}
			catch(e) {
				throw new Error(`Current user has no access to the runtime dir \`${_RuntimeDir}\`!`);
			}
		}
		
		return __ReloadRuntimeData();
	}
	catch(e) {
		if ( e.code !== 'ENOENT' ) throw e;
	}
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
	catch(e) { throw e; }
}
