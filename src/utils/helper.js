export default class Helper {
    /**
     * Parse sort parameter for report query
     *
     * @param {Array} sort Array of sort query
     * @example [ [ { field }, { order } ] ]
     * @param {object} sortable Sortable fields
     * @example { { field }: { alias } }
     * @param {object} database Database instance to tailor the parsed sort to provided database instance
     * @returns {Array}
     */
    static parseSortList(array, sortable, database) {
        return array
            .filter((sort) => Object.keys(sortable).includes(sort[0]))
            .map((sort) => {
                sort[0] = database.col(sortable[sort[0]] ? `${sortable[sort[0]]}.${sort[0]}` : sort[0]);
                return sort;
            });
    }
}
