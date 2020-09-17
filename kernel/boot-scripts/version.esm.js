/**
 *	Author: JCloudYu
 *	Create: 2020/01/30
**/
import {KernelInfo, ProjectInfo, KernelArchVersion} from "/kernel.esm.js";

const {version:runtime_version} = KernelInfo;
const {name:project_name, version:project_version} = ProjectInfo;
const kernel_versions = KernelArchVersion.slice(0).reverse().map(({identifier, version})=>`${version}(${identifier})`);
process.stdout.write(`${runtime_version||"0.0.0"}, ${project_version}(${project_name}), ${kernel_versions.join(', ')}\n`);
process.cleanup();
