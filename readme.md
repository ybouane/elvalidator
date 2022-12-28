# El Validator
![Version](https://img.shields.io/npm/v/elvalidator)
![NPM Downloads](https://img.shields.io/npm/dt/elvalidator)
![License](https://img.shields.io/npm/l/elvalidator)


El Validator is a JSON Object validator and sanitizer. It's a great little tool for validating user input and sanitizing.

It's heavily inspired from the familiar Mongoose schema format with a few more features. (Note: El Validator doesn't attempt to strictly match the Mongoose validator)

* 0 dependencies
* Easy to use
* Lightweight (8.51Kb minified)

# Installation
```bash
$ npm install elvalidator --save
```

Or in the browser:
```html
<script type="text/javascript" src="https://unpkg.com/elvalidator/elvalidator.min.js"></script>
```


# Usage
```javascript
import ElValidator from 'elvalidator';

// Set up the validator object
//let validator = new ElValidator(schema, options);
let validator = new ElValidator({
  name             : { type: String, required:true, trim:true, minLength:3 },
  age              : { type: Number, required:true, integer:true, min:18, max:100 },
  agreedTelemetry  : { type: Boolean, default:false },

  // Array example:
  tags             : [
    { type: String, minLength:3, lowercase:true, trim:true, match: /^[a-z0-9]+$/  }
  ],

  // Object example:
  settings	       : {
    darkMode    : { type: Boolean, default:false },
    codeEditor  : { type: String, required:false, default:'atom', enum:['atom', 'vstudio', 'notepad++'] },
  }
}, {
  // When disabled, the validator will go easy on the errors. (i.e. a number is provided instead of a string the number will be converted to a string instead of throwing an error)
  strictMode        : true,
  // Throw error when an unknown field is present
  throwUnkownFields : false,
  // Validate everything and then show big error message (vs. throw error as soon as an issue is detected)
  accumulateErrors  : false,
  // Whether to dismiss subschema objects when empty
  dismissEmptyObjects	: false
});

// Validate/Sanitize a data object
// If there's an error, it will be thrown. You can thus use a try ... catch block to process the errors.
var sanitizedData = await validator.validate({
  name        : 'Yassine',
  age         : 27,

  tags        : ['PROgrammer', 'javascript '],
  settings    : {
    darkMode  : false,
  },
  other       : 'unknown field',
});

console.log(sanitizedData);

/*
Outputs:
{
  name: 'Yassine',
  age: 27,
  agreedTelemetry: false,
  tags: [ 'programmer', 'javascript' ],
  settings: { darkMode: false, codeEditor: 'atom' }
}

*/

```


# Schema Reference
## String
```javascript
{
	field	: {
		type		: String,
		name		: "Field Name", // For cleaner error messages
		required	: false, // Is this a mandatory field?
		default		: '', // If provided, the required field is not considered

		lowercase	: false, // Force string to lower case
		uppercase	: false, // Force string to UPPER CASE
		trim		: false, // Trim text (remove whitespace at the start and end of the string)
		minLength	: 3, // Minimum length of the string
		maxLength	: 15, // Maximum length of the string
		enum		: ['hello', 'world'], // Array with valid values for this field
		match		: /^(hello|world)$/i, // String must match with this regex

		validator	: async (value) => { // Manually validate/sanitize the value
			if(!value)
				throw new Error('Invalid value');
			return value;
		},
	}
}
```
## Number
```javascript
{
	field	: {
		type		: Number,
		name		: "Field Name", // For cleaner error messages
		required	: false, // Is this a mandatory field?
		default		: 0, // If provided, the required field is not considered

		integer		: false, // Force number to be an integer
		min			: 3, // Minimum value of the number
		max			: 15, // Maximum value of the number
		enum		: [5, 7, 12], // Array with valid values for this field

		validator	: async (value) => { // Manually validate/sanitize the value
			if(!value)
				throw new Error('Invalid value');
			return value;
		},
	}
}
```
## Boolean
```javascript
{
	field	: {
		type		: Boolean,
		name		: "Field Name", // For cleaner error messages
		required	: false, // Is this a mandatory field?
		default		: false, // If provided, the required field is not considered

		validator	: async (value) => { // Manually validate/sanitize the value
			if(!value)
				throw new Error('Invalid value');
			return value;
		},
	}
}
```
## Array
```javascript
{
	// With default options
	field	: [
		{ type: String } // Define the schema for the values this array should allow, in this case it accepts strings
	],

	// OR with options
	field	: {
		type		: [
			{ type: String } // Define the schema for the values this array should allow, in this case it accepts strings
		],
		name		: "Field Name", // For cleaner error messages
		required	: false, // Is this a mandatory field?
		default		: [], // If provided, the required field is not considered

		minEntries	: 0, // Minimum number of entries this array can hold
		maxEntries	: 10, // Maximum number of entries this array can hold
		uniqueValues: false, // Whether to filter out the values of the array to only return non-repeating values

		validator	: async (value) => { // Manually validate/sanitize the value
			if(!value)
				throw new Error('Invalid value');
			return value;
		},
	}
}
```

## Object
This type allows you to accept Objects with arbitrary fields and no particular validation.
```javascript
{
	field	: {
		type		: Object,
		name		: "Field Name", // For cleaner error messages
		required	: false, // Is this a mandatory field?
		default		: {}, // If provided, the required field is not considered

		validator	: async (value) => { // Manually validate/sanitize the value
			if(!value)
				throw new Error('Invalid value');
			return value;
		},
	}
}
```

## Mixed
This type allows you to accept any type of input with no particular validation.
```javascript
{
	field	: {
		type		: ElValidator.Types.Mixed,
		name		: "Field Name", // For cleaner error messages
		required	: false, // Is this a mandatory field?
		default		: null, // If provided, the required field is not considered
		enum		: [false, 5, 'auto'], // Array with valid values for this field

		validator	: async (value) => { // Manually validate/sanitize the value
			if(!value)
				throw new Error('Invalid value');
			return value;
		},
	}
}
```
## Sub-Schema
```javascript
{
	field	: {
		subField1	: { type: String },
		subField2	: { type: Number },
		subField3	: {
			type			: { type: String }, // Here type is a sub-sub-field and accepts strings
			subSubField2	: { type: Number },
		},
	}
}
```
## $or operator
```javascript
{
	field	: {
		$or	: [ // You can define different possible types for this particular field using the $or operator

			{ type: String, }, // field can either be a string,
			{ type: Number, min:0, max:10}, // a number between 0 and 10
			{ type: Number, min:100, max:1000, integer: true}, // or an integer between 100 and 1000
		],
		default		: '',
		required	: true,
	}
}
```



# Built Ins
A few validators are available to make your life easier.

```javascript
{
	url				: ElValidator.Builtins.Url,
	domainName		: ElValidator.Builtins.DomainName,
	email			: ElValidator.Builtins.Email,
	youtubeVideo	: ElValidator.Builtins.YoutubeVideo,
	vimeoVideo		: ElValidator.Builtins.VimeoVideo,
}

// will validate for:

{
	url				: 'https://www.example.com/index.html?query=param',
	domainName		: 'www.example.com',
	email			: 'user@example.com',
	youtubeVideo	: 'https://www.youtube.com/watch?v=UNG7vNchvVQ',
	vimeoVideo		: 'https://vimeo.com/347119375',
}

```
