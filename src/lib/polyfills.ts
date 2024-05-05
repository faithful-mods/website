export {};

declare global {
	interface Array<T> {
		/**
		 * Remove all duplicate from an array of objects, based on a comparer function.
		 * @warning Make sure to provide a homogeneous array, otherwise the comparer function will not work as expected.
		 * @param comparer the function to compare two objects.
		 */
		unique(...args: T extends object ? [comparer: (a: T, b: T) => boolean] : []): T[];
	}
}

if (!Array.prototype.unique) {
	Array.prototype.unique = function <T>(this: T[], comparer?: (a: T, b: T) => boolean): T[] {
		return comparer
			? this.filter((item, index) => this.findIndex((x) => comparer(x, item)) === index)
			: [...new Set(this)];
	};
}
