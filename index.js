export const Mixed = Symbol('Mixed');
export default class ElValidator {
	constructor(schema={}, options={}) {
		this.schema = this._checkSchema(schema);
		this.options = {
			strictMode			: true, // When disabled, the validator will go easy on the errors. (i.e. a number is provided instead of a string the number will be converted to a string instead of throwing an error)
			throwUnkownFields	: false,// Throw error when an unknown field is present
			accumulateErrors	: false,// Validate everything and then show big error message (vs. throw error as soon as an issue is detected)
			dismissEmptyObjects	: true,// Whether to dismiss subschema objects when empty
			...options
		};
		this.errors = [];
	}


	_checkSchema(schema, prefix='Schema') {
		if(!ElValidator.isObject(schema) )
			throw new Error('The schema must be an object.');
		if(ElValidator.hasOwnProperty(schema, '$or')) {
			if(!ElValidator.isArray(schema.$or))
				throw new Error(prefix+'.$or must be an array.');

			schema.$or = schema.$or.map((sch, i) => {
				return this._checkSchema({v:sch}, prefix+'.$or['+i+']').v;
			});
		} else if(!ElValidator.hasOwnProperty(schema, 'type') || ElValidator.isObject(schema.type)) {
			for(let k in schema) {
				let fieldName = prefix+'.'+k;
				if(ElValidator.isArray(schema[k])) {
					schema[k] = {
						type		: schema[k],
					}
				} else if(!ElValidator.isObject(schema[k])) {
					throw new Error(fieldName+' must be an object.');
				}
				schema[k] = this._checkSchema(schema[k], fieldName);
			}
			return schema;
			
		} else if(ElValidator.isArray(schema.type)) {
			if(schema.type.length!=1)
				throw new Error(prefix+' must have a single item.');
			schema.type = [this._checkSchema({v:schema.type[0]}, prefix).v];
			if(ElValidator.hasOwnProperty(schema, 'minEntries'))
				schema.minEntries = parseInt(schema.minEntries) || 0;
			if(ElValidator.hasOwnProperty(schema, 'maxEntries'))
				schema.maxEntries = parseInt(schema.maxEntries) || 0;
			if(ElValidator.hasOwnProperty(schema, 'uniqueValues'))
				schema.uniqueValues = !!schema.uniqueValues;

			if(ElValidator.hasOwnProperty(schema.type[0], 'required'))
				schema.required = !!schema.type[0].required;

			if(schema.minEntries && schema.minEntries>0)
				schema.required = true;
		} else if(schema.type===String) {
			if(ElValidator.hasOwnProperty(schema, 'maxLength'))
				schema.maxLength = parseInt(schema.maxLength) || 0;
			if(ElValidator.hasOwnProperty(schema, 'minLength'))
				schema.minLength = parseInt(schema.minLength) || 0;

			if(ElValidator.hasOwnProperty(schema, 'lowercase'))
				schema.lowercase = !!schema.lowercase;
			if(ElValidator.hasOwnProperty(schema, 'uppercase'))
				schema.uppercase = !!schema.uppercase;
			if(ElValidator.hasOwnProperty(schema, 'trim'))
				schema.trim = !!schema.trim;
			if(ElValidator.hasOwnProperty(schema, 'enum')) {
				if(!ElValidator.isArray(schema.enum))
					throw new Error(prefix+' must have an array value for its enum field.');
				schema.enum = schema.enum.map(e=>String(e));
			}
			if(ElValidator.hasOwnProperty(schema, 'match')) {
				if(!(schema.match instanceof RegExp))
					throw new Error(prefix+' has an invalid RegExp for its "match" field.');
				schema.match = schema.match;
			}
		} else if(schema.type===Number) {
			if(ElValidator.hasOwnProperty(schema, 'min'))
				schema.min = parseFloat(schema.min) || 0;
			if(ElValidator.hasOwnProperty(schema, 'max'))
				schema.max = parseFloat(schema.max) || 0;
			if(ElValidator.hasOwnProperty(schema, 'integer'))
				schema.integer = !!schema.integer;
			if(ElValidator.hasOwnProperty(schema, 'enum')) {
				if(!ElValidator.isArray(schema.enum))
					throw new Error(prefix+' must have an array value for its enum field.');
				schema.enum = schema.enum.map(e=>{
					if(typeof e != 'number')
						throw new Error(prefix+' enum values need to be numbers.');
					return parseFloat(e)
				});
			}
		} else if(schema.type===Boolean) {

		} else if(schema.type===Object) {

		} else if(schema.type===Mixed) {
			if(ElValidator.hasOwnProperty(schema, 'enum')) {
				if(!ElValidator.isArray(schema.enum))
					throw new Error(prefix+' must have an array value for its enum field.');
				schema.enum = schema.enum;
			}
		} else {
			throw new Error(prefix+' has an invalid value for the "type" field.');
		}

		if(ElValidator.hasOwnProperty(schema, 'default'))
			schema.default = schema.default;
		if(ElValidator.hasOwnProperty(schema, 'required'))
			schema.required = !!schema.required;
		if(ElValidator.hasOwnProperty(schema, 'name'))
			schema.name = String(schema.name);
		if(ElValidator.hasOwnProperty(schema, 'validator')) {
			if(typeof schema.validator != 'function')
				throw new Error(prefix+' must have a function for the "validator" field.');
			schema.validator = schema.validator;
		}
		return schema;
	}

