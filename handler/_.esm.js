/**
 *	Author: JCloudYu
 *	Create: 2019/07/16
**/
import {HTTPRequestRejectError, SystemError} from "/kernel/error.esm.js";
import {BaseError} from "/lib/error/base-error.esm.js";

import {
	Init as InitDynamicViewEnvironment,
	CleanUp as CleanUpDynamicViewEnvironment,
	Handle as HandleDynamicViewRequest
} from "./dispatcher.esm.js";




export function Init() {
	return InitDynamicViewEnvironment();
}
export function CleanUp() {
	return CleanUpDynamicViewEnvironment();
}
export function HandleSystemError(req, res, error) {
	if ( error instanceof Error ) {
		if ( error instanceof SystemError ) {
			let error_detail = JSON.stringify(error, null, 4).replace(/\r\n/g, '\n').split('\n');
			error_detail = error_detail.map((item, idx)=>(idx===0?item:`${' '.repeat(4)}${item}`)).join('\n');
		
			let error_stack = error.stack.trim().replace(/\r/g, '\n').split('\n');
			error_stack = error_stack.map((item, idx)=>(idx===0?'':`${' '.repeat(8)}${item.trim().substring(3)}`)).join('\n');
			
			console.error(
				'Unexpected system error has occurred!\n' +
				`    Error: ${error.message}\n` +
				`    Detail: ${error_detail}\n` +
				`    Stack: {${error_stack}\n${' '.repeat(4)}}`
			);
		
			error = new HTTPRequestRejectError(BaseError.UNEXPECTED_SERVER_ERROR);
		}
		else
		if ( !(error instanceof HTTPRequestRejectError) ) {
			let error_stack = error.stack.trim().replace(/\r/g, '\n').split('\n');
			error_stack = error_stack.map((item, idx)=>(idx===0?'':`${' '.repeat(8)}${item.trim().substring(3)}`)).join('\n');
		
			console.error(
				`Unhandled rejection is received!\n` +
				`    Error: ${error.message}\n` +
				`    Stack: {${error_stack}\n${' '.repeat(4)}}`
			);
			
			error = new HTTPRequestRejectError(BaseError.UNEXPECTED_SERVER_ERROR, {
				message: error.message,
				stack: error.stack.split('\n')
			});
		}
	}
	else {
		console.error( `Unknown error is received!`, error );
		error = new HTTPRequestRejectError(BaseError.UNEXPECTED_SERVER_ERROR, error);
	}
	
	
	
	if ( res.writableFinished||res.finished ) return;
	
	const headers = Object.assign({}, error.headers||{}, {"Content-Type":"text/html"});
	res.writeHead(error.httpStatus, headers);
	res.write(''+
`<!DOCTYPE html>
<html lang="en-US">
	<head>
		<meta charset="UTF-8" /><title>Error Page</title>
		<style>
			html{font-size:16px;}
			body{
				position:relative; width:100vw; height:100vh; margin:0; padding:0;
				display:flex; justify-content:center; align-items:center;
				font-family:Arial;
			}
		</style>
	</head>
	<body>
		<div class='viewport' style='text-align:center;'>
			<div><img style='width:300px; height:300px;' src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCI+DQoJPHRpdGxlPg0KCQllcnJvcg0KCTwvdGl0bGU+DQoJPHBhdGggZmlsbD0iI2QzMyIgZD0iTTEzLjcyOCAxSDYuMjcyTDEgNi4yNzJ2Ny40NTZMNi4yNzIgMTloNy40NTZMMTkgMTMuNzI4VjYuMjcyek0xMSAxNUg5di0yaDJ6bTAtNEg5VjVoMnoiLz4NCjwvc3ZnPg==" /></div>
			<div style='font-size:2rem;color:#F00; margin-bottom:1rem;'>${error.status}</div>
			<div style='font-size:1.2rem; width:250px; margin:0 auto;'>${error.message}</div>
		</div>
		<script>(()=>{console.error(${JSON.stringify(error)})})();</script>
	</body>
</html>`);
}
export const Handle = Function.sequential.async([
	function(req, res) {
		req.session = {};
		req.meta = {};
		
		Object.defineProperty(req.info, 'cookies', {value:ParseHTTPCookies(req.headers.cookie||''), enumerable:true});
	},
	HandleDynamicViewRequest
]);


function ParseHTTPCookies(rawCookies) {
	rawCookies = rawCookies.trim();
	
	const incoming_cookies = {};
	const cookies = rawCookies.split(';');
	for( const raw_cookie of cookies ) {
		let cookie = raw_cookie.trim();
		if ( !cookie ) continue;
		
		const _splitter = cookie.indexOf( '=' );
		if ( _splitter < 0 ) continue;
		
		
		
		const name = cookie.substring(0, _splitter);
		incoming_cookies[name] = cookie.substring(_splitter+1);
	}
	
	return incoming_cookies;
}
