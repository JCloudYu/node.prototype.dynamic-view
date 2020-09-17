#!/usr/bin/env node
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
 *	Version: 3.0.0
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



const DEFAULT_LOADER_PATH = `${__dirname}/.loader.mjs`;
const HOST_SCRIPT_EXT	= ".esm.js";
const DAY_DURATION = 86400 * 1000;

const ROTATE_TIMER_INTERVAL	= 30 * 60;
const DEFAULT_ROTATE_DAYS = 31;
const DEFAULT_KILL_TIMEOUT = 5;
const [, ...VERSION_INFO] = process.version.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
VERSION_INFO[0] = VERSION_INFO[0]|0;
VERSION_INFO[1] = VERSION_INFO[1]|0;
VERSION_INFO[2] = VERSION_INFO[2]|0;
const GREATER_THAN_12_17 = (VERSION_INFO[0]>12 || VERSION_INFO[0]===12&&VERSION_INFO[1]>=17);



const CONFIG = {
	// arguments
	KILL_TIMEOUT: DEFAULT_KILL_TIMEOUT,
	PIPE_OUT: false,
	PIPE_ERR: false,
	ROTATE_LOG: false,
	ROTATE_DAYS: 0,
	BOOT_SCRIPT_PATH: '',
	LOADER_SCRIPT_PATH: __CHECK_SCRIPT(DEFAULT_LOADER_PATH)?DEFAULT_LOADER_PATH:'',
	PIPE_TRUNCATE:false,
	
	// runtime info
	START_TIME: Date.now(),
	NODE_ARGS: [],
	SCRIPT_ARGS: [],
	BOOTSTRAP_FILENAME: '',
	KEEP_ALIVE: false
};

{
	const BASE_SCRIPT_NAME = path.basename(__filename);
	const idx = BASE_SCRIPT_NAME.lastIndexOf('.');
	CONFIG.BOOTSTRAP_FILENAME = (idx > 0) ? BASE_SCRIPT_NAME.substring(0, idx) : BASE_SCRIPT_NAME;
	CONFIG.BOOT_SCRIPT_PATH = `${__dirname}/${CONFIG.BOOTSTRAP_FILENAME}${HOST_SCRIPT_EXT}`;
	
}





const INPUT_ARGS = process.argv.slice(2).reverse();
while( INPUT_ARGS.length > 0 ) {
	const option = INPUT_ARGS.pop();
	const [arg, assign] = __CMD_SPLIT(option);
	switch(arg) {
		case "--node": {
			CONFIG.NODE_ARGS.push(INPUT_ARGS.pop());
			break;
		}
		
		case "--pipe": {
			let file_path = '';
			if ( assign !== "" ) {
				file_path = path.resolve(process.cwd(), assign);
			}
		
			CONFIG.PIPE_ERR = CONFIG.PIPE_OUT = file_path;
			break;
		}
		
		case "--pipe-out": {
			let file_path = '';
			if ( assign !== "" ) {
				file_path = path.resolve(process.cwd(), assign);
			}
			
			CONFIG.PIPE_OUT = file_path;
			break;
		}
		
		case "--pipe-err":{
			let file_path = '';
			if ( assign !== "" ) {
				file_path = path.resolve(process.cwd(), assign);
			}
			
			CONFIG.PIPE_ERR = file_path;
			break;
		}
		
		case "--pipe-truncate": {
			CONFIG.PIPE_TRUNCATE = true;
			break;
		}
		
		case "--rotate-log": {
			CONFIG.ROTATE_DAYS = (assign!=="") ? assign|0 : DEFAULT_ROTATE_DAYS;
			CONFIG.ROTATE_LOG = (CONFIG.ROTATE_DAYS>0);
			break;
		}
		
		case "--kill-timeout": {
			CONFIG.KILL_TIMEOUT = assign|0;
			if ( CONFIG.KILL_TIMEOUT < 0 ) {
				CONFIG.KILL_TIMEOUT = 0;
			}
			break;
		}
		
		case "--boot-script":
		case "--script": {
			if ( assign === "" ) {
				console.error("path is required for --boot-script option");
				console.error("Usage: --boot-script={FILE_PATH}");
				process.exit(1);
				break;
			}
			
			const BASE_SCRIPT_NAME = path.basename(CONFIG.BOOT_SCRIPT_PATH=path.resolve(process.cwd(), assign));
			const idx = BASE_SCRIPT_NAME.lastIndexOf('.');
			CONFIG.BOOTSTRAP_FILENAME = (idx > 0) ? BASE_SCRIPT_NAME.substring(0, idx) : BASE_SCRIPT_NAME;
			break;
		}
		
		case "--keep-alive": {
			CONFIG.KEEP_ALIVE = true;
			break;
		}
		
		case "--loader": {
			if ( assign === "" ) {
				console.error("path is required for --loader option");
				console.error("Usage: --loader={FILE_PATH}");
				process.exit(1);
				break;
			}
			
			CONFIG.LOADER_SCRIPT_PATH = path.resolve(process.cwd(), assign);
			break;
		}

		default:
			CONFIG.SCRIPT_ARGS.push(option);
			break;
	}
}



