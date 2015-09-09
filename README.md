# Jamadar #

Simplified database, table and index management functions for rethinkdb.

### How To Install? ###

```bash
npm install --save jamadar
```

### Features

* Promise based
* Uses [Bluebird](https://github.com/petkaantonov/bluebird), so it should be fast
* Uses [rethinkdbdash](https://github.com/neumino/rethinkdbdash), so that you don't have to deal with connection pooling etc.
* Extensive test converage.

### How To Use? ###

Sample configuration file `config.js`.

```javascript
'use strict';

module.exports = {
  rethinkdb: {
    servers: [
      { host: 'localhost', port: 28015 }
    ],
    buffer: 20, //Minimum connections in pool
    max: 100, //Maximum connections in pool
    discovery: false,
    db: 'lolstack_dev'
  },
  tables: {
    url: 'urls',
    user: 'users',
    network: 'networks',
    schedule: 'schedules',
    post: 'posts',
    picture: 'pictures'
  },
  indexes: {
    user: [
      { name: 'username' },
      { name: 'email' }
    ],
    url: [
      { name: 'url' },
      { name: 'post_id' },
      { name: 'created_at' },
      { name: 'updated_at' },
      { name: 'url_and_post_id', columns: [ 'url', 'post_id' ] }
    ],
    network: [
      { name: 'name' }
    ],
    schedule: [
      { name: 'nickname' },
      { name: 'user_id' }
    ],
    post: [
      { name: 'user_id' },
      { name: 'network_id' },
      { name: 'schedule_id' }
    ],
    picture: [
      { name: 'user_id' }
    ]
  }
};
```

Sample application using `Jamadar` with migration.

```javascript
'use strict';

var path = require('path');

var config = require(path.join(__dirname, 'config'));
var db = require('jamadar')(config.rethinkdb);

db.migrate(config.rethinkdb.db, config.tables, config.indexes)
  .then(function(result) {
    debug('Database setup complete.');
    // Database is migrated
    // Continue with regular tasks here.
    // Start express server may be.
  })
  .catch(function(error) {
    debug('Error in migrating database', error.message);
    debug(error.stack);
  });
```

The `config.rethinkdb` options Object must be same as options you'd provide to [rethinkdbdash](https://github.com/neumino/rethinkdbdash).

### Testing

```bash
npm test
```

Check `test/config.js` if your rethinkdb is not listening on default ports.

## Documentation

  * [Jamadar](#jamadar)
  * [Jamadar#r](#r)
  * [Jamadar#getDbList](#getDbList)
  * [Jamadar#dbExists](#dbExists)
  * [Jamadar#dbsExist](#dbsExist)
  * [Jamadar#createDb](#createDb)
  * [Jamadar#dropDb](#dropDb)
  * [Jamadar#createDbIfNotExists](#createDbIfNotExists)
  * [Jamadar#createDbsIfNotExist](#createDbsIfNotExist)
  * [Jamadar#dropDbIfExists](#dropDbIfExists)
  * [Jamadar#dropDbsIfExist](#dropDbsIfExist)
  * [Jamadar#getTableList](#getTableList)
  * [Jamadar#tableExists](#tableExists)
  * [Jamadar#tablesExist](#tablesExist)
  * [Jamadar#createTable](#createTable)
  * [Jamadar#dropTable](#dropTable)
  * [Jamadar#createTableIfNotExists](#createTableIfNotExists)
  * [Jamadar#createTablesIfNotExist](#createTablesIfNotExist)
  * [Jamadar#dropTableIfExists](#dropTableIfExists)
  * [Jamadar#dropTablesIfExist](#dropTablesIfExist)
  * [Jamadar#getIndexList](#getIndexList)
  * [Jamadar#indexExists](#indexExists)
  * [Jamadar#indexesExist](#indexesExist)
  * [Jamadar#createIndex](#createIndex)
  * [Jamadar#dropIndex](#dropIndex)
  * [Jamadar#createIndexIfNotExists](#createIndexIfNotExists)
  * [Jamadar#createIndexesIfNotExist](#createIndexesIfNotExist)
  * [Jamadar#dropIndexIfExists](#dropIndexIfExists)
  * [Jamadar#dropIndexesIfExist](#dropIndexesIfExist)
  * [Jamadar#resetTable](#resetTable)
  * [Jamadar#resetTables](#resetTables)
  * [Jamadar#resetDb](#resetDb)
  * [Jamadar#migrate](#migrate)
  * [Jamadar#Model](#Model)
  * [Jamadar#Model#table](#table)

## Reference

<a name="jamadar" />
#### Jamadar

Jamadar constructor. Needs a configuration object same as you'd pass to rethinkdbdash.
It initialized rethinkdbdash internally.

```javascript
var Jamadar = require('jamadar');
var db = Jamadar({
    servers: [
      { host: 'localhost', port: 28015 }
    ],
    db: 'jamadar_test_afj928dfas'
  });
```

<a name="r" />
#### Jamadar#r

Returns the rethinkdbdash instance in case you need it.

<a name="getDbList" />
#### `function getDbList()`

Get a list of databases. Takes no callback.

 * **Returns:** {Promise} Returns a promise resolved on successful fetch and rejected on error

<a name="dbExists" />
#### `function dbExists(dbName)`

Checks if a database exists or not. Takes no callback.

 * **Parameters:** `{String}` — dbName The name of the database to check
 * **Returns:** {Promise} Returns a promise resolved on successful calcuation and rejected on error

<a name="dbsExist" />
#### `function dbsExist(dbNames)`

Checks if databases exist and returns and array of dbs found. Takes no callback.

 * **Parameters:** `{Array}` — dbNames The names of the databases to check
 * **Returns:** {Promise} Returns a promise resolved on successful calcuation and rejected on error

<a name="createDb" />
#### `function createDb(dbName)`

Creates a new database with given name. Takes no callback.

 * **Parameters:** `{String}` — dbName Database name
 * **Returns:** {Promise} Returns a promise resolved on successful creation and rejected on error

<a name="dropDb" />
#### `function dropDb(dbName)`

Drops a database. Takes no callback.

 * **Parameters:** `{String}` — dbName Database name
 * **Returns:** {Promise} Returns a promise resolved on successful drop and rejected on error

<a name="createDbIfNotExists" />
#### `function createDbIfNotExists(dbName)`

Checks if a database exists and creates it if it doesn't. Takes no callback.

 * **Parameters:** `{String}` — dbName Database name
 * **Returns:** {Promise} Returns a promise resolved on successful creation/existence and rejected on error

<a name="createDbsIfNotExist" />
#### `function createDbsIfNotExist(dbNames)`

Checks if databases exist and creates them if they don't. Takes no callback.

 * **Parameters:** `{String}` — dbNames Database name(s)
 * **Returns:** {Promise} Returns a promise resolved on successful creation and rejected on error

<a name="dropDbIfExists" />
#### `function dropDbIfExists(dbName)`

Checks if a database exists and drops it if it does. Takes no callback.

 * **Parameters:** `{String}` — dbName Database name
 * **Returns:** {Promise} Returns a promise resolved on successful drop and rejected on error

<a name="dropDbsIfExist" />
#### `function dropDbsIfExist(dbNames)`

Checks if databases exist and drops them if they do. Takes no callback.

 * **Parameters:** `{String}` — dbNames Database name(s)
 * **Returns:** {Promise} Returns a promise resolved on successful drop and rejected on error

<a name="getTableList" />
#### `function resetDb(dbName)`

Reset all the tables of a database. It doesn't delete the tables but delete the rows in tables. Takes no callback.

 * **Parameters:** `{String}` — dbName Database name
 * **Returns:** {Promise} Returns a promise resolved on successful reset and rejected on error

<a name="tableExists" />
#### `function getTableList(dbName)`

Retrieves the list of tables in a database. Takes no callback.

 * **Parameters:** `{String}` — dbName Database name
 * **Returns:** {Promise} Returns a promise resolved on successful retrieval and rejected on error

<a name="tablesExist" />
#### `function tableExists(dbName, tableName)`

Checks if a table exists in database. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{String}` — tableName Table name
 * **Returns:** {Promise} Returns a promise resolved on successful check and rejected on error

<a name="createTable" />
#### `function tablesExist(dbName, tableNames)`

Checks if tables exist in database. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{Array}` — tableNames Table names
 * **Returns:** {Promise} Returns a promise resolved on successful check and rejected on error

<a name="dropTable" />
#### `function createTable(dbName, tableName)`

Creates a table in the database. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{String}` — tableName Table name
 * **Returns:** {Promise} Returns a promise resolved on successful creation and rejected on error

<a name="createTableIfNotExists" />
#### `function dropTable(dbName, tableName)`

Drops a table in the database. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{String}` — tableName Table name
 * **Returns:** {Promise} Returns a promise resolved on successful drop and rejected on error

<a name="createTablesIfNotExist" />
#### `function createTableIfNotExists(dbName, tableName)`

Checks if a table exists and creates it if it doesn't. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{String}` — tableName Table name
 * **Returns:** {Promise} Returns a promise resolved on successful creation/existence and rejected on error

<a name="dropTableIfExists" />
#### `function createTablesIfNotExist(dbName, tableNames)`

Checks if tables exist and creates them if they don't. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{String}` — tableNames Table name(s)
 * **Returns:** {Promise} Returns a promise resolved on successful creation/existence and rejected on error

<a name="dropTablesIfExist" />
#### `function dropTableIfExists(dbName, tableName)`

Checks if a table exists and drops it if it does. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{String}` — tableName Table name
 * **Returns:** {Promise} Returns a promise resolved on successful drop and rejected on error

<a name="getIndexList" />
#### `function dropTablesIfExist(dbName, tableNames)`

Checks if tables exist and drops them if they do. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{String}` — tableNames Table name(s)
 * **Returns:** {Promise} Returns a promise resolved on successful drop and rejected on error

<a name="indexExists" />
#### `function resetTable(dbName, tableName)`

Deletes all rows in a table. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{String}` — tableName Table name
 * **Returns:** {Promise} Returns a promise resolved on successful deletion and rejected on error

<a name="indexesExist" />
#### `function resetTables(dbName, tableNames)`

Deletes all rows in given tables. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{Array|String}` — tableNames Table name(s)
 * **Returns:** {Promise} Returns a promise resolved on successful deletion and rejected on error

<a name="createIndex" />
#### `function getIndexList(dbName, tableName)`

Fetches all indexes on a given table. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{String}` — tableName Table name
 * **Returns:** {Promise} Returns a promise resolved on successful fetch and rejected on error

<a name="dropIndex" />
#### `function indexExists(dbName, tableName, indexName)`

Checks if an index exists for a table or not. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{String}` — tableName Table name
   * `{String}` — indexName Index name
 * **Returns:** {Promise} Returns a promise resolved on successful check and rejected on error

<a name="createIndexIfNotExists" />
#### `function indexesExist(dbName, tableName, indexNames)`

Checks if indexes exists for a table or not. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{String}` — tableName Table name
   * `{Array}` — indexNames Index names
 * **Returns:** {Promise} Returns a promise resolved on successful check and rejected on error

<a name="createIndexesIfNotExist" />
#### `function createIndex(dbName, tableName, indexName, fn)`

Creates specified index and waits on it. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{String}` — tableName Table name
   * `{String}` — indexName Index name
   * `{Function}` — fn An optional function describing index
 * **Returns:** {Promise} Returns a promise resolved on successful creation of index and rejected on error

<a name="dropIndexIfExists" />
#### `function dropIndex(dbName, tableName, indexName)`

Drops specified index. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{String}` — tableName Table name
   * `{String}` — indexName Index name
 * **Returns:** {Promise} Returns a promise resolved on successful deletion of index and rejected on error

<a name="dropIndexesIfExist" />
#### `function createIndexIfNotExists(dbName, tableName, indexName, fn)`

Check if an index exists and creates if it doesn't. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{String}` — tableName Table name
   * `{String}` — indexName Index name
   * `{Function}` — fn An optional function describing index
 * **Returns:** {Promise} Returns a promise resolved on successful creation/existence of index and rejected on error

<a name="resetTable" />
#### `function createIndexesIfNotExist(dbName, tableName, indexData)`

Checks if supplied indexes exist and create them if they don't exist. Takes no callback.

Example: [ { name: 'field1' }, { name: 'field2' }, { name: 'field1_and_field2', fn: function(row) { return [row('field1'), row('field2')]; } }, ... ]

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{String}` — tableName Table name
   * `{Array}` — indexData Array containing individual index data.
 * **Returns:** {Promise} Returns a promise resolved on successful creation/existence of indexes and rejected on error

<a name="resetTables" />
#### `function dropIndexIfExists(dbName, tableName, indexName)`

Checks if an index exists and drops if it does. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{String}` — tableName Table name
   * `{String}` — indexName Index name
 * **Returns:** {Promise} Returns a promise resolved on successful deletion of index and rejected on error

<a name="resetDb" />
#### `function dropIndexesIfExist(dbName, tableName, indexNames)`

Checks if indexes exist and drops them if they do. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{String}` — tableName Table name
   * `{String}` — indexNames Index name(s)
 * **Returns:** {Promise} Returns a promise resolved on successful deletion of index and rejected on error

<a name="migrate" />
#### `function migrate(dbName, tables, indexes)`

Migrates database to a provided configuration. Takes no callback.

 * **Parameters:**
   * `{String}` — dbName Database name
   * `{Object}` — tableData Object describing tables.
   * `{Array}` — indexData Array of objects containing index data.
 * **Returns:** {Promise} Returns a promise resolved on and rejected on error

`tableData` example:

```javascript
  {
    tableId: 'tableName',
    user: 'users',
    schedule: 'schedules'
  }
```

`indexData` example:

```javascript
  {
    tableId: [
      { name: 'field1' },
      { name: 'field2' },
      { name: 'field2_and_field3_index', [ 'field2', 'field3' ] }
    ],
    user: [
      { name: 'username' },
      { name: 'email' }
    ]
  }
```

<a name="Model" />
#### `function Model(dbName, tableName)`

Returns a database Model on the lines on ActiveRecord in Rails. It exposes most internal ReQL functions.

 * **Parameters:**
   * `{Object}` — r Rethinkdbdash instance
   * `{String}` — dbName The database name
   * `{String}` — tableName The table name
 * **Returns:** {Object} Return an object exposing wrappers around ReQL functions.

 Example:

```javascript
var Jamadar = require('Jamadar')(dbConfig);
var User = Jamadar.Model('databasename', 'users').table();
// Now User is same as r.db('databasename').table('users');

User.get(id).update({ name: 'Kulbir Saini' }).run()
  .then(function(result) {
    console.log(result);
  });
```

<a name="table" />
#### `function table()`

Returns a rethinkdb query object with table selected.

 * **Returns:** {Query} A rethinkdb query object

See [Jamadar#Model](#model) for an example.

## License

(The MIT License)

Copyright (c) 2015 Kulbir Saini

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
