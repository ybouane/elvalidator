//import ElValidator from 'elvalidator';
import ElValidator from './index.js';

// Set up the validator object
let validator = new ElValidator({
	name				: { type: String, required:true, trim:true, minLength:3 },
	age					: { type: Number, required:true, integer:true, min:18, max:100 },
	agreedTelemetry		: { type: Boolean, default:false },

	// Array example:
	tags				: [
		{ type: String, minLength:3, lowercase:true, trim:true, match: /^[a-z0-9]+$/  }
	],

	// Object example:
	settings	: {
		darkMode	: { type: Boolean, required: true, },
		codeEditor	: { type: String, default:'atom', enum:['atom', 'vstudio', 'notepad++'] },
		extras		: { type: Object, required:true, }
	},
	stringOrBool	: {
		$or	: [
			{ type: String },
			{ type: Boolean },
		]
	},
	arrayWithOptions	: {
		type	: [
			{ type: String, minLength:3, lowercase:true, trim:true, match: /^[a-z0-9]+$/  }
		],
		minEntries		: 0,
		maxEntries		: 20,
		uniqueValues	: true,
	},
	custom	: { type: String, validator: async (value) => {
		if(value.length%2 == 1)
			throw new Error('The number of characters must be odd.');
		return '->'+value;
	}},
}, {
	strictMode			: true,
	throwUnkownFields	: false,
	accumulateErrors	: false,
	dismissEmptyObjects	: true,
});

// Validate/Sanitize a data object
var sanitizedData = await validator.validate({
	name				: 'Yassine',
	age					: 27,

	tags				: ['programmer', 'javascript'],
	settings			: {
		darkMode	: false,
		//codeEditor	: 'atom',
		extras		: {
			one	: '1',
			two	: 'anything',
		}
	},
	other				: 'unknown field',
	stringOrBool		: false,
	arrayWithOptions	: ['hello', 'world', 'tag', 'WillDownCase', 'TAG', 'last'],
	custom				: 'node'
});

console.log(sanitizedData);



/*
OUTPUT:

{
  name: 'Yassine',
  age: 27,
  agreedTelemetry: false,
  tags: [ 'programmer', 'javascript' ],
  settings: {
    darkMode: false,
    codeEditor: 'atom',
    extras: { one: '1', two: 'anything' }
  },
  stringOrBool: false,
  arrayWithOptions: [ 'hello', 'world', 'tag', 'willdowncase', 'last' ],
  custom: '->node'
}

*/
