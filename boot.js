/**
 *	ISC License
 *
 *	Copyright (c) 2019, J. Cloud Yu
 *
 *	Permission to use, copy, modify, and/or distribute this software for any
 *	purpose with or without fee is hereby granted, provided that the above
 *	copyright notice and this permission notice appear in all copies.
 *
 *	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 *	WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 *	MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 *	ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 *	WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 *	ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 *	OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
**/

/**
 *	Version: 1.1.0
 *	Author: JCloudYu
 *	Update: 2020/07/26
 *	Create: 2019/07/12
 *
 * 	This script is a bootstrap script that runs the script that contains exactly
 * 	the same prefix but ended with .esm.js in es module mode with corresponding
 * 	environmental configurations such as es loader hook described in the
 * 	following URL.
 *		https://nodejs.org/api/esm.html#esm_experimental_loader_hooks
 *
 *	This script will receive the SIGINT, SIGTERM and SIGHUP signals and
 *	pass SIGTERM event to its child process. After the SIGTERM is signalled,
 *	the child process will have 10 seconds to perform clean up logic before
 *	being forced to be killed!
**/
// Source: https://gist.github.com/JCloudYu/db18d225aa8dbe363b85dfd1077488ed



const path = require( 'path' );
const fs = require('fs');



let _boot_script_name;
// region [ Decide boot script name ]
{
	const BASE_SCRIPT_NAME = path.basename(__filename);
	_boot_script_name = BASE_SCRIPT_NAME.substring(0, BASE_SCRIPT_NAME.length-3);
}
// endregion


const HOST_SCRIPT_EXT	= ".esm.js";
const BOOT_SCRIPT_NAME	= `${_boot_script_name}${HOST_SCRIPT_EXT}`;
const KILL_TIMEOUT		= 10 * 1000;
const CONFIG = {
	NODE_ARGS: [],
	SCRIPT_ARGS: [],
	PIPE_OUT: null,
	PIPE_ERR: null
};
const INPUT_ARGS = process.argv.slice(2).reverse();
while( INPUT_ARGS.length > 0 ) {
	const arg = INPUT_ARGS.pop();
	switch(arg) {
		case "--node": {
			CONFIG.NODE_ARGS.push(INPUT_ARGS.pop());
			break;
		}
		
		case "--pipe": {
			const file_path = INPUT_ARGS.pop();
			CONFIG.PIPE_ERR = CONFIG.PIPE_OUT = path.resolve(process.cwd(), file_path);
			break;
		}
		
		case "--pipe-out": {
			const file_path = INPUT_ARGS.pop();
			CONFIG.PIPE_OUT = path.resolve(process.cwd(), file_path);
			break;
		}
		
		case "--pipe-err":{
			const file_path = INPUT_ARGS.pop();
			CONFIG.PIPE_ERR = path.resolve(process.cwd(), file_path);
			break;
		}
		
		default:
			CONFIG.SCRIPT_ARGS.push(arg);
			break;
	}
}




// region [ Create child process and bind termination handler ]
if ( CONFIG.PIPE_ERR || CONFIG.PIPE_OUT ) {
	if ( CONFIG.PIPE_OUT === CONFIG.PIPE_ERR ) {
		CONFIG.PIPE_OUT = CONFIG.PIPE_ERR = fs.createWriteStream(CONFIG.PIPE_OUT);
	}
	else {
		if ( CONFIG.PIPE_OUT ) {
			CONFIG.PIPE_OUT = fs.createWriteStream(CONFIG.PIPE_OUT);
		}
		
		if ( CONFIG.PIPE_ERR ) {
			CONFIG.PIPE_ERR = fs.createWriteStream(CONFIG.PIPE_ERR);
		}
	}
}

const CHILD_PROC = require('child_process').spawn(
	process.execPath, [
		...CONFIG.NODE_ARGS,
	
		// NOTE: Tell the child NodeJS env to run in es module mode
		'--experimental-modules',
		
		/*	NOTE: Load the es module loader!
			You can download the sample loader script at the following location!
				https://gist.github.com/JCloudYu/87b4a5caff65320557452167e3466dbb
		*/
		/*	NOTE: Convert the module path to the fileURI based absolute path
			to prevent module not found issue in Windows Platform!
			( NodeJS cannot resolve Windows-styled absolute path such as C:/
			  or Z:/ correctly when locating the loader module... )
		 */
		'--loader', `file://${__dirname}/.loader.mjs`,
		
		// NOTE: Assign the boot script and spread the remaining arguments
		`${__dirname}/${BOOT_SCRIPT_NAME}`,
		...CONFIG.SCRIPT_ARGS
	],
	{
		cwd: process.cwd(),
		env: process.env,
		stdio: ['inherit', 'pipe', 'pipe']
	}
);
CHILD_PROC._kill_timeout = null;
CHILD_PROC.on( 'exit', (code)=>{
	if ( CHILD_PROC._kill_timeout ) {
		clearTimeout(CHILD_PROC._kill_timeout);
		CHILD_PROC._kill_timeout = null;
	}
	
	process.exit((code === null) ? 1 : code);
});
CHILD_PROC.stdout.on('data', (chunk)=>{
	if ( CONFIG.PIPE_OUT ) {
		CONFIG.PIPE_OUT.write(chunk);
	}
	
	process.stdout.write(chunk);
});
CHILD_PROC.stderr.on('data', (chunk)=>{
	if ( CONFIG.PIPE_ERR ) {
		CONFIG.PIPE_ERR.write(chunk);
	}
	
	process.stderr.write(chunk);
});
// endregion

// region [ Bind incoming signal events ]
process
.on( 'SIGTERM', __TRIGGER_TERMINATE_SIGNAL )
.on( 'SIGINT', __TRIGGER_TERMINATE_SIGNAL )
.on( 'SIGHUP', __TRIGGER_TERMINATE_SIGNAL )
.once( 'TERMINATE_SIGNAL', __RECEIVE_TERMINATE_SIGNAL );
// endregion






// region [ Helper functions ]
function __TRIGGER_TERMINATE_SIGNAL(...args) {
	process.emit( 'TERMINATE_SIGNAL', ...args );
}
function __RECEIVE_TERMINATE_SIGNAL() {
	CHILD_PROC._kill_timeout = setTimeout(()=>{
		CHILD_PROC.kill( 'SIGKILL' );
	}, KILL_TIMEOUT);

	CHILD_PROC.kill( 'SIGTERM' );
}
// endregion
