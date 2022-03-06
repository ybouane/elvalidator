

// Without ElValidator

if(!Object.prototype.hasOwnProperty.call(req.body, 'name'))
	throw new Error('The "Name" field is required.');
if(typeof req.body.name!=='string')
	throw new Error('The "Name" field must be a text field.');
if(req.body.name.length<3)
	throw new Error('The "Name" field must have at least 3 characters.');

if(!Object.prototype.hasOwnProperty.call(req.body, 'tags'))
	throw new Error('The "Tags" field is required.');
if(!Array.isArray(req.body.tags))
	throw new Error('The "Tags" field must be an array.');
if(req.body.tags.some(tag=> {
	return typeof tag!='string' || tag.length<2 || !tag.match(/[a-z0-9_]+/);
}))
	throw new Error('The "Tags" field has invalid value(s).');

req.body.tags = req.body.tags.map(tag=>tag.toLowerCase());



// With ElValidator
let sanitized = await ElValidator.validate(req.body, {
	name	: { type: String, required: true, minlength:3 },
	tags	: [
		{ type: String, required:true, lowercase:true, minlength:2, match:/[a-z0-9_]+/ }
	],
})
