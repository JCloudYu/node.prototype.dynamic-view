/**
 *	Author: JCloudYu
 *	Create: 2019/05/27
**/
import path from "path";
import {CheckDataSystemVersion} from "/kernel.esm.js";

const ERR=(e)=>{
	console.error("Receiving unhandled errors! Exiting...\n", e);
	process.exit(1);
};

(async()=>{
	if ( !CheckDataSystemVersion() ) return;
	
	console.log( "Initializing application..." );
	// Initialize and boot system here...
	
	const argv = process.exec_args.slice(0).reverse();
	const script = argv.pop();
	const script_path = path.resolve(process.cwd(), script);
	
	await import('file://' + script_path);
	
	
	if (process.listenerCount('SIGTERM')<=2) {
		process.on('SIGTERM',()=>{
			console.log( `Exiting...` );
			setTimeout(()=>process.exit(1));
		});
	}
})().catch(ERR);
