import fs from "fs";
import {Version} from "/kernel/version.esm.js";

import {WorkingRoot, KernelInfo} from "/kernel.esm.js";



(async()=>{
	let UpdateRuntime = null;
	console.log( "Trying to initialize update runtime environment..." );
	try {
		UpdateRuntime = await import("/update/update.runtime.esm.js");
	}
	catch(e) {}
	
	if ( UpdateRuntime ) {
		if ( UpdateRuntime.Init ) {
			await UpdateRuntime.Init();
		}
		
		console.log( "Application runtime environment initialized!" );
	}
	
	
	
	// NOTE: Query the system version
	let system_version = KernelInfo.version;
	if ( !system_version ) {
		system_version = KernelInfo.version = "0.0.0";
		await KernelInfo.save();
	}
	
	
 	// NOTE: Fetch update files
 	const content_list = fs.readdirSync(`${WorkingRoot}/update/updates`);
 	const versions = [];
 	for( const item of content_list ) {
 		if ( item === "." || item === ".." || item.substr(-7) !== ".esm.js" ) continue;
 		const version = Version.from(item.substring(0, item.length-7));
 		if ( !version ) continue;
 		
 		versions.push(version);
 	}
 	versions.sort((a, b)=>a.compare(b, false));
 	
 	
 	
 	// NOTE: Run update
 	const start_version = system_version;
 	for( const version of versions ) {
 		if ( version.compare(system_version, false) <= 0 ) continue;
 		console.log( `Updating to ${version.version_string}...` );
 		const {Update} = await import( `/update/updates/${version.version_string}.esm.js` );
 		await Update(system_version);
 		KernelInfo.version = system_version = version.version_string;
 		await KernelInfo.save();
 		console.log('');
 	}
 	
 	if (system_version === start_version) {
 		console.log( `Nothing to update!` );
 	}
 	else {
 		console.log( `Update finished! (${start_version} -> ${system_version})` );
 	}
 	
 	
 	if ( UpdateRuntime && UpdateRuntime.CleanUp ) {
		console.log( `Cleaning up application runtime environment...` );
		await UpdateRuntime.CleanUp();
	}
})()
.catch((e)=>{setTimeout(()=>{throw e;})});
