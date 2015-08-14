'use strict';

var debug = require('debug')('lolstack:db/base');
var Promise = require('bluebird');
var rethinkdbdash = require('rethinkdbdash');

var r = null;

/*
 * Get a list of databases.
 * Takes no callback.
 *
 * @method getDbList
 * @return {Promise} Returns a promise resolved on successful fetch and rejected on error
 */
function getDbList() {
  return new Promise(function(resolve, reject) {
    r.dbList().run()
      .then(function(databaseNames) {
        debug('Total databases', databaseNames.length);
        resolve(databaseNames);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Checks if a database exists or not.
 * Takes no callback.
 *
 * @method dbExists
 * @param {String} dbName The name of the database to check
 * @return {Promise} Returns a promise resolved on successful calcuation and rejected on error
 */
function dbExists(dbName) {
  return new Promise(function(resolve, reject) {
    getDbList()
      .then(function(databaseNames) {
        var dbFound = databaseNames.indexOf(dbName) > -1;
        debug('Database', dbName, 'found?', dbFound);
        resolve(dbFound);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Creates a new database with given name.
 * Takes no callback.
 *
 * @method createDb
 * @param {String} dbName Database name
 * @return {Promise} Returns a promise resolved on successful creation and rejected on error
 */
function createDb(dbName) {
  return new Promise(function(resolve, reject) {
    r.dbCreate(dbName).run()
      .then(function(result) {
        debug('New database', dbName, 'created?', result.dbs_created === 1);
        resolve(result.dbs_created === 1);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/**
 * Drops a database.
 * Takes no callback.
 *
 * @method dropDb
 * @param {String} dbName Database name
 * @return {Promise} Returns a promise resolved on successful drop and rejected on error
 */
function dropDb(dbName) {
  return new Promise(function(resolve, reject) {
    r.dbDrop(dbName).run()
      .then(function(result) {
        debug('Database', dbName, 'dropped?', result.dbs_dropped === 1);
        resolve(result.dbs_dropped === 1);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Checks if a database exists and creates it if it doesn't
 * Takes no callback.
 *
 * @method createDbIfNotExists
 * @param {String} dbName Database name
 * @return {Promise} Returns a promise resolved on successful creation/existence and rejected on error
 */
function createDbIfNotExists(dbName) {
  return new Promise(function(resolve, reject) {
    dbExists(dbName)
      .then(function(dbFound) {
        return dbFound ? resolve(dbFound) : resolve(createDb(dbName));
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Checks if databases exist and creates them if they don't
 * Takes no callback.
 *
 * @method createDb
 * @param {String} dbNames Database name(s)
 * @return {Promise} Returns a promise resolved on successful creation and rejected on error
 */
function createDbsIfNotExist(dbNames) {
  if (dbNames instanceof String) {
    return createDbIfNotExists(dbNames);
  }
  return Promise.all(
    dbNames.map(function(dbName) {
      return createDbIfNotExists(dbName);
    })
  );
}

/*
 * Checks if a database exists and drops it if it does.
 * Takes no callback.
 *
 * @method dropDbIfExists
 * @param {String} dbName Database name
 * @return {Promise} Returns a promise resolved on successful drop and rejected on error
 */
function dropDbIfExists(dbName) {
  return new Promise(function(resolve, reject) {
    dbExists(dbName)
      .then(function(dbFound) {
        return dbFound ? resolve(dropDb(dbName)) : resolve(true);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Checks if databases exist and drops them if they do.
 * Takes no callback.
 *
 * @method dropDbIfExists
 * @param {String} dbNames Database name(s)
 * @return {Promise} Returns a promise resolved on successful drop and rejected on error
 */
function dropDbsIfExist(dbNames) {
  if (dbNames instanceof String) {
    return dropDbIfExists(dbNames);
  }
  return Promise.all(
    dbNames.map(function(dbName) {
      return dropDbIfExists(dbName);
    })
  );
}

/*
 * Reset all the tables of a database. It doesn't delete the tables but delete the rows in tables.
 * Takes no callback.
 *
 * @method resetDb
 * @param {String} dbName Database name
 * @return {Promise} Returns a promise resolved on successful reset and rejected on error
 */
function resetDb(dbName) {
  return new Promise(function(resolve, reject) {
    getTableList(dbName)
      .then(function(tableNames) {
        resolve(resetTables(dbName, tableNames));
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Retrieves the list of tables in a database.
 * Takes no callback.
 *
 * @method getTableList
 * @param {String} dbName Database name
 * @return {Promise} Returns a promise resolved on successful retrieval and rejected on error
 */
function getTableList(dbName) {
  return new Promise(function(resolve, reject) {
    r.db(dbName).tableList().run()
      .then(function(tableNames) {
        debug('Total tables in database', dbName, tableNames.length);
        resolve(tableNames);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Checks if a table exists in database.
 * Takes no callback.
 *
 * @method tableExists
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @return {Promise} Returns a promise resolved on successful check and rejected on error
 */
function tableExists(dbName, tableName) {
  return new Promise(function(resolve, reject) {
    getTableList(dbName)
      .then(function(tableNames) {
        var tableFound = tableNames.indexOf(tableName) > -1;
        debug('Table', tableName, 'in database', dbName, 'found?', tableFound);
        resolve(tableFound);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Creates a table in the database.
 * Takes no callback.
 *
 * @method createTable
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @return {Promise} Returns a promise resolved on successful creation and rejected on error
 */
function createTable(dbName, tableName) {
  return new Promise(function(resolve, reject) {
    r.db(dbName).tableCreate(tableName).run()
      .then(function(result) {
        debug('Table', tableName, 'in database', dbName, 'created?', result.tables_created === 1);
        resolve(result.tables_created === 1);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Drops a table in the database.
 * Takes no callback.
 *
 * @method dropTable
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @return {Promise} Returns a promise resolved on successful drop and rejected on error
 */
function dropTable(dbName, tableName) {
  return new Promise(function(resolve, reject) {
    r.db(dbName).tableDrop(tableName).run()
      .then(function(result) {
        debug('Table', tableName, 'in database', dbName, 'dropped?', result.tables_dropped === 1);
        resolve(result.tables_dropped === 1);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Checks if a table exists and creates it if it doesn't
 * Takes no callback.
 *
 * @method createTableIfNotExists
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @return {Promise} Returns a promise resolved on successful creation/existence and rejected on error
 */
function createTableIfNotExists(dbName, tableName) {
  return new Promise(function(resolve, reject) {
    tableExists(dbName, tableName)
      .then(function(tableFound) {
        return tableFound ? resolve(tableFound) : resolve(createTable(dbName, tableName));
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Checks if tables exist and creates them if they don't
 * Takes no callback.
 *
 * @method createTableIfNotExists
 * @param {String} dbName Database name
 * @param {String} tableNames Table name(s)
 * @return {Promise} Returns a promise resolved on successful creation/existence and rejected on error
 */
function createTablesIfNotExist(dbName, tableNames) {
  if (tableNames instanceof String) {
    return createTableIfNotExists(dbName, tableNames);
  }
  return Promise.all(
    tableNames.map(function(tableName) {
      return createTableIfNotExists(dbName, tableName);
    })
  );
}

/*
 * Checks if a table exists and drops it if it does.
 * Takes no callback.
 *
 * @method dropTableIfExists
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @return {Promise} Returns a promise resolved on successful drop and rejected on error
 */
function dropTableIfExists(dbName, tableName) {
  return new Promise(function(resolve, reject) {
    tableExists(dbName, tableName)
      .then(function(tableFound) {
        return tableFound ? resolve(dropTable(dbName, tableName)) : resolve(true);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Checks if tables exist and drops them if they do.
 * Takes no callback.
 *
 * @method dropTableIfExists
 * @param {String} dbName Database name
 * @param {String} tableNames Table name(s)
 * @return {Promise} Returns a promise resolved on successful drop and rejected on error
 */
function dropTablesIfExist(dbName, tableNames) {
  if (tableNames instanceof String) {
    return dropTableIfExists(dbName, tableNames);
  }
  return Promise.all(
    tableNames.map(function(tableName) {
      return dropTableIfExists(tableName);
    })
  );
}

/*
 * Deletes all rows in a table.
 * Takes no callback.
 *
 * @method resetTable
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @return {Promise} Returns a promise resolved on successful deletion and rejected on error
 */
function resetTable(dbName, tableName) {
  return new Promise(function(resolve, reject) {
    r.db(dbName).table(tableName).delete().run()
      .then(function(result) {
        debug('Reset table', tableName);
        resolve(result);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Deletes all rows in given tables.
 * Takes no callback.
 *
 * @method resetTables
 * @param {String} dbName Database name
 * @param {Array|String} tableNames Table name(s)
 * @return {Promise} Returns a promise resolved on successful deletion and rejected on error
 */
function resetTables(dbName, tableNames) {
  if (tableNames instanceof String) {
    return resetTable(dbName, tableNames);
  }
  return Promise.all(
    tableNames.map(function(tableName) {
      return resetTable(dbName, tableName);
    })
  );
}

/*
 * Fetches all indexes on a given table.
 * Takes no callback.
 *
 * @method getIndexList
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @return {Promise} Returns a promise resolved on successful fetch and rejected on error
 */
function getIndexList(dbName, tableName) {
  return new Promise(function(resolve, reject) {
    r.db(dbName).table(tableName).indexList().run()
      .then(function(indexNames) {
        debug('Total indexes on table', tableName, 'in database', dbName, indexNames.length);
        resolve(indexNames);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Checks if an index exists for a table or not.
 * Takes no callback.
 *
 * @method indexExists
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @param {String} indexName Index name
 * @return {Promise} Returns a promise resolved on successful check and rejected on error
 */
function indexExists(dbName, tableName, indexName) {
  return new Promise(function(resolve, reject) {
    getIndexList(dbName, tableName)
      .then(function(indexNames) {
          var indexFound = indexNames.indexOf(indexName) > -1;
          debug('Index', indexName, 'in table', tableName, 'in database', dbName, 'found?', indexFound);
          resolve(indexFound);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Creates specified index.
 * Takes no callback.
 *
 * @method createIndex
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @param {String} indexName Index name
 * @param {Array[String]} columns Array of index names
 * @return {Promise} Returns a promise resolved on successful creation of index and rejected on error
 */
function createIndex(dbName, tableName, indexName, columns) {
  var indexCreateQuery = r.db(dbName).table(tableName);
  if (columns) {
    columns = columns.map(function(column) {
      return r.row(column);
    });
    indexCreateQuery = indexCreateQuery.indexCreate(indexName, columns);
  } else {
    indexCreateQuery = indexCreateQuery.indexCreate(indexName);
  }

  return new Promise(function(resolve, reject) {
    indexCreateQuery.run()
      .then(function(result) {
        debug('Index', indexName, 'in table', tableName, 'in database', dbName, 'created?', result.created === 1);
        resolve(result.created === 1);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Drops specified index.
 * Takes no callback.
 *
 * @method dropIndex
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @param {String} indexName Index name
 * @return {Promise} Returns a promise resolved on successful deletion of index and rejected on error
 */
function dropIndex(dbName, tableName, indexName) {
  return new Promise(function(resolve, reject) {
    r.db(dbName).table(tableName).indexDrop(indexName).run()
      .then(function(result) {
        debug('Index', indexName, 'in table', tableName, 'in database', dbName, 'dropped?', result.dropped === 1);
        resolve(result.dropped === 1);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Check if an index exists and creates if it doesn't.
 * Takes no callback.
 *
 * @method createIndexIfNotExists
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @param {String} indexName Index name
 * @param {Array[String]} columns Array of index names
 * @return {Promise} Returns a promise resolved on successful creation/existence of index and rejected on error
 */
function createIndexIfNotExists(dbName, tableName, indexName, columns) {
  return new Promise(function(resolve, reject) {
    indexExists(dbName, tableName, indexName)
      .then(function(indexFound) {
        return indexFound ? resolve(indexFound) : resolve(createIndex(dbName, tableName, indexName, columns));
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Checks if supplied indexes exist and create them if they don't exist.
 * Takes no callback.
 *
 * @method createIndexesIfNotExist
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @param {Array} indexesData Array containing individual index data. Example: [ { name: 'field1' }, { name: 'field2' }, { name: 'field1_and_field2', columns: ['field1', 'field2'] }, ...]
 * @return {Promise} Returns a promise resolved on successful creation/existence of indexes and rejected on error
 */
function createIndexesIfNotExist(dbName, tableName, indexesData) {
  return Promise.all(
    indexesData.map(function(indexData) {
      return createIndexIfNotExists(dbName, tableName, indexData.name, indexData.columns);
    })
  );
}

/*
 * Checks if an index exists and drops if it does.
 * Takes no callback.
 *
 * @method dropIndexIfExists
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @param {String} indexName Index name
 * @return {Promise} Returns a promise resolved on successful deletion of index and rejected on error
 */
function dropIndexIfExists(dbName, tableName, indexName) {
  return new Promise(function(resolve, reject) {
    indexExists(dbName, tableName, indexName)
      .then(function(indexFound) {
        return indexFound ? resolve(dropIndex(dbName, tableName, indexName)) : resolve(true);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/*
 * Checks if indexes exist and drops them if they do
 * Takes no callback.
 *
 * @method dropIndexIfExists
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @param {String} indexNames Index name(s)
 * @return {Promise} Returns a promise resolved on successful deletion of index and rejected on error
 */
function dropIndexesIfExist(dbName, tableName, indexNames) {
  if (indexNames instanceof String) {
    return dropIndexIfExists(dbName, tableName, indexNames);
  }
  return Promise.all(
    indexNames.map(function(indexName) {
      return dropIndexIfExists(dbName, tableName, indexName);
    })
  );
}

function init(dbConfig) {
  r = rethinkdbdash(dbConfig);
  return {
    r: r,
    getDbList: getDbList,
    dbExists: dbExists,
    createDb: createDb,
    dropDb: dropDb,
    createDbIfNotExists: createDbIfNotExists,
    createDbsIfNotExist: createDbsIfNotExist,
    dropDbIfExists: dropDbIfExists,
    dropDbsIfExist: dropDbsIfExist,
    getTableList: getTableList,
    tableExists: tableExists,
    createTable: createTable,
    dropTable: dropTable,
    createTableIfNotExists: createTableIfNotExists,
    createTablesIfNotExist: createTablesIfNotExist,
    dropTableIfExists: dropTableIfExists,
    dropTablesIfExist: dropTablesIfExist,
    getIndexList: getIndexList,
    indexExists: indexExists,
    createIndex: createIndex,
    dropIndex: dropIndex,
    createIndexIfNotExists: createIndexIfNotExists,
    createIndexesIfNotExist: createIndexesIfNotExist,
    dropIndexIfExists: dropIndexIfExists,
    dropIndexesIfExist: dropIndexesIfExist,
    resetTable: resetTable,
    resetTables: resetTables,
    resetDb: resetDb
  };
}

module.exports = init;
