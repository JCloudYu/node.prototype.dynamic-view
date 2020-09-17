/**
 *	Author: JCloudYu
 *	Create: 2020/01/29
**/
import {KernelInfo, KernelArchVersion, ProjectInfo} from "/kernel.esm.js";



export function Handle(req, res) {
	const kernel_versions = KernelArchVersion.slice(0).reverse().map(({version})=>version);
	res.write( `${KernelInfo.version}, ${ProjectInfo.version}, ${kernel_versions.join(", ")}\n` );
}
