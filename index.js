'use strict';

var _ = require('lodash');
var debug = require('debug')('jamadar:index');
var BPromise = require('bluebird');
var rethinkdbdash = require('rethinkdbdash');

var r = null;

/**
 * Makes sure that we have an array of strings in the end.
 *
 * @method toArrayOfStrings
 * @param {Anything} names
 * @return {Array|Null} If names is not a string or an array of strings, it'd return null. An array otherwise.
 */
function toArrayOfStrings(names) {
  if (!names) {
    return null;
  } else if (_.isString(names)) {
    return [names];
  } else if (_.isArray(names)) {
    var allStrings = _.all(names, function(name) {
      return _.isString(name);
    });
    return (allStrings) ? names : null;
  }
  return null;
}

/**
 * Return Error object for the given key.
 *
 * @method errorFor
 * @param {String} key Error key
 * @return {Error} Error object
 */
function errorFor(key) {
  var messages = {
    dbNameNotString: 'Database name not specified or not a string',
    dbNamesNotStrings: 'Database names not specified or contain non strings',
    tableNameNotString: 'Table name not specified or not a string',
    tableNamesNotStrings: 'Table names not specified or contain non strings',
    indexNameNotString: 'Index name not specified or not a string',
    indexNamesNotStrings: 'Index names not specified or contain non strings',
    indexDataInvalid: 'Index data not specified or not an array'
  };
  return Error(messages[key]);
}

/**
 * Verifies is arguments passed are valid.
 *
 * @method verifyArgs
 * @param {Object} args An object containing arguments
 * @return {Error|Boolean} If args are valid, it'll return true. An Error object otherwise.
 */
function verifyArgs(args) {
  var toVerify = Object.keys(args);

  if (toVerify.indexOf('dbName') > -1 && !_.isString(args.dbName)) {
    return errorFor('dbNameNotString');
  }

  if (toVerify.indexOf('dbNames') > -1 && !args.dbNames) {
    return errorFor('dbNamesNotStrings');
  }

  if (toVerify.indexOf('tableName') > -1 && !_.isString(args.tableName)) {
    return errorFor('tableNameNotString');
  }

  if (toVerify.indexOf('tableNames') > -1 && !args.tableNames) {
    return errorFor('tableNamesNotStrings');
  }

  if (toVerify.indexOf('indexName') > -1 && !_.isString(args.indexName)) {
    return errorFor('indexNameNotString');
  }

  if (toVerify.indexOf('indexNames') > -1 && !args.indexNames) {
    return errorFor('indexNamesNotStrings');
  }

  if (toVerify.indexOf('indexData') > -1 && !_.isArray(args.indexData)) {
    return errorFor('indexDataInvalid');
  }
  return true;
}

/**
 * Get a list of databases.
 * Takes no callback.
 *
 * @method getDbList
 * @return {Promise} Returns a promise resolved on successful fetch and rejected on error
 */
function getDbList() {
  return r.dbList().run()
    .then(function(databaseNames) {
      debug('Total databases', databaseNames.length);
      return databaseNames;
    });
}

/**
 * Checks if a database exists or not.
 * Takes no callback.
 *
 * @method dbExists
 * @param {String} dbName The name of the database to check
 * @return {Promise} Returns a promise resolved on successful calcuation and rejected on error
 */
function dbExists(dbName) {
  return getDbList()
    .then(function(databaseNames) {
      var dbFound = databaseNames.indexOf(dbName) > -1;
      debug('Database', dbName, 'found?', dbFound);
      return dbFound;
    });
}

/**
 * Checks if databases exist and returns and array of dbs found.
 * Takes no callback.
 *
 * @method dbsExist
 * @param {Array} dbNames The names of the databases to check
 * @return {Promise} Returns a promise resolved on successful calcuation and rejected on error
 */
function dbsExist(dbNames) {
  dbNames = toArrayOfStrings(dbNames);

  if (!dbNames) {
    return BPromise.resolve([]);
  }

  return getDbList()
    .then(function(databaseNames) {
      var dbsFound = dbNames.filter(function(dbName) {
        return databaseNames.indexOf(dbName) > -1;
      });
      debug('Databases found?', dbsFound.length);
      return dbsFound;
    });
}

