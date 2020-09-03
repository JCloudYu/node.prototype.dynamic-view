import "extes";
import ColorCode from "/kernel/term-code.js";

const N=()=>{};



process
.on('unhandledRejection',(rej)=>{
	console.error( `${ColorCode.LIGHT_RED}Receiving unhandled rejection! Exiting...${ColorCode.RESET}\n`, rej);
	process.exit(1);
})
.on('uncaughtException',(e)=>{
	console.error(`${ColorCode.LIGHT_RED}Receiving uncaught exception! Exiting...${ColorCode.RESET}\n`, e);
	process.exit(1);
})
.on('SIGINT',N).on('SIGTERM',N);



const DEFAULT_BOOT_MAP = {
	version: "/kernel/boot-scripts/version.esm.js",
	update: "/kernel/boot-scripts/update.esm.js",
	run: "/kernel/boot-scripts/run-script.esm.js"
};

(async()=>{
	// INFO: Idle everything to hoist warning verbose
	await setTimeout.idle(100);
	
	// INFO: Decide boot script
	const [boot_cmd='', ..._argv] = process.argv.slice(2);
	process._argv = _argv;
	
	
	// INFO: Collect information about current runtime environment
	console.error( `${ColorCode.DARK_GRAY}Obtaining kernel info...${ColorCode.RESET}` );
	const ProjectInfo = await import('/kernel-info.esm.js').then(async({Init, _ProjectInfo})=>{await Init(); return _ProjectInfo;});
	
	// INFO: Load environmental configurations
	console.error( `${ColorCode.DARK_GRAY}Loading configurations...${ColorCode.RESET}` );
	await import( "/kernel/config.esm.js" ).then(({Init})=>Init());
	
	// INFO: Load environmental configurations
	console.error( `${ColorCode.DARK_GRAY}Loading configurations...${ColorCode.RESET}` );
	await import( "/kernel/runtime.esm.js" ).then(({Init})=>Init());
	
	// INFO: Initialize remaining contents
	console.error( `${ColorCode.DARK_GRAY}Loading configurations...${ColorCode.RESET}` );
	await import( "/boot-init.esm.js" ).then(({Init})=>Init?Init():null).catch(()=>{});
	
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