	async validate(data) {
		this.errors = [];
		var out = await this._validate(data, this.schema, '');
		if(this.errors.length>0)
			throw new Error(this.errors.join("\n"));
		return out;
	}
	_error(err) {
		if(this.options.accumulateErrors)
			this.errors.push(err);
		else
			throw new Error(err);
	}
	async _validate(fieldVal, schema, fieldsPrefix='') {
		var fieldName = schema.name || fieldsPrefix || 'Input';
		if(typeof fieldVal!='undefined') {
			if(ElValidator.hasOwnProperty(schema, '$or')) {
				var initialVal = structuredClone(fieldVal);
				var fieldVal = undefined;
				var originalErrors = this.errors;
				let $orErrors = [];
				for(let k in schema.$or) {
					this.errors = [];
					fieldVal = undefined;
					try {
						fieldVal = await this._validate(initialVal, schema.$or[k], fieldName+'.$or['+k+']');
						if(this.errors.length==0 && typeof fieldVal!='undefined') { // We found a match
							break;
						} else {
							$orErrors.push(...this.errors);
							fieldVal = undefined;
						}
					} catch(e) {
						fieldVal = undefined;
					}
				}
				this.errors = originalErrors;
				if(typeof fieldVal=='undefined') {
					if (ElValidator.hasOwnProperty(schema, 'default')) {
						fieldVal = schema.default;
					} else if (ElValidator.hasOwnProperty(schema, 'required') && schema.required) {
						this._error('The "'+fieldName+'" field matches none of the possible formats.');
						/*for(let err of $orErrors)
							this._error(err);*/
					}
				}
				return fieldVal;
			}

			switch(schema.type) {
				case String:
					if(!ElValidator.isString(fieldVal)) {
						if(!this.options.strictMode) {
							if(ElValidator.hasOwnProperty(schema, 'default') && typeof fieldVal !='number')
								fieldVal = schema.default;
							else
								fieldVal = String(fieldVal);
						} else {
							this._error('The "'+fieldName+'" field must be a text value.');
							return;
						}
					}
					if(schema.uppercase)
						fieldVal = fieldVal.toUpperCase();
					if(schema.lowercase)
						fieldVal = fieldVal.toLowerCase();
					if(schema.trim)
						fieldVal = fieldVal.trim();

					if(ElValidator.hasOwnProperty(schema, 'maxLength') && fieldVal.length>schema.maxLength) {
						if(!this.options.strictMode) {
							fieldVal = fieldVal.subString(0, schema.maxLength);
						} else {
							this._error('The "'+fieldName+'" field must be at most '+ schema.maxLength +' characters long.');
						}
					}
					if(ElValidator.hasOwnProperty(schema, 'minLength') && fieldVal.length<schema.minLength) {
						this._error('The "'+fieldName+'" field must be at least '+ schema.minLength +' characters long.');
					}
					if(ElValidator.hasOwnProperty(schema, 'enum') && !schema.enum.includes(fieldVal)) {
						this._error('The "'+fieldName+'" field has an invalid value.');
					}
					if(ElValidator.hasOwnProperty(schema, 'match') && !fieldVal.match(schema.match)) {
						this._error('The "'+fieldName+'" field doesn\'t match the required format.');
					}
				break;
				case Number:
					if(!ElValidator.isNumber(fieldVal)) {
						if(!this.options.strictMode && ElValidator.hasOwnProperty(schema, 'default')) {
							fieldVal = schema.default;
						} else {
							this._error('The "'+fieldName+'" field must be a number.');
							return;
						}
					}
					if(ElValidator.hasOwnProperty(schema, 'integer') && schema.integer && Math.round(fieldVal) != fieldVal) {
						if(!this.options.strictMode)
							fieldVal = Math.round(fieldVal);
						else {
							this._error('The "'+fieldName+'" field must be an integer.');
						}
					}
					if(ElValidator.hasOwnProperty(schema, 'max') && fieldVal>schema.max) {
						if(!this.options.strictMode)
							fieldVal = schema.max;
						else {
							this._error('The "'+fieldName+'" field must be smaller than "'+schema.max+'".');
						}
					}
					if(ElValidator.hasOwnProperty(schema, 'min') && fieldVal<schema.min) {
						if(!this.options.strictMode)
							fieldVal = schema.min;
						else {
							this._error('The "'+fieldName+'" field must be greater than "'+schema.min+'".');
						}
					}
					if(ElValidator.hasOwnProperty(schema, 'enum') && !schema.enum.includes(fieldVal)) {
						this._error('The "'+fieldName+'" field has an invalid value.');
					}
				break;
				case Boolean:
					if(!ElValidator.isBoolean(fieldVal)) {
						if(!this.options.strictMode) {
							fieldVal = !!fieldVal;
						} else {
							this._error('The "'+fieldName+'" field must be a boolean value.');
							return;
						}
					}
				break;
				case Object: // Object
					if(!ElValidator.isObject(fieldVal)) {
						if(!this.options.strictMode) {
							fieldVal = {};
						} else {
							this._error('The "'+fieldName+'" field must be an object.');
							return;
						}
					}
				break;
				case Mixed:
					if(ElValidator.hasOwnProperty(schema, 'enum') && !schema.enum.includes(fieldVal)) {
						this._error('The "'+fieldName+'" field has an invalid value.');
					}
				break;

				default: // Array or sub-schema
					if(ElValidator.isArray(schema.type)) {
						if(!ElValidator.isArray(fieldVal)) {
							if(!this.options.strictMode) {
								fieldVal = [];
							} else {
								this._error('The "'+fieldName+'" field must be an array.');
								return;
							}
						}

						var out = [];
						for(let i in fieldVal) {
							var sItem = await this._validate(fieldVal[i], schema.type[0], fieldName+'['+i+']');
							if(typeof sItem !='undefined')
								out.push(sItem);
							else if (this.options.strictMode)
								this._error('The "'+fieldName+'" array has an invalid value at index "'+i+'".');
						}
						fieldVal = out;
						if(ElValidator.hasOwnProperty(schema, 'uniqueValues') && schema.uniqueValues) {
							fieldVal = fieldVal.filter((v, i)=>fieldVal.indexOf(v)===i);
						}
						if(ElValidator.hasOwnProperty(schema, 'maxEntries') && fieldVal.length>schema.maxEntries) {
							if(!this.options.strictMode)
							fieldVal = fieldVal.slice(0, schema.maxEntries);
							else {
								this._error('The "'+fieldName+'" field must have at most "'+schema.maxEntries+'" entries.');
							}
						}
						if(ElValidator.hasOwnProperty(schema, 'minEntries') && fieldVal.length<schema.minEntries) {
							this._error('The "'+fieldName+'" field must have at least "'+schema.minEntries+'" entries.');
						}
					} else {
						if(!ElValidator.isObject(fieldVal)) {
							if(!this.options.strictMode) {
								fieldVal = {};
							} else {
								this._error('The "'+fieldName+'" field must be an object.');
								return;
							}
						}
						var out = {};
						if(this.options.throwUnkownFields) {
							for(let k in fieldVal) {
								if(!ElValidator.hasOwnProperty(schema, k)) {
									this._error('Field "'+k+'" is not known.');
									continue;
								}
							}
						}
						for(let k in schema) {
							//fieldVal = await this._validate(fieldVal[k], schema[k], fieldsPrefix+'.'+k);
							if(!ElValidator.hasOwnProperty(schema[k], '$or') && (!ElValidator.hasOwnProperty(schema[k], 'type') || ElValidator.isObject(schema[k].type))) {
								fieldVal[k] = fieldVal[k] || {};
							}
							var val = await this._validate(fieldVal[k], schema[k], fieldsPrefix?fieldsPrefix+'.'+k:k);
							if(typeof val!='undefined')
								out[k] = val;
						}
						if(this.options.dismissEmptyObjects && fieldsPrefix!=='' && Object.keys(out).length==0)
							return undefined;
						fieldVal = out;
					}
				break;
			}

			if(ElValidator.hasOwnProperty(schema, 'validator')) {
				try {
					fieldVal = (await Promise.all([schema.validator(fieldVal)]))[0];
				} catch(e) {
					this._error(String(e));
					return;
				}
			}
		} else if (ElValidator.hasOwnProperty(schema, 'default')) {
			fieldVal = schema.default;
		} else if (ElValidator.hasOwnProperty(schema, 'required')) {
			if(schema.required) {
				this._error('The "'+fieldName+'" field is required.');
			}
		}
		return fieldVal;
	}

