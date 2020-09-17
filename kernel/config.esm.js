/**
 *	Author: JCloudYu
 *	Create: 2019/05/27
**/
export const _Config = Object.create(null);

export async function Init() {
	// NOTE: Load default configurations
	const {default:CONFIG} = await import( "/config.default.esm.js" );
	Object.merge(_Config, CONFIG);
	
	// NOTE: Load customized configurations in project root
	let es_config_loaded = false;
	try {
		const {default:CUSTOMIZED_CONFIG} = await import( "/config.esm.js" );
		Object.merge(_Config, CUSTOMIZED_CONFIG);
		es_config_loaded = true;
	} catch(e) { if ( e.code !== "ENOENT" && e.code !== "ERR_MODULE_NOT_FOUND" ) throw e; }
	
	if ( !es_config_loaded ) {
		try {
			const {default:CUSTOMIZED_CONFIG} = await import( "/config.js" );
			Object.merge(_Config, CUSTOMIZED_CONFIG);
		} catch(e) { if ( e.code !== "ENOENT" && e.code !== "ERR_MODULE_NOT_FOUND" ) throw e; }
	}
}
