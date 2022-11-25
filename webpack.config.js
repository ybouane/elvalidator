import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
	entry: './index.js',
	output: {
		filename: 'elvalidator.min.js',
		path: path.resolve(__dirname, './'),
		//hashFunction: "xxhash64",
		library: 'ElValidator',
		libraryTarget: 'commonjs2',
	},
	experiments: {
		outputModule: true,
	},
	mode: 'production',
}
