'use strict';

var debug = require('debug')('dblayer:index');
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
      .catch(reject);
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
      .catch(reject);
  });
}

/*
 * Checks if databases exist and returns and array of dbs found.
 * Takes no callback.
 *
 * @method dbsExist
 * @param {Array} dbNames The names of the databases to check
 * @return {Promise} Returns a promise resolved on successful calcuation and rejected on error
 */
function dbsExist(dbNames) {
  if (!dbNames) {
    return Promise.resolve([]);
  }

  if (!(dbNames instanceof Array)) {
    dbNames = [dbNames];
  }

  return new Promise(function(resolve, reject) {
    getDbList()
      .then(function(databaseNames) {
        var dbsFound = dbNames.filter(function(dbName) {
          return databaseNames.indexOf(dbName) > -1;
        });
        debug('Databases found?', dbsFound.length);
        resolve(dbsFound);
      })
      .catch(reject);
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  return new Promise(function(resolve, reject) {
    r.dbCreate(dbName).run()
      .then(function(result) {
        debug('New database', dbName, 'created?', result.dbs_created === 1);
        resolve(result.dbs_created === 1);
      })
      .catch(reject);
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  return new Promise(function(resolve, reject) {
    r.dbDrop(dbName).run()
      .then(function(result) {
        debug('Database', dbName, 'dropped?', result.dbs_dropped === 1);
        resolve(result.dbs_dropped === 1);
      })
      .catch(reject);
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  return new Promise(function(resolve, reject) {
    dbExists(dbName)
      .then(function(dbFound) {
        return dbFound ? resolve(dbFound) : resolve(createDb(dbName));
      })
      .catch(reject);
  });
}

/*
 * Checks if databases exist and creates them if they don't
 * Takes no callback.
 *
 * @method createDbsIfNotExist
 * @param {String} dbNames Database name(s)
 * @return {Promise} Returns a promise resolved on successful creation and rejected on error
 */
function createDbsIfNotExist(dbNames) {
  if (!dbNames) {
    return Promise.reject(new Error('No database names specified'));
  }

  if (!(dbNames instanceof Array)) {
    dbNames = [dbNames];
  }

  return new Promise(function(resolve, reject) {
    dbsExist(dbNames)
      .then(function(dbsFound) {
        var dbsNotFound = dbNames.filter(function(dbName) {
          return dbsFound.indexOf(dbName) < 0;
        });
        resolve(Promise.all(
          dbsNotFound.map(function(dbName) {
            return createDb(dbName);
          })
        ));
      })
      .catch(reject);
  });
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
      .catch(reject);
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
  if (!dbNames) {
    return Promise.resolve();
  }

  if (!(dbNames instanceof Array)) {
    dbNames = [dbNames];
  }

  return new Promise(function(resolve, reject) {
    dbsExist(dbNames)
      .then(function(dbsFound) {
        resolve(Promise.all(
          dbsFound.map(function(dbName) {
            return dropDb(dbName);
          })
        ));
      })
      .catch(reject);
  });
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  return new Promise(function(resolve, reject) {
    getTableList(dbName)
      .then(function(tableNames) {
        resolve(resetTables(dbName, tableNames));
      })
      .catch(reject);
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  return new Promise(function(resolve, reject) {
    r.db(dbName).tableList().run()
      .then(function(tableNames) {
        debug('Total tables in database', dbName, tableNames.length);
        resolve(tableNames);
      })
      .catch(reject);
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  return new Promise(function(resolve, reject) {
    getTableList(dbName)
      .then(function(tableNames) {
        var tableFound = tableNames.indexOf(tableName) > -1;
        debug('Table', tableName, 'in database', dbName, 'found?', tableFound);
        resolve(tableFound);
      })
      .catch(reject);
  });
}

/*
 * Checks if tables exist in database.
 * Takes no callback.
 *
 * @method tablesExist
 * @param {String} dbName Database name
 * @param {Array} tableNames Table names
 * @return {Promise} Returns a promise resolved on successful check and rejected on error
 */
function tablesExist(dbName, tableNames) {
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }

  if (!tableNames) {
    return Promise.resolve([]);
  }

  if (!(tableNames instanceof Array)) {
    tableNames = [tableNames];
  }

  return new Promise(function(resolve, reject) {
    getTableList(dbName)
      .then(function(tables) {
        var tablesFound = tableNames.filter(function(tableName) {
          return tables.indexOf(tableName) > -1;
        });
        debug('Tables found in database', dbName, tablesFound.length);
        resolve(tablesFound);
      })
      .catch(reject);
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableName) {
    return Promise.reject(new Error('Table name not specified'));
  }
  return new Promise(function(resolve, reject) {
    r.db(dbName).tableCreate(tableName).run()
      .then(function(result) {
        debug('Table', tableName, 'in database', dbName, 'created?', result.tables_created === 1);
        resolve(result.tables_created === 1);
      })
      .catch(reject);
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableName) {
    return Promise.reject(new Error('Table name not specified'));
  }
  return new Promise(function(resolve, reject) {
    r.db(dbName).tableDrop(tableName).run()
      .then(function(result) {
        debug('Table', tableName, 'in database', dbName, 'dropped?', result.tables_dropped === 1);
        resolve(result.tables_dropped === 1);
      })
      .catch(reject);
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableName) {
    return Promise.reject(new Error('Table name not specified'));
  }
  return new Promise(function(resolve, reject) {
    tableExists(dbName, tableName)
      .then(function(tableFound) {
        return tableFound ? resolve(tableFound) : resolve(createTable(dbName, tableName));
      })
      .catch(reject);
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableNames) {
    return Promise.reject(new Error('Table names not specified'));
  }

  if (!(tableNames instanceof Array)) {
    tableNames = [tableNames];
  }

  return new Promise(function(resolve, reject) {
    tablesExist(dbName, tableNames)
      .then(function(tablesFound) {
        var tablesNotFound = tableNames.filter(function(tableName) {
          return tablesFound.indexOf(tableName) < 0;
        });
        resolve(Promise.all(
          tablesNotFound.map(function(tableName) {
            return createTable(dbName, tableName);
          })
        ));
      })
      .catch(reject);
  });
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  return new Promise(function(resolve, reject) {
    tableExists(dbName, tableName)
      .then(function(tableFound) {
        return tableFound ? resolve(dropTable(dbName, tableName)) : resolve(true);
      })
      .catch(reject);
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableNames) {
    return Promise.resolve([]);
  }

  if (!(tableNames instanceof Array)) {
    tableNames = [tableNames];
  }

  return new Promise(function(resolve, reject) {
    tablesExist(dbName, tableNames)
      .then(function(tablesFound) {
        resolve(Promise.all(
          tablesFound.map(function(tableName) {
            return dropTable(dbName, tableName);
          })
        ));
      })
      .catch(reject);
  });
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableName) {
    return Promise.reject(new Error('Table name not specified'));
  }
  return new Promise(function(resolve, reject) {
    r.db(dbName).table(tableName).delete().run()
      .then(function(result) {
        debug('Reset table', tableName);
        resolve(result);
      })
      .catch(reject);
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableNames) {
    return Promise.reject(new Error('Table names not specified'));
  }

  if (!(tableNames instanceof Array)) {
    tableNames = [tableNames];
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableName) {
    return Promise.reject(new Error('Table name not specified'));
  }
  return new Promise(function(resolve, reject) {
    r.db(dbName).table(tableName).indexList().run()
      .then(function(indexNames) {
        debug('Total indexes on table', tableName, 'in database', dbName, indexNames.length);
        resolve(indexNames);
      })
      .catch(reject);
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableName) {
    return Promise.reject(new Error('Table name not specified'));
  }
  return new Promise(function(resolve, reject) {
    getIndexList(dbName, tableName)
      .then(function(indexNames) {
          var indexFound = indexNames.indexOf(indexName) > -1;
          debug('Index', indexName, 'in table', tableName, 'in database', dbName, 'found?', indexFound);
          resolve(indexFound);
      })
      .catch(reject);
  });
}

function indexesExist(dbName, tableName, indexNames) {
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableName) {
    return Promise.reject(new Error('Table name not specified'));
  }
  if (!indexNames) {
    return Promise.resolve([]);
  }

  if (!(indexNames instanceof Array)) {
    indexNames = [indexNames];
  }

  return new Promise(function(resolve, reject) {
    getIndexList(dbName, tableName)
      .then(function(indexes) {
          var indexesFound = indexNames.filter(function(indexName) {
            return indexes.indexOf(indexName) > -1;
          });
          debug('Indexes found in table', tableName, 'in database', dbName, indexesFound.length);
          resolve(indexesFound);
      })
      .catch(reject);
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
 * @param {Function} fn An optional function describing index
 * @return {Promise} Returns a promise resolved on successful creation of index and rejected on error
 */
function createIndex(dbName, tableName, indexName, fn) {
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableName) {
    return Promise.reject(new Error('Table name not specified'));
  }
  if (!indexName) {
    return Promise.reject(new Error('Index name not specified'));
  }

  var indexCreateQuery = r.db(dbName).table(tableName);
  if (fn) {
    indexCreateQuery = indexCreateQuery.indexCreate(indexName, fn);
  } else {
    indexCreateQuery = indexCreateQuery.indexCreate(indexName);
  }

  return new Promise(function(resolve, reject) {
    indexCreateQuery.run()
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
        resolve(indexReady);
      })
      .catch(reject);
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableName) {
    return Promise.reject(new Error('Table name not specified'));
  }
  if (!indexName) {
    return Promise.reject(new Error('Index name not specified'));
  }
  return new Promise(function(resolve, reject) {
    r.db(dbName).table(tableName).indexDrop(indexName).run()
      .then(function(result) {
        debug('Index', indexName, 'in table', tableName, 'in database', dbName, 'dropped?', result.dropped === 1);
        resolve(result.dropped === 1);
      })
      .catch(reject);
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
 * @param {Function} fn An optional function describing index
 * @return {Promise} Returns a promise resolved on successful creation/existence of index and rejected on error
 */
function createIndexIfNotExists(dbName, tableName, indexName, fn) {
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableName) {
    return Promise.reject(new Error('Table name not specified'));
  }
  if (!indexName) {
    return Promise.reject(new Error('Index name not specified'));
  }
  return new Promise(function(resolve, reject) {
    indexExists(dbName, tableName, indexName)
      .then(function(indexFound) {
        return indexFound ? resolve(indexFound) : resolve(createIndex(dbName, tableName, indexName, fn));
      })
      .catch(reject);
  });
}

/*
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableName) {
    return Promise.reject(new Error('Table name not specified'));
  }
  if (!indexData) {
    return Promise.reject(new Error('Index data not specified'));
  }
  if (!(indexData instanceof Array)) {
    return Promise.reject(new Error('Index data should be an array'));
  }

  var indexNames = indexData.map(function(index) { return index.name; });

  return new Promise(function(resolve, reject) {
    indexesExist(dbName, tableName, indexNames)
      .then(function(indexesFound) {
        var indexesToCreate = indexData.filter(function(index) {
          return indexesFound.indexOf(index.name) < 0;
        });
        resolve(Promise.map(indexesToCreate, function(indexData) {
            return createIndex(dbName, tableName, indexData.name, indexData.fn);
          }, { concurrency: 1 })
        );
      })
      .catch(reject);
  });
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableName) {
    return Promise.reject(new Error('Table name not specified'));
  }
  if (!indexName) {
    return Promise.resolve(true);
  }
  return new Promise(function(resolve, reject) {
    indexExists(dbName, tableName, indexName)
      .then(function(indexFound) {
        return indexFound ? resolve(dropIndex(dbName, tableName, indexName)) : resolve(true);
      })
      .catch(reject);
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
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableName) {
    return Promise.reject(new Error('Table name not specified'));
  }
  if (!indexNames) {
    return Promise.resolve([]);
  }

  if (!(indexNames instanceof Array)) {
    indexNames = [indexNames];
  }

  return new Promise(function(resolve, reject) {
    indexesExist(dbName, tableName, indexNames)
      .then(function(indexesFound) {
        resolve(Promise.map(indexesFound, function(indexName) {
            return dropIndex(dbName, tableName, indexName);
          }, { concurrency: 1 })
        );
      })
      .catch(reject);
  });
}

/*
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
function migrate(dbName, tableData, indexData) {
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableData) {
    return Promise.reject(new Error('Table data not specified'));
  }
  if (!indexData) {
    return Promise.reject(new Error('Index data not specified'));
  }

  var tableNames = Object.keys(tableData).map(function(tableId) { return tableData[tableId]; });
  return new Promise(function(resolve, reject) {
    createDbIfNotExists(dbName)
      .then(function(dbCreatedOrFound) {
        if (dbCreatedOrFound) {
          return createTablesIfNotExist(dbName, tableNames);
        } else {
          reject(new Error('We dont have a database for unknown reasons'));
        }
      })
      .then(function(tableCreatedOrFound) {
        if (tableCreatedOrFound) {
          return Promise.all(
            Object.keys(indexData).map(function(tableId) {
              return createIndexesIfNotExist(dbName, tableData[tableId], indexData[tableId]);
            })
          );
        } else {
          reject(new Error('We dont have a database table for unknown reasons'));
        }
      })
      .then(function() {
        resolve(true);
      })
      .catch(reject);
  });
}

/**
 * Returns a database Model on the lines on ActiveRecord in Rails.
 * It exposes most internal ReQL functions.
 *
 * @method Model
 * @param {Object} r Rethinkdbdash instance
 * @param {String} dbName The database name
 * @param {String} tableName The table name
 * @return {Object} Return an object exposing wrappers around ReQL functions.
 */
function Model(r, dbName, tableName) {
  if (!r) {
    return Promise.reject(new Error('Rethinkdb instance required for generating queries'));
  }
  if (!dbName) {
    return Promise.reject(new Error('Database name not specified'));
  }
  if (!tableName) {
    return Promise.reject(new Error('Table name not specified'));
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
    table: table,
    dbName: dbName,
    tableName: tableName,
    model: table()
  };
}

function init(dbConfig) {
  r = rethinkdbdash(dbConfig);
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

module.exports = init;
