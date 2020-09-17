/**
 *	Author: JCloudYu
 *	Create: 2020/03/20
**/
import fs from "fs";
import path from "path";
import os from "os";

import {Config, WorkingRoot} from "/kernel.esm.js";
import {HTTPRequestRejectError} from "/kernel/error.esm.js";

import {MIME_MAP} from "/lib/mime-map.esm.js";
import {WriteFile} from "/lib/stream-helper.esm.js";
import {BaseError} from "/lib/error/base-error.esm.js";

const FILE_URL_PREFIX = (os.platform().substring(0, 3).lowerCase === "win") ? "file:///" : "file://";
const DOCUMENT_ROOT = path.resolve(WorkingRoot, Config.server.document_root);
const VIEW_SCRIPT_EXT = Config.server.script_ext.map((item)=>(item[0]==='.'?item:('.'+item)));
const RESTRICTED_EXT = Config.server.restricted_ext.map((item)=>(item[0]==='.'?item:('.'+item)));



export function Init() {}
export function CleanUp() {}
export async function Handle(req, res) {
	const {url} = req.info;
	url.path = NormalizePath(url.path);
	
	
	
	let type, requested_res_path = path.resolve(DOCUMENT_ROOT, url.path.substring(1));
	type = await FileType(requested_res_path);
	if ( type < 0 ) {
		requested_res_path += "/index.html";
	}
	
	
	
	if ( MatchExtension(requested_res_path, RESTRICTED_EXT) >= 0 ) {
		throw new HTTPRequestRejectError(BaseError.FORBIDDEN_ACCESS);
	}
	
	type = await FileType(requested_res_path);
	if ( type > 0 ) {
		if ( MatchExtension(requested_res_path, VIEW_SCRIPT_EXT) < 0 ) {
			// NOTE: Detect MIME and respond with corresponding mime type
			const period_pos = requested_res_path.lastIndexOf('.');
			const ext = ((period_pos > 0) ? requested_res_path.substring(period_pos) : '').lowerCase;
		
			const contentType = MIME_MAP[ext.substring(1)] || 'application/octet-stream';
			const headers = {'Content-Type': contentType};
			await WriteFile(res, requested_res_path, headers, 200);
			return;
		}
	}
	
	
	
	return HandleDynamicView(req, res);
}



async function HandleDynamicView(req, res) {
	const {url:{path:target_url}} = req.info;
	
	let matched_path = null, matched_path_dir = '', remained_path = '', candidate_base = target_url;
	while(candidate_base !== "") {
		const [left_over, comp] = candidate_base.pull('/', false);
		candidate_base = left_over;
		
		const candidates = [comp, '/index'];
		

		
		// Search for scripts
		for ( let index=0; index<candidates.length; index++ ) {
			const candidate = candidates[index];
			if ( candidate === "/" || "" )  continue;
			
			for(const candidate_ext of VIEW_SCRIPT_EXT) {
				const candidate_path = candidate_base + candidate + candidate_ext;
				const test_path = DOCUMENT_ROOT + candidate_path;
			
				if ( MatchExtension(candidate_path, RESTRICTED_EXT) >= 0 ) {
					throw new HTTPRequestRejectError(BaseError.FORBIDDEN_ACCESS);
				}
				
				
				
				try {
					const type = await FileType(test_path);
					if ( type <= 0 ) continue;
					
					matched_path = DOCUMENT_ROOT + candidate_path;
					matched_path_dir = DOCUMENT_ROOT + candidate_base;
	
	
					if ( index > 0 ) {
						remained_path = candidates[0] + remained_path;
					}
					break;
					
				}
				catch(e) {
					continue;
				}
			}
			
			if ( matched_path ) break;
		}
		
		if ( matched_path ) break;
		
		
		
		remained_path = comp + remained_path;
	}
	
	if ( !matched_path ) {
		throw new HTTPRequestRejectError(BaseError.RESOURCE_NOT_FOUND);
	}
	
	req.info.url.path		 = remained_path;
	req.info.url.script_path = matched_path;
	req.info.url.script_dir	 = matched_path_dir;
	
	
	const {default:handler} = await import(FILE_URL_PREFIX + matched_path);
	if ( typeof handler !== "function" ) {
		throw new HTTPRequestRejectError(BaseError.UNEXPECTED_SERVER_ERROR);
	}
	
	return handler(req, res);
}



function NormalizePath(path) {
	return PurgeRelativePath(decodeURIComponent(path));
}
function FileType(path) {
	return new Promise((resolve, reject)=>{
		fs.stat(path, (err, stat)=>{
			if (err) {
				resolve(0);
				return;
			}
			
			return resolve(stat.isFile() ? 1 : -1);
		})
	});
}
function MatchExtension(item, list) {
	for(let i=0; i<list.length; i++) {
		const list_item = list[i];
		if ( item.substring(item.length - list_item.length) === list_item ) {
			return i;
		}
	}
	
	return -1;
}
function PurgeRelativePath(path_part) {
	if ( path_part[0] !== "/" ) path_part = '/' + path_part;
	
	
	const path_comp = path_part.substring(1).split('/');
	const new_path = [];
	for( const comp of path_comp ) {
		if ( comp === "." ) continue;
		if ( comp === ".." ) {
			new_path.splice(new_path.length-1, 1);
			continue;
		}
		new_path.push(comp);
	}
	
	return `/${new_path.join('/')}`;
}
