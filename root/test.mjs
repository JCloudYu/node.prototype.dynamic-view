/**
 *	Author: JCloudYu
 *	Create: 2020/01/30
**/

import {Beson} from "beson/beson.esm.js";
import {Base64URLEncode} from "jsboost/base64.esm.js";
import {BuildTemplate} from "/lib/tiny-tmpl.esm.js";

const content = BuildTemplate(String.stringTemplate`
<!DOCTYPE html><html><head><title>Dynamic Page</title><link rel='stylesheet' type='text/css' href='./css/style.css'/></head><body><h2>Hi! in /root/test.mjs of Dynamic Page...</h2>
<script type="module">

	import {Base64URLDecode} from "/node_modules/jsboost/base64.esm.js";
	import {Beson} from "/node_modules/beson/beson.esm.js"

	const recommend_data = Beson.Deserialize(Base64URLDecode(${'!encoded_data'}));
	console.log({recommend_data})

</script>
</body></html>
`);

export default async function(req, res){

	const data = {data:1234132}
	const encoded_data = '"' + Base64URLEncode(Beson.Serialize(data)) + '"';

	res.write(`
	<!DOCTYPE html><html><head><title>Dynamic Page</title><link rel='stylesheet' type='text/css' href='./css/a.css'/></head><body><h2>Hi! in /root/test.mjs of Dynamic Page...</h2>
	<script type="module">

	import {Base64URLDecode} from "/node_modules/jsboost/base64.esm.js";
	import {Beson} from "/node_modules/beson/beson.esm.js"

	const recommend_data = Beson.Deserialize(Base64URLDecode(${encoded_data}));
	console.log({recommend_data})

	</script>
	</body></html>
	`);	
	
}