	static get Builtins() {
		return {
			Url				: { type:String, name: 'URL', required: true, lowercase:false, trim:true, match:/^(http|https):\/\/([a-z0-9-]{1,63}\.)+[A-Za-z]{2,}(\/.*|$)/i},
			DomainName		: { type:String, name: 'Domain name', required: true, lowercase:true, trim:true, match:/^([a-z0-9-]{1,63}\.)+[a-z]{2,}$/},
			Email			: { type:String, name: 'Email address', required: true, lowercase:true, trim:true, match:/^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/},
			YoutubeVideo	: { type:String, name: 'Youtube Video Url', required: true, lowercase:false, trim:true, match:/^(https?:\/\/)((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/i},
			VimeoVideo		: { type:String, name: 'Vimeo Video Url', required: true, lowercase:false, trim:true, match:/^(http|https)?:\/\/(www\.|player\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|video\/|)(\d+)(?:|\/\?)/},
		};
	}
	static get Types() {
		return {
			String	: String,
			Number	: Number,
			Boolean	: Boolean,
			Array	: Array,
			Object	: Object,
			Mixed	: Mixed,
		}
	}


	static hasOwnProperty(obj, key) {
		return Object.prototype.hasOwnProperty.call(obj, key);
	}
	static isObject(obj) {
		return obj===Object(obj) && typeof obj=='object' && !ElValidator.isArray(obj);
	}
	static isArray(arr) {
		return Array.isArray(arr);
	}
	static isString(str) {
		return typeof str === 'string'
	}
	static isNumber(num) {
		return typeof num === 'number' && !isNaN(num);
	}
	static isBoolean(bool) {
		return typeof bool === 'boolean';
	}

	static async validate(data, schema, opts) {
		var validator = new ElValidator(schema, opts);

		return await validator.validate(data);
	}



}
