import "extes";
import ColorCode from "/kernel/term-code.js";

const DEFAULT_BOOT_MAP = {
	version: "/kernel/boot-scripts/version.esm.js",
	update: "/kernel/boot-scripts/update.esm.js",
	run: "/kernel/boot-scripts/run-script.esm.js"
};
const CLEANUP_QUEUE = [];
const N=()=>{};
const ERR=(e)=>{
	console.error(`${ColorCode.LIGHT_RED}Receiving unhandled errors! Exiting...${ColorCode.RESET}\n`, e);
	process.exit(1);
};



process
.once('cleanup', async()=>{
	for(const cleanup_callback of CLEANUP_QUEUE) {
		await Promise.resolve(cleanup_callback()).catch((e)=>console.error(e));
	}
})
.on('unhandledRejection',ERR).on('uncaughtException',ERR)
.on('SIGINT',N).on('SIGTERM',N);



/**
 * @typedef {String[]} NodeJS.Process.exec_args
**/

(async()=>{
	// INFO: Idle everything to hoist warning verbose
	await setTimeout.idle(100);
	
	const [boot_cmd='', ..._argv] = process.argv.slice(2);
	process.exec_args = _argv;
	
	
	// Collect information about current runtime environment
	console.error( `${ColorCode.DARK_GRAY}Obtaining kernel info...${ColorCode.RESET}` );
	const ProjectInfo = await import('/kernel-info.esm.js').then(async({Init, _ProjectInfo})=>{await Init(); return _ProjectInfo;});
	
	// Load environmental configurations
	console.error( `${ColorCode.DARK_GRAY}Loading configurations...${ColorCode.RESET}` );
	await import( "/kernel/config.esm.js" ).then(({Init})=>Init());
	
	// Load environmental configurations
	console.error( `${ColorCode.DARK_GRAY}Loading configurations...${ColorCode.RESET}` );
	await import( "/kernel/runtime.esm.js" ).then(({Init})=>Init());
	
	// Expose modules as global variables
	const global_map = Object.assign({}, ProjectInfo.expose_global||{});
	for(const [var_name, module_path] of Object.entries(global_map)) {
		if ( module_path === "os" && var_name === "os" ) continue;
	
		const {default:module} = await import(module_path);
		if (module !== undefined) {
			global[var_name] = module;
		}
	}
	
	// Initialize dynamic contents
	console.error( `${ColorCode.DARK_GRAY}Loading configurations...${ColorCode.RESET}` );
	await import( "/boot-init.esm.js" ).then(({Init})=>Init?Init():null).catch(()=>{});
	
	// Detect boot script
	const boot_map = Object.assign({main:"/index.esm.js"}, ProjectInfo.kernel_script_map||{}, DEFAULT_BOOT_MAP);
	const command = boot_cmd||'main';
	const boot_script = boot_map[command];
	if ( !boot_script ) {
		console.error( `${ColorCode.RED}Invalid command \`${command}\`!${ColorCode.RESET}` );
		process.exit(1);
		return;
	}
	
	await import(boot_script);
	
	
	// Make sure the cleanup call is registered as later as possible
	process.on('SIGTERM', ()=>process.emit('cleanup'));
})().catch(ERR);