/**
 * Creates a new database with given name.
 * Takes no callback.
 *
 * @method createDb
 * @param {String} dbName Database name
 * @return {Promise} Returns a promise resolved on successful creation and rejected on error
 */
function createDb(dbName) {
  var verified = verifyArgs({ dbName: dbName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  return r.dbCreate(dbName).run()
    .then(function(result) {
      debug('New database', dbName, 'created?', result.dbs_created === 1);
      return result.dbs_created === 1;
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
  var verified = verifyArgs({ dbName: dbName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  return r.dbDrop(dbName).run()
    .then(function(result) {
      debug('Database', dbName, 'dropped?', result.dbs_dropped === 1);
      return result.dbs_dropped === 1;
    });
}

/**
 * Checks if a database exists and creates it if it doesn't
 * Takes no callback.
 *
 * @method createDbIfNotExists
 * @param {String} dbName Database name
 * @return {Promise} Returns a promise resolved on successful creation/existence and rejected on error
 */
function createDbIfNotExists(dbName) {
  var verified = verifyArgs({ dbName: dbName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  return dbExists(dbName)
    .then(function(dbFound) {
      return dbFound ? dbFound : createDb(dbName);
    });
}

/**
 * Checks if databases exist and creates them if they don't
 * Takes no callback.
 *
 * @method createDbsIfNotExist
 * @param {String} dbNames Database name(s)
 * @return {Promise} Returns a promise resolved on successful creation and rejected on error
 */
function createDbsIfNotExist(dbNames) {
  dbNames = toArrayOfStrings(dbNames);
  var verified = verifyArgs({ dbNames: dbNames });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  return dbsExist(dbNames)
    .then(function(dbsFound) {
      var dbsNotFound = dbNames.filter(function(dbName) {
        return dbsFound.indexOf(dbName) < 0;
      });
      return BPromise.all(
        dbsNotFound.map(function(dbName) {
          return createDb(dbName);
        })
      );
    });
}

/**
 * Checks if a database exists and drops it if it does.
 * Takes no callback.
 *
 * @method dropDbIfExists
 * @param {String} dbName Database name
 * @return {Promise} Returns a promise resolved on successful drop and rejected on error
 */
function dropDbIfExists(dbName) {
  return dbExists(dbName)
    .then(function(dbFound) {
      return dbFound ? dropDb(dbName) : true;
    });
}

/**
 * Checks if databases exist and drops them if they do.
 * Takes no callback.
 *
 * @method dropDbIfExists
 * @param {String} dbNames Database name(s)
 * @return {Promise} Returns a promise resolved on successful drop and rejected on error
 */
function dropDbsIfExist(dbNames) {
  dbNames = toArrayOfStrings(dbNames);

  if (!dbNames) {
    return BPromise.resolve();
  }

  return dbsExist(dbNames)
    .then(function(dbsFound) {
      return BPromise.all(
        dbsFound.map(function(dbName) {
          return dropDb(dbName);
        })
      );
    });
}

/**
 * Reset all the tables of a database. It doesn't delete the tables but delete the rows in tables.
 * Takes no callback.
 *
 * @method resetDb
 * @param {String} dbName Database name
 * @return {Promise} Returns a promise resolved on successful reset and rejected on error
 */
function resetDb(dbName) {
  var verified = verifyArgs({ dbName: dbName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  return getTableList(dbName)
    .then(function(tableNames) {
      return resetTables(dbName, tableNames);
    });
}

/**
 * Retrieves the list of tables in a database.
 * Takes no callback.
 *
 * @method getTableList
 * @param {String} dbName Database name
 * @return {Promise} Returns a promise resolved on successful retrieval and rejected on error
 */
function getTableList(dbName) {
  var verified = verifyArgs({ dbName: dbName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  return r.db(dbName).tableList().run()
    .then(function(tableNames) {
      debug('Total tables in database', dbName, tableNames.length);
      return tableNames;
    });
}

/**
 * Checks if a table exists in database.
 * Takes no callback.
 *
 * @method tableExists
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @return {Promise} Returns a promise resolved on successful check and rejected on error
 */
function tableExists(dbName, tableName) {
  var verified = verifyArgs({ dbName: dbName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  return getTableList(dbName)
    .then(function(tableNames) {
      var tableFound = tableNames.indexOf(tableName) > -1;
      debug('Table', tableName, 'in database', dbName, 'found?', tableFound);
      return tableFound;
    });
}

/**
 * Checks if tables exist in database.
 * Takes no callback.
 *
 * @method tablesExist
 * @param {String} dbName Database name
 * @param {Array} tableNames Table names
 * @return {Promise} Returns a promise resolved on successful check and rejected on error
 */
function tablesExist(dbName, tableNames) {
  var verified = verifyArgs({ dbName: dbName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  tableNames = toArrayOfStrings(tableNames);

  if (!tableNames) {
    return BPromise.resolve([]);
  }

  return getTableList(dbName)
    .then(function(tables) {
      var tablesFound = tableNames.filter(function(tableName) {
        return tables.indexOf(tableName) > -1;
      });
      debug('Tables found in database', dbName, tablesFound.length);
      return tablesFound;
    });
}

/**
 * Creates a table in the database.
 * Takes no callback.
 *
 * @method createTable
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @return {Promise} Returns a promise resolved on successful creation and rejected on error
 */
function createTable(dbName, tableName) {
  var verified = verifyArgs({ dbName: dbName, tableName: tableName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  return r.db(dbName).tableCreate(tableName).run()
    .then(function(result) {
      debug('Table', tableName, 'in database', dbName, 'created?', result.tables_created === 1);
      return result.tables_created === 1;
    });
}

/**
 * Drops a table in the database.
 * Takes no callback.
 *
 * @method dropTable
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @return {Promise} Returns a promise resolved on successful drop and rejected on error
 */
function dropTable(dbName, tableName) {
  var verified = verifyArgs({ dbName: dbName, tableName: tableName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  return r.db(dbName).tableDrop(tableName).run()
    .then(function(result) {
      debug('Table', tableName, 'in database', dbName, 'dropped?', result.tables_dropped === 1);
      return result.tables_dropped === 1;
    });
}

/**
 * Checks if a table exists and creates it if it doesn't
 * Takes no callback.
 *
 * @method createTableIfNotExists
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @return {Promise} Returns a promise resolved on successful creation/existence and rejected on error
 */
function createTableIfNotExists(dbName, tableName) {
  var verified = verifyArgs({ dbName: dbName, tableName: tableName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  return tableExists(dbName, tableName)
    .then(function(tableFound) {
      return tableFound ? tableFound : createTable(dbName, tableName);
    });
}

/**
 * Checks if tables exist and creates them if they don't
 * Takes no callback.
 *
 * @method createTableIfNotExists
 * @param {String} dbName Database name
 * @param {String} tableNames Table name(s)
 * @return {Promise} Returns a promise resolved on successful creation/existence and rejected on error
 */
function createTablesIfNotExist(dbName, tableNames) {
  tableNames = toArrayOfStrings(tableNames);
  var verified = verifyArgs({ dbName: dbName, tableNames: tableNames });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  return tablesExist(dbName, tableNames)
    .then(function(tablesFound) {
      var tablesNotFound = tableNames.filter(function(tableName) {
        return tablesFound.indexOf(tableName) < 0;
      });
      return BPromise.all(
        tablesNotFound.map(function(tableName) {
          return createTable(dbName, tableName);
        })
      );
    });
}

/**
 * Checks if a table exists and drops it if it does.
 * Takes no callback.
 *
 * @method dropTableIfExists
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @return {Promise} Returns a promise resolved on successful drop and rejected on error
 */
function dropTableIfExists(dbName, tableName) {
  var verified = verifyArgs({ dbName: dbName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  if (!_.isString(tableName)) {
    return BPromise.resolve(true);
  }

  return tableExists(dbName, tableName)
    .then(function(tableFound) {
      return tableFound ? dropTable(dbName, tableName) : true;
    });
}

/**
 * Checks if tables exist and drops them if they do.
 * Takes no callback.
 *
 * @method dropTableIfExists
 * @param {String} dbName Database name
 * @param {String} tableNames Table name(s)
 * @return {Promise} Returns a promise resolved on successful drop and rejected on error
 */
function dropTablesIfExist(dbName, tableNames) {
  var verified = verifyArgs({ dbName: dbName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  tableNames = toArrayOfStrings(tableNames);

  if (!tableNames) {
    return BPromise.resolve([]);
  }

  return tablesExist(dbName, tableNames)
    .then(function(tablesFound) {
      return BPromise.all(
        tablesFound.map(function(tableName) {
          return dropTable(dbName, tableName);
        })
      );
    });
}

/**
 * Deletes all rows in a table.
 * Takes no callback.
 *
 * @method resetTable
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @return {Promise} Returns a promise resolved on successful deletion and rejected on error
 */
function resetTable(dbName, tableName) {
  var verified = verifyArgs({ dbName: dbName, tableName: tableName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  return r.db(dbName).table(tableName).delete().run()
    .then(function(result) {
      debug('Reset table', tableName);
      return result;
    });
}

/**
 * Deletes all rows in given tables.
 * Takes no callback.
 *
 * @method resetTables
 * @param {String} dbName Database name
 * @param {Array|String} tableNames Table name(s)
 * @return {Promise} Returns a promise resolved on successful deletion and rejected on error
 */
function resetTables(dbName, tableNames) {
  tableNames = toArrayOfStrings(tableNames);
  var verified = verifyArgs({ dbName: dbName, tableNames: tableNames });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  return BPromise.all(
    tableNames.map(function(tableName) {
      return resetTable(dbName, tableName);
    })
  );
}

/**
 * Fetches all indexes on a given table.
 * Takes no callback.
 *
 * @method getIndexList
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @return {Promise} Returns a promise resolved on successful fetch and rejected on error
 */
function getIndexList(dbName, tableName) {
  var verified = verifyArgs({ dbName: dbName, tableName: tableName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  return r.db(dbName).table(tableName).indexList().run()
    .then(function(indexNames) {
      debug('Total indexes on table', tableName, 'in database', dbName, indexNames.length);
      return indexNames;
    });
}

/**
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
  var verified = verifyArgs({ dbName: dbName, tableName: tableName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  if (!_.isString(indexName)) {
    return BPromise.resolve(false);
  }

  return getIndexList(dbName, tableName)
    .then(function(indexNames) {
      var indexFound = indexNames.indexOf(indexName) > -1;
      debug('Index', indexName, 'in table', tableName, 'in database', dbName, 'found?', indexFound);
      return indexFound;
    });
}

/**
 * Checks if indexes exists for a table or not.
 * Takes no callback.
 *
 * @method indexExists
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @param {Array} indexNames Index names
 * @return {Promise} Returns a promise resolved on successful check and rejected on error
 */
function indexesExist(dbName, tableName, indexNames) {
  var verified = verifyArgs({ dbName: dbName, tableName: tableName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  indexNames = toArrayOfStrings(indexNames);

  if (!indexNames) {
    return BPromise.resolve([]);
  }

  return getIndexList(dbName, tableName)
    .then(function(indexes) {
      var indexesFound = indexNames.filter(function(indexName) {
        return indexes.indexOf(indexName) > -1;
      });
      debug('Indexes found in table', tableName, 'in database', dbName, indexesFound.length);
      return indexesFound;
    });
}

/**
 * Creates specified index and waits on it.
 * Takes no callback.
 *
 * @method createIndex
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @param {String} indexName Index name
 * @param {Function} fn An optional function describing index
 * @return {Promise} Returns a promise resolved on successful creation of index and rejected on error
 */
function createIndex(dbName, tableName, indexName, fn) {
  var verified = verifyArgs({ dbName: dbName, tableName: tableName, indexName: indexName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  var indexCreateQuery = r.db(dbName).table(tableName);
  if (fn) {
    indexCreateQuery = indexCreateQuery.indexCreate(indexName, fn);
  } else {
    indexCreateQuery = indexCreateQuery.indexCreate(indexName);
  }

  return indexCreateQuery.run()
    .then(function(result) {
      debug('Index', indexName, 'in table', tableName, 'in database', dbName, 'created?', result.created === 1);
      return r.db(dbName).table(tableName).indexWait(indexName).run();
    })
    .then(function(result) {
      var index = result.filter(function(wait) {
        return wait.index === indexName;
      });
      var indexReady = index.length > 0 && index[0].ready;
      debug('Index', indexName, 'in table', tableName, 'in database', dbName, 'ready?', indexReady);
      return indexReady;
    });
}

/**
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
  var verified = verifyArgs({ dbName: dbName, tableName: tableName, indexName: indexName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  return r.db(dbName).table(tableName).indexDrop(indexName).run()
    .then(function(result) {
      debug('Index', indexName, 'in table', tableName, 'in database', dbName, 'dropped?', result.dropped === 1);
      return result.dropped === 1;
    });
}

/**
 * Check if an index exists and creates if it doesn't.
 * Takes no callback.
 *
 * @method createIndexIfNotExists
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @param {String} indexName Index name
 * @param {Function} fn An optional function describing index
 * @return {Promise} Returns a promise resolved on successful creation/existence of index and rejected on error
 */
function createIndexIfNotExists(dbName, tableName, indexName, fn) {
  var verified = verifyArgs({ dbName: dbName, tableName: tableName, indexName: indexName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  return indexExists(dbName, tableName, indexName)
    .then(function(indexFound) {
      return indexFound ? indexFound : createIndex(dbName, tableName, indexName, fn);
    });
}

/**
 * Checks if supplied indexes exist and create them if they don't exist.
 * Takes no callback.
 *
 * @method createIndexesIfNotExist
 * @param {String} dbName Database name
 * @param {String} tableName Table name
 * @param {Array} indexData Array containing individual index data.
 *    Example: [
 *      { name: 'field1' },
 *      { name: 'field2' },
 *      { name: 'field1_and_field2',
 *        fn: function(row) {
 *          return [row('field1'), row('field2')];
 *        }
 *      },
 *      ...
 *      ]
 * @return {Promise} Returns a promise resolved on successful creation/existence of indexes and rejected on error
 */
function createIndexesIfNotExist(dbName, tableName, indexData) {
  var indexNames = []; // Be paranoid and avoid issues due to variable hoisting
  var verified = verifyArgs({ dbName: dbName, tableName: tableName, indexData: indexData });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  indexNames = indexData.map(function(index) { return index.name; });

  return indexesExist(dbName, tableName, indexNames)
    .then(function(indexesFound) {
      var indexesToCreate = indexData.filter(function(index) {
        return indexesFound.indexOf(index.name) < 0;
      });
      return BPromise.all(
        indexesToCreate.map(function(indexData) {
          return createIndex(dbName, tableName, indexData.name, indexData.fn);
        })
      );
    });
}

/**
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
  var verified = verifyArgs({ dbName: dbName, tableName: tableName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  if (!_.isString(indexName)) {
    return BPromise.resolve(true);
  }

  return indexExists(dbName, tableName, indexName)
    .then(function(indexFound) {
      return indexFound ? dropIndex(dbName, tableName, indexName) : true;
    });
}

/**
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
  var verified = verifyArgs({ dbName: dbName, tableName: tableName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  indexNames = toArrayOfStrings(indexNames);

  if (!indexNames) {
    return BPromise.resolve([]);
  }

  return indexesExist(dbName, tableName, indexNames)
    .then(function(indexesFound) {
      return BPromise.all(
        indexesFound.map(function(indexName) {
          return dropIndex(dbName, tableName, indexName);
        })
      );
    });
}

/**
 * Migrates database to a provided configuration.
 * Takes no callback.
 *
 * @method migrate
 * @param {String} dbName Database name
 * @param {Object} tableData Object describing tables.
 *        Example:
 *        {
 *          tableId: 'tableName',
 *          user: 'users',
 *          schedule: 'schedules'
 *        }
 * @param {Array} indexData Array of objects containing index data.
 *        Example:
 *        {
 *          tableId: [
 *            { name: 'field1' },
 *            { name: 'field2' },
 *            { name: 'field2_and_field3_index', [ 'field2', 'field3' ] }
 *          ],
 *          user: [
 *            { name: 'username' },
 *            { name: 'email' }
 *          ]
 *        }
 * @return {Promise} Returns a promise resolved on and rejected on error
 */
function migrate(dbName, tableConfig) {
  var tableNames = [];
  var tableIndexes = {};
  var verified = verifyArgs({ dbName: dbName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  if (!_.isObject(tableConfig)) {
    return BPromise.reject(new Error('Table configuration not specified or not a valid object'));
  }

  Object.keys(tableConfig).forEach(function(tableId) {
    tableNames.push(tableConfig[tableId].table_name);
    if (_.isObject(tableConfig[tableId].indexes)) {
      tableIndexes[tableId] = tableConfig[tableId].indexes;
    }
  });

  return createDbIfNotExists(dbName)
    .then(function(dbCreatedOrFound) {
      if (!dbCreatedOrFound) {
        return BPromise.reject(new Error('We failed to create database for unknown reasons'));
      }
      return createTablesIfNotExist(dbName, tableNames);
    })
    .then(function(tablesCreatedOrFound) {
      if (!tablesCreatedOrFound) {
        return BPromise.reject(new Error('We failed to create tables for unknown reasons'));
      }
      return BPromise.map(Object.keys(tableIndexes), function(tableId) {
        return createIndexesIfNotExist(dbName, tableConfig[tableId].table_name, tableIndexes[tableId]);
      }, { concurrency: 2 });
    })
    .then(function() {
      return true;
    });
}

/**
 * Returns a database Model on the lines on ActiveRecord in Rails.
 * It exposes most internal ReQL functions.
 *
 * @method Model
 * @param {String} dbName The database name
 * @param {String} tableName The table name
 * @param {Object} r Rethinkdbdash instance
 * @return {Object} Return an object exposing wrappers around ReQL functions.
 */
function JamadarModel(dbName, tableName, r) {
  if (!(this instanceof JamadarModel)) {
    return new JamadarModel(dbName, tableName);
  }

  var verified = verifyArgs({ dbName: dbName, tableName: tableName });
  if (verified !== true) {
    return BPromise.reject(verified);
  }

  /**
   * Returns a query with table selected.
   *
   * @method table
   * @return {Query} A rethinkdb query
   */
  function table() {
    return r.db(dbName).table(tableName);
  }

  return {
    r: r,
    dbName: dbName,
    tableName: tableName,
    model: table()
  };
}

function Jamadar(dbConfig) {
  if(!(this instanceof Jamadar)){
    return new Jamadar(dbConfig);
  }

  r = rethinkdbdash(dbConfig);

  function Model(dbName, tableName) {
    return new JamadarModel(dbName, tableName, r);
  }

  return {
    r: r,
    getDbList: getDbList,
    dbExists: dbExists,
    dbsExist: dbsExist,
    createDb: createDb,
    dropDb: dropDb,
    createDbIfNotExists: createDbIfNotExists,
    createDbsIfNotExist: createDbsIfNotExist,
    dropDbIfExists: dropDbIfExists,
    dropDbsIfExist: dropDbsIfExist,
    getTableList: getTableList,
    tableExists: tableExists,
    tablesExist: tablesExist,
    createTable: createTable,
    dropTable: dropTable,
    createTableIfNotExists: createTableIfNotExists,
    createTablesIfNotExist: createTablesIfNotExist,
    dropTableIfExists: dropTableIfExists,
    dropTablesIfExist: dropTablesIfExist,
    getIndexList: getIndexList,
    indexExists: indexExists,
    indexesExist: indexesExist,
    createIndex: createIndex,
    dropIndex: dropIndex,
    createIndexIfNotExists: createIndexIfNotExists,
    createIndexesIfNotExist: createIndexesIfNotExist,
    dropIndexIfExists: dropIndexIfExists,
    dropIndexesIfExist: dropIndexesIfExist,
    resetTable: resetTable,
    resetTables: resetTables,
    resetDb: resetDb,
    migrate: migrate,
    Model: Model
  };
}

function init(dbConfig) {
  if (!Jamadar.singleton) {
    Jamadar.singleton = new Jamadar(dbConfig);
  }
  return Jamadar.singleton;
}

module.exports = init;
