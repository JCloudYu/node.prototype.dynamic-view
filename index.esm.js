/**
 *	Author: JCloudYu
 *	Create: 2019/05/27
**/
import {CheckDataSystemVersion} from "/kernel.esm.js";

(async()=>{
	if ( !CheckDataSystemVersion() ) return;
	
	console.log( "Initializing application..." );
	// Initialize and boot system here...
	
	
	
	process
	.on( 'SIGTERM', async()=>{
		console.log( `Exiting...` );
		setTimeout(()=>process.exit(1));
	});
})().catch((e)=>setTimeout(()=>{throw e}));
