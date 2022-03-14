export const Mixed = Symbol('Mixed');
export default class ElValidator {
	constructor(schema={}, options={
		strictMode			: true, // When disabled, the validator will go easy on the errors. (i.e. a number is provided instead of a string the number will be converted to a string instead of throwing an error)
		throwUnkownFields	: false,// Throw error when an unknown field is present
		accumulateErrors	: false,// Validate everything and then show big error message (vs. throw error as soon as an issue is detected)
	}) {
		this.schema = this._checkSchema(schema);
		this.options = options;
		this.errors = [];
		//console.dir(this.schema, { depth: null });
	}


	_checkSchema(schema, prefix='Schema') {
		if(!ElValidator.isObject(schema))
			throw new Error(prefix+' must be an object.');
		for(let k in schema) {
			let fieldName = prefix+'.'+k;
			var schema_ = schema[k];
			schema[k] = {};
			if(ElValidator.isArray(schema_)) {
				schema[k] = {
					type		: schema_,
				}
			} else if(!ElValidator.isObject(schema_)) {
				throw new Error(fieldName+' must be an object.');
			} else if(!ElValidator.hasOwnProperty(schema_, '$or') && ElValidator.hasOwnProperty(schema_, 'type')) {
				schema[k] = {
					type		: schema_.type,
				}
			}


			if(ElValidator.hasOwnProperty(schema_, '$or')) {
				if(!ElValidator.isArray(schema_.$or))
					throw new Error(fieldName+'.$or must be an array.');

				schema[k].$or = schema_.$or.map((sch, i) => {
					return this._checkSchema({v:sch}, fieldName+'.$or['+i+']').v;
				});
			} else if(!ElValidator.hasOwnProperty(schema[k], 'type') || ElValidator.isObject(schema[k].type)) {
				schema[k] = this._checkSchema(schema_, fieldName);
				continue;
			} else if(ElValidator.isArray(schema[k].type)) {
				if(schema[k].type.length!=1)
					throw new Error(fieldName+' must have a single item.');
				schema[k].type = [this._checkSchema({v:schema[k].type[0]}, fieldName).v];
				if(ElValidator.hasOwnProperty(schema_, 'minEntries'))
					schema[k].minEntries = parseInt(schema_.minEntries) || 0;
				if(ElValidator.hasOwnProperty(schema_, 'maxEntries'))
					schema[k].maxEntries = parseInt(schema_.maxEntries) || 0;
				if(ElValidator.hasOwnProperty(schema_, 'uniqueValues'))
					schema[k].uniqueValues = !!schema_.uniqueValues;

				if(ElValidator.hasOwnProperty(schema[k].type[0], 'required'))
					schema[k].required = !!schema[k].type[0].required;
			} else if(schema[k].type===String) {
				if(ElValidator.hasOwnProperty(schema_, 'maxLength'))
					schema[k].maxLength = parseInt(schema_.maxLength) || 0;
				if(ElValidator.hasOwnProperty(schema_, 'minLength'))
					schema[k].minLength = parseInt(schema_.minLength) || 0;

				if(ElValidator.hasOwnProperty(schema_, 'lowercase'))
					schema[k].lowercase = !!schema_.lowercase;
				if(ElValidator.hasOwnProperty(schema_, 'uppercase'))
					schema[k].uppercase = !!schema_.uppercase;
				if(ElValidator.hasOwnProperty(schema_, 'trim'))
					schema[k].trim = !!schema_.trim;
				if(ElValidator.hasOwnProperty(schema_, 'enum')) {
					if(!ElValidator.isArray(schema_.enum))
						throw new Error(fieldName+' must have an array value for its enum field.');
					schema[k].enum = schema_.enum.map(e=>String(e));
				}
				if(ElValidator.hasOwnProperty(schema_, 'match')) {
					if(!(schema_.match instanceof RegExp))
						throw new Error(fieldName+' has an invalid RegExp for its "match" field.');
					schema[k].match = schema_.match;
				}
			} else if(schema[k].type===Number) {
				if(ElValidator.hasOwnProperty(schema_, 'min'))
					schema[k].min = parseInt(schema_.min) || 0;
				if(ElValidator.hasOwnProperty(schema_, 'max'))
					schema[k].max = parseInt(schema_.max) || 0;
				if(ElValidator.hasOwnProperty(schema_, 'integer'))
					schema[k].integer = !!schema_.integer;
			} else if(schema[k].type===Boolean) {

			} else if(schema[k].type===Object) {

			} else if(schema[k].type===Mixed) {

			} else {
				throw new Error(fieldName+' has an invalid value for the "type" field.');
			}

			if(ElValidator.hasOwnProperty(schema_, 'default'))
				schema[k].default = schema_.default;
			if(ElValidator.hasOwnProperty(schema_, 'required'))
				schema[k].required = !!schema_.required;
			if(ElValidator.hasOwnProperty(schema_, 'name'))
				schema[k].name = String(schema_.name);
			if(ElValidator.hasOwnProperty(schema_, 'validator')) {
				if(typeof schema_.validator != 'function')
					throw new Error(fieldName+' must have a function for the "validator" field.');
				schema[k].validator = schema_.validator;
			}

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
	async _validateField(fieldVal, schema, fieldsPrefix) {
		var fieldName = schema.name || fieldsPrefix;
		if(typeof fieldVal!='undefined') {
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
					if(ElValidator.hasOwnProperty(schema, 'integer') && Math.round(fieldVal) != fieldVal) {
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
							var sItem = await this._validate({value:fieldVal[i]}, {value:schema.type[0]}, fieldsPrefix+'['+i+']');
							if(ElValidator.isObject(sItem) && ElValidator.hasOwnProperty(sItem, 'value'))
								out.push(sItem.value);
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
						fieldVal = await this._validate(fieldVal, schema, fieldsPrefix);
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

	async _validate(data, schema, fieldsPrefix) {
		if(!ElValidator.isObject(data)) {
			return this._error('Invalid data field "'+fieldsPrefix+'". It must be an Object.');
		}

		var out = {};
		if(this.options.throwUnkownFields) {
			for(let k in data) {
				if(!ElValidator.hasOwnProperty(schema, k)) {
					this._error('Field "'+k+'" is not known.');
					continue;
				}
			}
		}

		for(let k in schema) {
			if(ElValidator.hasOwnProperty(schema[k], '$or')) {
				var initialVal = data[k];
				var fieldVal = undefined;
				if(typeof initialVal!='undefined') {
					var originalErrors = this.errors;
					for(let $or of schema[k].$or) {
						this.errors = [];
						fieldVal = undefined;
						try {
							fieldVal = await this._validateField(initialVal, $or, fieldsPrefix?fieldsPrefix+'.'+k:k);
							if(this.errors.length==0 && typeof fieldVal!='undefined') {
								break;
							}
						} catch(e) {
							fieldVal = undefined;
						}
					}
					this.errors = originalErrors;
				}
				if(typeof fieldVal=='undefined') {
					if (ElValidator.hasOwnProperty(schema[k], 'default')) {
						fieldVal = schema[k].default;
					} else if (ElValidator.hasOwnProperty(schema[k], 'required') && schema[k].required) {
						this._error('The "'+(schema[k].name || (fieldsPrefix?fieldsPrefix+'.'+k:k))+'" field is required.');
						continue;
					}
				}
				if(typeof fieldVal!='undefined')
					out[k] = fieldVal;
			} else {
				var fieldVal = data[k];
				if(!ElValidator.hasOwnProperty(schema[k], 'type') || ElValidator.isObject(schema[k].type)) {
					fieldVal = data[k] || {};
				}
				var val = await this._validateField(fieldVal, schema[k], fieldsPrefix?fieldsPrefix+'.'+k:k);
				if(typeof val!='undefined')
					out[k] = val;
			}
		}
		return out;
	}

	static get Builtins() {
		return {
			Url				: { type:String, name: 'URL', required: true, lowercase:false, trim:true, match:/^(http|https):\/\/((?!-)[a-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,}(\/.*|$)/i},
			DomainName		: { type:String, name: 'Domain name', required: true, lowercase:true, trim:true, match:/^((?!-)[a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,}$/},
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