class LogStream {
	/** @type {WriteStream} **/
	static #OUT_STREAM = null;
	/** @type {WriteStream} **/
	static #ERR_STREAM = null;
	
	static #STDERR=[];
	static #STDOUT=[];
	
	static stderr(chunk) {
		this.#STDERR.push(chunk);
		if ( !this.#ERR_STREAM ) return;
		
		
		const chunks = this.#STDERR.reverse();
		while(chunks.length > 0) {
			const _chunk = chunks.pop()
			this.#ERR_STREAM.write(_chunk);
		}
	}
	static stdout(chunk) {
		this.#STDOUT.push(chunk);
		if ( !this.#OUT_STREAM ) return;
		
		
		const chunks = this.#STDOUT.reverse();
		while(chunks.length > 0) {
			const _chunk = chunks.pop()
			this.#OUT_STREAM.write(_chunk);
		}
	}
	static async rotate(out_path, err_path) {
		const now = new Date();
		const year	= now.getFullYear();
		const month	= now.getMonth();
		const date	= now.getDate();
		
		
		
		const postfix = `${year}${(month<10?'0':'') + month}${(date<10?'0':'') + date}`;
		const promises = [];
		
		
		
		if ( this.#OUT_STREAM ) {
			const stream = this.#OUT_STREAM;
			this.#OUT_STREAM = null;
			
			const from = out_path;
			const to = `${out_path}.${postfix}`;
			
			promises.push(__END_STREAM(stream).then(()=>__FILE_MOVE(from, to)));
		}
		
		
		
		if ( this.#ERR_STREAM ) {
			const stream = this.#ERR_STREAM;
			this.#ERR_STREAM = null;
			
			
			if ( out_path !== err_path ) {
				const from = err_path;
				const to = `${err_path}.${postfix}`;
				
				promises.push(__END_STREAM(stream).then(()=>__FILE_MOVE(from, to)));
			}
		}
		
		await Promise.all(promises);
		
		
		
		
		
		
		const flags = CONFIG.PIPE_TRUNCATE?'w':'a';
		if ( out_path === err_path ) {
			this.#OUT_STREAM = this.#ERR_STREAM = fs.createWriteStream(out_path, {flags});
		}
		else {
			if ( out_path ) {
				this.#OUT_STREAM = fs.createWriteStream(out_path, {flags});
			}
			
			if ( err_path ) {
				this.#ERR_STREAM = fs.createWriteStream(err_path, {flags});
			}
		}
	}
}



// region [ Prepare runtime environment ]
if ( CONFIG.PIPE_ERR === '' && CONFIG.PIPE_OUT === '' ) {
	CONFIG.PIPE_ERR = CONFIG.PIPE_OUT = `${__dirname}/${CONFIG.BOOTSTRAP_FILENAME}.log`;
}
else
if ( CONFIG.PIPE_ERR === '' ) {
	CONFIG.PIPE_ERR = `${__dirname}/${CONFIG.BOOTSTRAP_FILENAME}.err.log`
}
else
if ( CONFIG.PIPE_OUT === '' ) {
	CONFIG.PIPE_OUT = `${__dirname}/${CONFIG.BOOTSTRAP_FILENAME}.out.log`
}



if ( CONFIG.PIPE_ERR || CONFIG.PIPE_OUT ) {
	LogStream.rotate(CONFIG.PIPE_OUT, CONFIG.PIPE_ERR).then(()=>{
		if ( CONFIG.ROTATE_LOG ) {
			setTimeout(___TIMEOUT, ROTATE_TIMER_INTERVAL * 1000);
		}
	}).catch((e)=>console.error(e));
}

const SPAWN_ARGS = [ ...CONFIG.NODE_ARGS ];
if ( !GREATER_THAN_12_17 ) {
	SPAWN_ARGS.push('--experimental-modules');
}
else {
	SPAWN_ARGS.push('--experimental-wasm-modules');
}

if ( CONFIG.LOADER_SCRIPT_PATH ) {
	if ( !GREATER_THAN_12_17 ) {
		SPAWN_ARGS.push('--loader');
	}
	else {
		SPAWN_ARGS.push('--experimental-loader');
	}
	
	
	
	SPAWN_ARGS.push(`file://${CONFIG.LOADER_SCRIPT_PATH}`);
}
SPAWN_ARGS.push(CONFIG.BOOT_SCRIPT_PATH);
SPAWN_ARGS.push(...CONFIG.SCRIPT_ARGS);
// endregion





// region [ Create child process and bind termination handler ]
let CHILD_PROC = SPAWN_CHILD();
// endregion

// region [ Bind incoming signal events ]
process
.on( 'PROCESS_EXITED', (child)=>{
	if ( CONFIG.KEEP_ALIVE === false || process.exiting || child.code === 0 ) {
		process.exit(0);
		return;
	}
	
	CHILD_PROC = SPAWN_CHILD();
})
.on( 'SIGTERM', __TRIGGER_TERMINATE_SIGNAL )
.on( 'SIGINT', __TRIGGER_TERMINATE_SIGNAL )
.on( 'SIGHUP', __TRIGGER_TERMINATE_SIGNAL )
.once( 'TERMINATE_SIGNAL', __RECEIVE_TERMINATE_SIGNAL );
// endregion






// region [ Helper functions ]
function SPAWN_CHILD() {
	const sub_process = require('child_process').spawn(
		process.execPath, SPAWN_ARGS,
		{
			cwd: process.cwd(),
			env: process.env,
			stdio: ['inherit', 'pipe', 'pipe']
		}
	);
	sub_process._kill_timeout = null;
	sub_process.on( 'exit', (code, signal)=>{
		sub_process.exited_state = {code, signal};
		process.emit('PROCESS_EXITED', sub_process);
	});
	sub_process.stdout.on('data', (chunk)=>{
		if ( CONFIG.PIPE_OUT ) {
			LogStream.stdout(chunk);
		}
		
		process.stdout.write(chunk);
	});
	sub_process.stderr.on('data', (chunk)=>{
		if ( CONFIG.PIPE_ERR ) {
			LogStream.stderr(chunk);
		}
		
		process.stderr.write(chunk);
	});
	return sub_process;
}

function __CMD_SPLIT(option) {
	option = ('' + (option||'')).trim();

	const index = option.indexOf('=');
	return index>0?[
		option.substring(0, index), option.substring(index+1)
	]:[option, ""];
}
function ___TIMEOUT() {
	return Promise.resolve().then(()=>{
		const count = Math.floor((Date.now() - CONFIG.START_TIME)/DAY_DURATION) + 1;
		if ( count % CONFIG.ROTATE_DAYS === 0 ) {
			return LogStream.rotate(CONFIG.PIPE_OUT, CONFIG.PIPE_ERR);
		}
	}).then(()=>setTimeout(___TIMEOUT, ROTATE_TIMER_INTERVAL * 1000));
}
function __TRIGGER_TERMINATE_SIGNAL(...args) {
	process.emit( 'TERMINATE_SIGNAL', ...args );
}
function __RECEIVE_TERMINATE_SIGNAL() {
	process.exiting = true;
	CHILD_PROC._kill_timeout = setTimeout(()=>{
		if ( CHILD_PROC.exited_state ) return;
		CHILD_PROC.kill( 'SIGKILL' );
	}, CONFIG.KILL_TIMEOUT * 1000);

	CHILD_PROC.kill( 'SIGTERM' );
}
function __FILE_MOVE(from, to) {
	return new Promise((resolve, reject)=>{
		fs.rename(from, to, (err)=>{
			return err?reject(err):resolve();
		});
	});
}
function __END_STREAM(stream) {
	return new Promise((resolve, reject)=>{
		stream.end((err)=>{
			return err?reject(err):resolve();
		});
	});
}
function __CHECK_SCRIPT(path) {
	try {
		fs.accessSync(path, fs.constants.R_OK);
		return fs.statSync(path).isFile();
	}
	catch(e) {
		if ( e.code !== "ENOENT" ) throw e;
		return false;
	}
}
// endregion
