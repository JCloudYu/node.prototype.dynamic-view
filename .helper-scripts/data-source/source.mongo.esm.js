/**
 *	Author: JCloudYu
 *	Create: 2020/06/01
**/
import mongodb from "mongodb";

const {MongoClient} = mongodb;
const DBInfo = { conn: null, db: null };


const IModule = Object.freeze({
	get db() {
		return this.is_connected?DBInfo.db:null
	},
	get is_connected() {
		return DBInfo.conn ? DBInfo.conn.isConnected : false;
	}
})
export default IModule;
export async function Init(source_info) {
	const conn = DBInfo.conn = await MongoClient.connect(`mongodb://${source_info.host}:${source_info.port}`, {
		useNewUrlParser:true, useUnifiedTopology:true
	});
	
	DBInfo.db = conn.db(source_info.database);
}
export async function CleanUp() {
	if ( !IModule.is_connected ) return;
	
	const {conn} = DBInfo;
	DBInfo.db = null;
	DBInfo.conn = null;
	await conn.close();
}
