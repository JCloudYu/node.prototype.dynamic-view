import "extes";
import "/kernel/logger.esm.js";

import os_module from "os";
import {ColorCode} from "/kernel/terminal-ctrl.esm.js";



// Force making os module global
/** @global {module:os} **/
const os = os_module; global.os = os;



process
.on( 'unhandledRejection', (rej)=>{
	logger.error( `${ColorCode.LIGHT_RED}Receiving unhandled rejection! Exiting...${ColorCode.RESET}` );
	console.error(rej);
	process.exit(1);
})
.on( 'uncaughtException', (e)=>{
	logger.error(`${ColorCode.LIGHT_RED}Receiving uncaught exception! Exiting...${ColorCode.RESET}`);
	console.error(e);
	process.exit(1);
})
.on( 'SIGINT', (...args)=>{
	process.emit( 'SIGNAL_INTERRUPTION', ...args );
})
.on( 'SIGTERM', (...args)=>{
	process.emit( 'SIGNAL_TERMINATION', ...args );
});



const DEFAULT_BOOT_MAP = {
	version: "/kernel/boot-scripts/version.esm.js",
	update: "/kernel/boot-scripts/update.esm.js"
};

(async()=>{
	// INFO: Idle everything to hoist warning verbose
	await setTimeout.idle(100);
	
	// INFO: Decide boot script
	const [,, boot_cmd=''] = process.argv;
	
	// INFO: Collect information about current runtime environment
	console.error( `${ColorCode.DARK_GRAY}Obtaining kernel info...${ColorCode.RESET}` );
	const ProjectInfo = await import('/kernel-info.esm.js').then(async({Init, ProjectInfo})=>{await Init(); return ProjectInfo;});
	
	// INFO: Load environmental configurations
	console.error( `${ColorCode.DARK_GRAY}Loading configurations...${ColorCode.RESET}` );
	await import( "/kernel/config.esm.js" ).then(({Init})=>Init());
	
	// INFO: Load environmental configurations
	console.error( `${ColorCode.DARK_GRAY}Loading configurations...${ColorCode.RESET}` );
	await import( "/kernel/runtime.esm.js" ).then(({Init})=>Init());
	
	
	// INFO: Expose modules as global variables
	const global_map = Object.assign({}, ProjectInfo.expose_global||{});
	for(const [var_name, module_path] of Object.entries(global_map)) {
		if ( module_path === "os" && var_name === "os" ) continue;
	
		const {default:module} = await import(module_path);
		if (module !== undefined) {
			global[var_name] = module;
		}
	}
	
	
	// INFO: Detect boot script
	const boot_map = Object.assign({main:"/index.esm.js"}, ProjectInfo.kernel_script_map||{}, DEFAULT_BOOT_MAP);
	const command = boot_cmd||'main';
	const boot_script = boot_map[command];
	if ( !boot_script ) {
		console.error( `${ColorCode.RED}Invalid command \`${command}\`!${ColorCode.RESET}` );
		process.exit(1);
		return;
	}
	
	await import(boot_script);
})()
.catch((e)=>{
	// NOTE: Force to cast unexpectedly rejected promises into exceptions
	setTimeout(()=>{throw e;});
});

