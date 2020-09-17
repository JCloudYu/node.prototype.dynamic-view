/**
 *	Author: JCloudYu
 *	Create: 2020/06/25
**/
import {_RuntimeData, _RuntimeDir, _VolatileData} from "/kernel/runtime.esm.js";
import {_Config} from "/kernel/config.esm.js";
import {_CheckDataSystemVersion, _ResolveFileURIPath, _IsWindowsEnv, _WorkingRoot, _KernelInfo, _ProjectInfo, _KernelArchVersion} from "/kernel-info.esm.js";



export {
	_RuntimeData as RuntimeData,
	_RuntimeDir as RuntimeDir,
	_VolatileData as VolatileData,
	_Config as Config,
	_CheckDataSystemVersion as CheckDataSystemVersion,
	_ResolveFileURIPath as ResolveFileURIPath,
	_IsWindowsEnv as IsWindowsEnv,
	_WorkingRoot as WorkingRoot,
	_KernelInfo as KernelInfo,
	_ProjectInfo as ProjectInfo,
	_KernelArchVersion as KernelArchVersion
}
