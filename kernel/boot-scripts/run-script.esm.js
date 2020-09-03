/**
 *	Author: JCloudYu
 *	Create: 2019/05/27
**/
import path from "path";
import {CheckDataSystemVersion} from "/kernel.esm.js";

(async()=>{
	if ( !CheckDataSystemVersion() ) return;
	
	console.log( "Initializing application..." );
	// Initialize and boot system here...
	
	const argv = process._argv.slice(0).reverse();
	const script = argv.pop();
	const script_path = path.resolve(process.cwd(), script);
	
	await import('file://' + script_path);
	
	
	if (process.listenerCount('SIGTERM') <= 1) {
		process
		.on( 'SIGTERM', async()=>{
			console.log( `Exiting...` );
			setTimeout(()=>process.exit(1));
		});
	}
})();
