/**
 *	Author: JCloudYu
 *	Create: 2020/02/27
**/
import {WorkingRoot, CheckDataSystemVersion, RuntimeDir} from "/kernel.esm.js";



(async()=>{
	// INFO: Prevent script from running when data version and program version are incompatible to each other
	if ( !CheckDataSystemVersion() ) return;
	
	// INFO: Initialize runtime here...
	
	
	
	
	
	
	// INFO: Do script content here...
	console.log( `Tool ${import.meta.url} initialized...` );
	console.log( `Runtime Dir: ${RuntimeDir}` );
	console.log( `Working Root: ${WorkingRoot}` );
	console.log( `Starting regular timer...` );
	
	let prev = 0;
	const timer = setInterval.create();
	timer(()=>{
		const now = new Date();
		if ( (now.getTime() - prev) < 1000 ) return;
		prev = now.getTime();
		
		
		console.log( "NOW: " + now.toLocaleISOString() );
	}, 500);
	
	
	
	
	process
	.on( 'SIGTERM', async()=>{
		// INFO: Cleanup runtime here...
		console.log( `Cleaning up regular timer...` );
		timer.clear();
		
		console.log( `Exiting...` );
		setTimeout(()=>process.exit(1));
	});
	
	
})().catch((e)=>{setTimeout(()=>{throw e;})});
