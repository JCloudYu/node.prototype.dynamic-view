/**
 *	Author: JCloudYu
 *	Create: 2020/06/03
**/
const MAX_NUMBER		= 1000000000;
const full_version		= /^([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)$/;
const partial_version	= /^([0-9]|[1-9][0-9]+)(\.([0-9]|[1-9][0-9]+))?$/;

const _PRIVATES = new WeakMap();
export class Version {
	constructor(v) {
		const _Version = Object.create(null);
		if ( v instanceof Version ) {
			Object.assign(_Version, _PRIVATES.get(v));
		}
		else {
			v = ''+v;
			let matches = v.match(partial_version);
			if ( matches ) {
				let [, major,, minor] = matches;
				major = major|0;
				minor = (minor===undefined) ? null : (minor|0);
				if ( major > MAX_NUMBER || minor > MAX_NUMBER ) {
					throw new RangeError(`Each of the version components must not be greater than ${MAX_NUMBER}!`);
				}
				
				_Version.major = major;
				_Version.minor = minor;
				_Version.patch = null;
			}
			else {
				matches = v.match(full_version);
				if ( matches ) {
					let [, major, minor, patch] = matches;
					major = major|0;
					minor = minor|0;
					patch = patch|0;
					
					if ( major >= MAX_NUMBER || minor >= MAX_NUMBER || patch >= MAX_NUMBER ) {
						throw new RangeError(`Each of the version components must not be greater than ${MAX_NUMBER}!`);
					}
				
					_Version.major = major;
					_Version.minor = minor;
					_Version.patch = patch;
				}
			}
		}
		
		_PRIVATES.set(this, _Version);
	}
	compare(ver, _larger=true) {
		ver = Version.parse(ver);
		
		const missing_value = _larger ? MAX_NUMBER : -1;
		const tests = ['major', 'minor', 'patch'];
		for(const digit of tests) {
			let a = this[digit], b = ver[digit];
			
			a = (a===null)?missing_value:a;
			b = (b===null)?missing_value:b;
			
			if ( a > b ) return 1;
			if ( a < b ) return -1;
		}
		
		return 0;
	}
	
	toString() { return this.version_string; }
	get version_string() {
		const {major, minor, patch} = _PRIVATES.get(this);
		return major + (minor===null?'':'.'+minor) + (patch===null?'':'.'+patch);
	}
	get major() {
		return _PRIVATES.get(this).major;
	}
	get minor() {
		return _PRIVATES.get(this).minor;
	}
	get patch() {
		return _PRIVATES.get(this).patch;
	}
	
	
	static from(v) {
		try { return new Version(v); } catch(e) { return null; }
	}
	static parse(v, throw_error=false) {
		try {
			return (v instanceof Version) ? v : new Version(v);
		}
		catch(e) {
			if ( throw_error ) throw e;
			return null;
		}
	}
	static compare(a, b, _larger=true) {
		a = Version.parse(a);
		b = Version.parse(b);
		return a.compare(b, _larger);
	}
}
