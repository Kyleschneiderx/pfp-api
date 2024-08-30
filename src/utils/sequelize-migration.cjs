module.exports = ({ table = '', schema = {}, columns = {}, indexes = [] }) => {
    const addIndex = async (queryInterface, indexTable, indexObject) => {
        if (!Array.isArray(indexObject)) {
            return;
        }

        await Promise.all(
            indexObject.map(async (index) => {
                await queryInterface.addIndex(indexTable, index.fields, index);
            }),
        );
    };

    const removeIndex = async (queryInterface, indexTable, indexObject) => {
        if (!Array.isArray(indexObject)) {
            return;
        }

        await Promise.all(
            indexObject.map(async (index) => {
                await queryInterface.removeIndex(indexTable, index.name);
            }),
        );
    };

    const addColumn = async (queryInterface, columnTable, columnObject) => {
        if (typeof columnObject !== 'object') {
            return;
        }

        await Promise.all(
            Object.keys(columnObject).map(async (column) => {
                await queryInterface.addColumn(columnTable, column, columnObject[column]);
            }),
        );
    };

    const removeColumn = async (queryInterface, columnTable, columnObject) => {
        if (typeof columnObject !== 'object') {
            return;
        }

        await Promise.all(
            Object.keys(columnObject).map(async (column) => {
                await queryInterface.removeColumn(columnTable, column, columnObject[column]);
            }),
        );
    };

    return {
        async up(queryInterface, Sequelize) {
            // snippet for creating table
            if (Object.keys(schema).length !== 0) {
                await queryInterface.createTable(table, schema);
            }

            // snippet for adding columns
            if (Object.keys(columns).length !== 0) {
                await addColumn(queryInterface, table, columns);
            }

            // snippet for adding indexes)
            if (indexes.length !== 0) {
                await addIndex(queryInterface, table, indexes);
            }
        },
        async down(queryInterface, Sequelize) {
            // snippet for removing table
            if (Object.keys(schema).length !== 0) {
                await queryInterface.dropTable(table);
            }

            // snippet for removing column
            if (Object.keys(schema).length === 0 && Object.keys(columns).length !== 0) {
                await removeColumn(queryInterface, table, columns);
            }

            // snippet for removing index
            if (Object.keys(schema).length === 0 && indexes.length !== 0) {
                await removeIndex(queryInterface, table, indexes);
            }
        },
    };
};
