/*jshint expr: true*/
'use strict';

var chai = require('chai');
chai.config.includeStack = true;
chai.config.showDiff = true;

var chaiAsPromised = require('chai-as-promised');
var path = require('path');

var config = require(path.join(__dirname, 'config'));
var dbLayer = require(path.join(__dirname, '../index'));

var db = dbLayer(config.rethinkdb);
var expect = chai.expect;
var should = chai.should();

chai.use(chaiAsPromised);

function dropDb(dbName, done) {
  db.dropDbIfExists(config.rethinkdb.db)
  .then(function(result) {
    done();
  })
  .catch(done);
}

/**
 * WARNING: The order of tests in this file is so important that you would want to shoot
 * yourself in the head resolving the errors that occur once you alter the order.
 */
//TODO FIXME write tests for functions which use instanceof method.
describe('Database Layer', function() {
  var tableNames = Object.keys(config.app.tables).map(function(tableId) { return config.app.tables[tableId]; });

  this.timeout(5000);

  before(function(done) {
    dropDb(config.rethinkdb.db, done);
  });

  after(function(done) {
    dropDb(config.rethinkdb.db, done);
  });

  describe('getDbList', function() {
    it('should return a list of database names', function(done) {
      db.getDbList()
        .then(function(result) {
          result.should.be.Array;
          result.should.not.contain(config.rethinkdb.db);
          done();
        })
        .catch(done);
    });
  });

  describe('dbExists', function() {
    it('should return false if a database does not exist', function(done) {
      db.dbExists(config.rethinkdb.db)
        .then(function(result) {
          result.should.be.false;
          done();
        })
        .catch(done);
    });
  });

  describe('createDb', function() {
    it('should throw an error if database is not specified', function() {
      expect(db.createDb.bind(db)).to.throw(Error);
    });

    it('should create a database', function(done) {
      db.createDb(config.rethinkdb.db)
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(done);
    });

    it('should throw an error if a database already exists', function() {
      db.createDb(config.rethinkdb.db).should.be.rejectedWith(Error);
    });
  });

  describe('getDbList', function() {
    it('should return an array containing databases', function(done) {
      db.getDbList()
        .then(function(result) {
          result.should.be.Array;
          result.should.contain(config.rethinkdb.db);
          done();
        })
        .catch(done);
    });
  });

  describe('dbExists', function() {
    it('should return true if a database exists', function(done) {
      db.dbExists(config.rethinkdb.db)
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(done);
    });
  });

  describe('dropDb', function() {
    it('should throw an error if database is not specified', function() {
      expect(db.dropDb.bind(db)).to.throw(Error);
    });

    it('should drop a database', function(done) {
      db.dropDb(config.rethinkdb.db)
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(done);
    });

    it('should throw an error when a database does not exist', function() {
      db.dropDb(config.rethinkdb.db).should.be.rejectedWith(Error);
    });
  });

  describe('createDbIfNotExists', function() {
    it('should throw an error if database is not specified', function() {
      expect(db.createDbIfNotExists.bind(db)).to.throw(Error);
    });

    it('should create a database if it does not exist', function(done) {
      db.createDbIfNotExists(config.rethinkdb.db)
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(done);
    });

    it('should create a database even if it does exist', function(done) {
      db.createDbIfNotExists(config.rethinkdb.db)
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(done);
    });

    it('should not throw an error', function() {
      db.createDbIfNotExists(config.rethinkdb.db).should.not.be.rejectedWith(Error);
    });
  });

  describe('dropDbIfExists', function() {
    it('should not throw an error if database is not specified', function() {
      db.dropDbIfExists().should.not.be.rejectedWith(Error);
    });

    it('should drop a database if it exists', function(done) {
      db.dropDbIfExists(config.rethinkdb.db)
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(done);
    });

    it('should not throw an Error if database does not exist', function() {
      db.dropDbIfExists(config.rethinkdb.db).should.not.be.rejectedWith(Error);
    });
  });

  describe('createDbsIfNotExist', function() {
    var dbs = [config.rethinkdb.db, config.rethinkdb.db + '_1' + config.rethinkdb.db + '_2'];

    it('should throw an error if database(s) are not specified', function() {
      expect(db.createDbsIfNotExist.bind(db)).to.throw(Error);
    });

    it('should create databases', function(done) {
      db.createDbsIfNotExist(dbs)
        .then(function(result) {
          result.should.be.Array;
          done();
        })
        .catch(done);
    });

    it('should not throw an Error if one or more of databases already exist', function() {
      db.createDbsIfNotExist(dbs).should.not.be.rejectedWith(Error);
    });
  });

  describe('dropDbsIfExist', function() {
    var dbs = [config.rethinkdb.db, config.rethinkdb.db + '_1' + config.rethinkdb.db + '_2'];

    it('should not throw an error if database(s) are not specified', function() {
      expect(db.dropDbsIfExist.bind(db)).to.not.throw(Error);
    });

    it('should create databases', function(done) {
      db.dropDbsIfExist(dbs)
        .then(function(result) {
          result.should.be.Array;
          done();
        })
        .catch(done);
    });

    it('should not throw an Error if one or more of databases already exist', function() {
      db.dropDbsIfExist(dbs).should.not.be.rejectedWith(Error);
    });
  });

  describe('getTableList', function() {
    it('should throw an error when database does not exist', function() {
      db.getTableList(config.rethinkdb.db).should.be.rejectedWith(Error);
    });

    it('should not throw an error when database is not specified', function() {
      expect(db.getTableList.bind(db)).to.throw(Error);
    });
  });

  describe('getTableList', function() {
    before(function(done) {
      db.createDbIfNotExists(config.rethinkdb.db)
        .then(function(result) {
          done();
        })
        .catch(done);
    });

    it('should return an empty list when there are no tables', function(done) {
      db.getTableList(config.rethinkdb.db)
        .then(function(result) {
          result.should.be.Array;
          result.should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should not throw an error when database exists', function() {
      db.getTableList(config.rethinkdb.db).should.not.be.rejectedWith(Error);
    });
  });

  describe('getTableList', function() {
    before(function(done) {
      db.createTablesIfNotExist(config.rethinkdb.db, tableNames)
        .then(function(result) {
          done();
        })
        .catch(done);
    });

    it('should return a list of tables', function(done) {
      db.getTableList(config.rethinkdb.db)
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(tableNames.length);
          results.forEach(function(result) {
            tableNames.should.contain(result);
          });
          done();
        })
        .catch(done);
    });
  });

  describe('tableExists', function() {
    it('should return true if a table exists', function(done) {
      db.tableExists(config.rethinkdb.db, tableNames[0])
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(done);
    });

    it('should return false if a table does not exist', function(done) {
      db.tableExists(config.rethinkdb.db, 'asdfasdfasdfasdfasdfasdf')
        .then(function(result) {
          result.should.be.false;
          done();
        })
        .catch(done);
    });

    it('should throw an error when database name is not specified', function() {
      expect(db.tableExists.bind(db)).to.throw(Error);
    });
  });

  describe('createTable', function() {
    it('should throw an error when database name is not specified', function() {
      expect(db.createTable.bind(db)).to.throw(Error);
    });

    it('should throw an error when table name is not specified', function() {
      expect(db.createTable.bind(db, config.rethinkdb.db)).to.throw(Error);
    });

    it('should create a table', function(done) {
      db.createTable(config.rethinkdb.db, 'asdfasdfasdfasdfasdfasdf')
        .then(function(result) {
          result.should.be.true;
          return db.tableExists(config.rethinkdb.db, 'asdfasdfasdfasdfasdfasdf');
        })
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(done);
    });
  });

  describe('dropTable', function() {
    it('should throw an error when database name is not specified', function() {
      expect(db.dropTable.bind(db)).to.throw(Error);
    });

    it('should throw an error when table name is not specified', function() {
      expect(db.dropTable.bind(db, config.rethinkdb.db)).to.throw(Error);
    });

    it('should drop a table', function(done) {
      db.dropTable(config.rethinkdb.db, 'asdfasdfasdfasdfasdfasdf')
        .then(function(result) {
          result.should.be.true;
          return db.tableExists(config.rethinkdb.db, 'asdfasdfasdfasdfasdfasdf');
        })
        .then(function(result) {
          result.should.be.false;
          done();
        })
        .catch(done);
    });
  });

  describe('dropTableIfExists', function() {
    it('should throw an error when database name is not specified', function() {
      expect(db.dropTableIfExists.bind(db)).to.throw(Error);
    });

    it('should throw an error when table name is not specified', function() {
      expect(db.dropTableIfExists.bind(db, config.rethinkdb.db)).to.not.throw(Error);
    });

    it('should drop table if exists', function(done) {
      db.dropTableIfExists(config.rethinkdb.db, tableNames[0])
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(done);
    });

    it('should drop table if does not exist', function(done) {
      db.dropTableIfExists(config.rethinkdb.db, 'asdfasdfasdfasdfasdfasdf')
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(done);
    });
  });

  describe('dropTablesIfExist', function() {
    it('should throw an error when database name is not specified', function() {
      expect(db.dropTablesIfExist.bind(db)).to.throw(Error);
    });

    it('should not throw an error when table name is not specified', function() {
      expect(db.dropTablesIfExist.bind(db, config.rethinkdb.db)).to.not.throw(Error);
    });

    it('should drop tables if exist', function(done) {
      db.dropTablesIfExist(config.rethinkdb.db, tableNames)
        .then(function(result) {
          result.should.be.Array;
          result.should.have.length(tableNames.length - 1);
          done();
        })
        .catch(done);
    });

    it('should drop tables if not exist', function(done) {
      db.dropTablesIfExist(config.rethinkdb.db, ['a', 'b', 'c'])
        .then(function(result) {
          result.should.be.Array;
          result.should.have.length(0);
          done();
        })
        .catch(done);
    });
  });

  describe('createTableIfNotExists', function() {
    it('should throw an error when database name is not specified', function() {
      expect(db.createTableIfNotExists.bind(db)).to.throw(Error);
    });

    it('should throw an error when table name is not specified', function() {
      expect(db.createTableIfNotExists.bind(db, config.rethinkdb.db)).to.throw(Error);
    });

    it('should create a table if not exists', function(done) {
      db.createTableIfNotExists(config.rethinkdb.db, tableNames[0])
        .then(function(result) {
          result.should.be.true;
          return db.tableExists(config.rethinkdb.db, tableNames[0]);
        })
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(done);
    });

    it('should create a table if exists', function(done) {
      db.createTableIfNotExists(config.rethinkdb.db, tableNames[0])
        .then(function(result) {
          result.should.be.true;
          return db.tableExists(config.rethinkdb.db, tableNames[0]);
        })
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(done);
    });
  });

  describe('createTablesIfNotExist', function() {
    it('should throw an error when database name is not specified', function() {
      expect(db.createTablesIfNotExist.bind(db)).to.throw(Error);
    });

    it('should throw an error when table name is not specified', function() {
      expect(db.createTablesIfNotExist.bind(db, config.rethinkdb.db)).to.throw(Error);
    });

    it('should create tables if not exist', function(done) {
      db.createTablesIfNotExist(config.rethinkdb.db, tableNames)
        .then(function(result) {
          result.should.be.Array;
          result.should.have.length(tableNames.length - 1);
          return db.getTableList(config.rethinkdb.db);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(tableNames.length);
          results.forEach(function(result) {
            tableNames.should.contain(result);
          });
          done();
        })
        .catch(done);
    });

    it('should create tables if exist', function(done) {
      db.createTablesIfNotExist(config.rethinkdb.db, tableNames)
        .then(function(result) {
          result.should.be.Array;
          result.should.have.length(0);
          return db.getTableList(config.rethinkdb.db);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(tableNames.length);
          results.forEach(function(result) {
            tableNames.should.contain(result);
          });
          done();
        })
        .catch(done);
    });
  });

  describe('getIndexList', function() {
    var randomTableId = Object.keys(config.app.indexes)[0];
    var indexNames = config.app.indexes[randomTableId].map(function(indexData) { return indexData.name; });

    it('should throw an error if database name if not specified', function() {
      expect(db.getIndexList.bind(db)).to.throw(Error);
    });

    it('should throw an error if table name if not specified', function() {
      expect(db.getIndexList.bind(db, config.rethinkdb.db)).to.throw(Error);
    });

    it('should not throw an error if database and table name is specified', function() {
      expect(db.getIndexList.bind(db, config.rethinkdb.db, 'adfs')).to.not.throw(Error);
    });

    it('should return an empty list when table does not exit', function(done) {
      db.getIndexList(config.rethinkdb.db, 'aasdfasdf')
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should return an empty list when table no indexes exist', function(done) {
      db.getIndexList(config.rethinkdb.db, config.app.tables[randomTableId])
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should return list of indexes on a table', function(done) {
      db.createIndexesIfNotExist(config.rethinkdb.db, config.app.tables[randomTableId], config.app.indexes[randomTableId])
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(indexNames.length);
          return db.getIndexList(config.rethinkdb.db, config.app.tables[randomTableId]);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(indexNames.length);
          results.forEach(function(result) {
            indexNames.should.contain(result);
          });
          done();
        })
        .catch(done);
    });
  });

  describe('indexExists', function() {
    var randomTableId = Object.keys(config.app.indexes)[0];
    var indexNames = config.app.indexes[randomTableId].map(function(indexData) { return indexData.name; });

    it('should throw an error if database name if not specified', function() {
      expect(db.indexExists.bind(db)).to.throw(Error);
    });

    it('should throw an error if table name if not specified', function() {
      expect(db.indexExists.bind(db, config.rethinkdb.db)).to.throw(Error);
    });

    it('should return true if an index exist on a table', function(done) {
      db.indexExists(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[0])
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(done);
    });

    it('should return false if an index does not exist on a table', function(done) {
      db.indexExists(config.rethinkdb.db, config.app.tables[randomTableId], 'asdfasdfasdfasdfasdfasdf')
        .then(function(result) {
          result.should.be.false;
          done();
        })
        .catch(done);
    });

    it('should return false if a table does not exist', function(done) {
      db.indexExists(config.rethinkdb.db, 'asdfasdfasdfasdfasdfasdffsadfasdf', 'asdfasdfasdfasdfasdfasdf')
        .then(function(result) {
          result.should.be.false;
          done();
        })
        .catch(done);
    });
  });

  describe('dropIndex', function() {
    var randomTableId = Object.keys(config.app.indexes)[0];
    var indexNames = config.app.indexes[randomTableId].map(function(indexData) { return indexData.name; });

    it('should throw an error if database name if not specified', function() {
      expect(db.dropIndex.bind(db)).to.throw(Error);
    });

    it('should throw an error if table name if not specified', function() {
      expect(db.dropIndex.bind(db, config.rethinkdb.db)).to.throw(Error);
    });

    it('should throw an error if index name if not specified', function() {
      expect(db.dropIndex.bind(db, config.rethinkdb.db, config.app.tables[randomTableId])).to.throw(Error);
    });

    it('should drop an index and return true if exists', function(done) {
      db.indexExists(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[0])
        .then(function(result) {
          result.should.be.true;
          return db.dropIndex(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[0]);
        })
        .then(function(result) {
          result.should.be.true;
          return db.indexExists(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[0]);
        })
        .then(function(result) {
          result.should.be.false;
          done();
        })
        .catch(done);
    });

    it('should throw an error if index does not exist', function() {
      db.dropIndex(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[0]).should.be.rejectedWith(Error);
    });
  });

  describe('dropIndexIfExists', function() {
    var randomTableId = Object.keys(config.app.indexes)[0];
    var indexNames = config.app.indexes[randomTableId].map(function(indexData) { return indexData.name; });

    it('should throw an error if database name if not specified', function() {
      expect(db.dropIndexIfExists.bind(db)).to.throw(Error);
    });

    it('should throw an error if table name if not specified', function() {
      expect(db.dropIndexIfExists.bind(db, config.rethinkdb.db)).to.throw(Error);
    });

    it('should not throw an error if index name if not specified', function() {
      expect(db.dropIndexIfExists.bind(db, config.rethinkdb.db, config.app.tables[randomTableId])).to.not.throw(Error);
    });

    it('should drop an index and return true if exists', function(done) {
      db.indexExists(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[1])
        .then(function(result) {
          result.should.be.true;
          return db.dropIndexIfExists(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[1]);
        })
        .then(function(result) {
          result.should.be.true;
          return db.indexExists(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[1]);
        })
        .then(function(result) {
          result.should.be.false;
          done();
        })
        .catch(done);
    });

    it('should drop an index and return true if exists', function(done) {
      db.indexExists(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[1])
        .then(function(result) {
          result.should.be.false;
          return db.dropIndexIfExists(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[1]);
        })
        .then(function(result) {
          result.should.be.true;
          return db.indexExists(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[1]);
        })
        .then(function(result) {
          result.should.be.false;
          done();
        })
        .catch(done);
    });
  });

  describe('dropIndexesIfExist', function() {
    var randomTableId = Object.keys(config.app.indexes)[0];
    var indexNames = config.app.indexes[randomTableId].map(function(indexData) { return indexData.name; });

    it('should throw an error if database name if not specified', function() {
      expect(db.dropIndexesIfExist.bind(db)).to.throw(Error);
    });

    it('should throw an error if table name is not specified', function() {
      expect(db.dropIndexesIfExist.bind(db, config.rethinkdb.db)).to.throw(Error);
    });

    it('should not throw an error if index names are not specified', function() {
      expect(db.dropIndexesIfExist.bind(db, config.rethinkdb.db, config.app.tables[randomTableId])).to.not.throw(Error);
    });

    it('should drop indexes and return true if they exist', function(done) {
      var indexesLength = null;
      db.indexesExist(config.rethinkdb.db, config.app.tables[randomTableId], indexNames)
        .then(function(results) {
          results.should.be.Array;
          indexesLength = results.length;
          results.should.not.have.length(0);
          return db.dropIndexesIfExist(config.rethinkdb.db, config.app.tables[randomTableId], indexNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(indexesLength);
          return db.indexesExist(config.rethinkdb.db, config.app.tables[randomTableId], indexNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should drop indexes and return if they do not exist', function(done) {
      var indexesLength = null;
      db.indexesExist(config.rethinkdb.db, config.app.tables[randomTableId], indexNames)
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          indexesLength = results.length;
          return db.dropIndexesIfExist(config.rethinkdb.db, config.app.tables[randomTableId], indexNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(indexesLength);
          return db.indexesExist(config.rethinkdb.db, config.app.tables[randomTableId], indexNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          done();
        })
        .catch(done);
    });
  });

  describe('createIndex', function() {
    var randomTableId = Object.keys(config.app.indexes)[0];
    var indexNames = config.app.indexes[randomTableId].map(function(indexData) { return indexData.name; });

    it('should throw an error if database name if not specified', function() {
      expect(db.createIndex.bind(db)).to.throw(Error);
    });

    it('should throw an error if table name if not specified', function() {
      expect(db.createIndex.bind(db, config.rethinkdb.db)).to.throw(Error);
    });

    it('should throw an error if index name if not specified', function() {
      expect(db.createIndex.bind(db, config.rethinkdb.db, config.app.tables[randomTableId])).to.throw(Error);
    });

    it('should create an index if does not exist', function(done) {
      db.indexExists(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[0])
        .then(function(result) {
          result.should.be.false;
          return db.createIndex(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[0]);
        })
        .then(function(result) {
          result.should.be.true;
          return db.indexExists(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[0]);
        })
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(done);
    });

    it('should throw an error if index already exist', function() {
      db.createIndex(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[0]).should.be.rejectedWith(Error);
    });
  });

  describe('createIndexIfNotExists', function() {
    var randomTableId = Object.keys(config.app.indexes)[0];
    var indexNames = config.app.indexes[randomTableId].map(function(indexData) { return indexData.name; });

    it('should throw an error if database name if not specified', function() {
      expect(db.createIndexIfNotExists.bind(db)).to.throw(Error);
    });

    it('should throw an error if table name if not specified', function() {
      expect(db.createIndexIfNotExists.bind(db, config.rethinkdb.db)).to.throw(Error);
    });

    it('should throw an error if index name if not specified', function() {
      expect(db.createIndexIfNotExists.bind(db, config.rethinkdb.db, config.app.tables[randomTableId])).to.throw(Error);
    });

    it('should create an index if does not exist', function(done) {
      db.indexExists(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[1])
        .then(function(result) {
          result.should.be.false;
          return db.createIndexIfNotExists(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[1]);
        })
        .then(function(result) {
          result.should.be.true;
          return db.indexExists(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[1]);
        })
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(done);
    });

    it('should return true if index exist', function(done) {
      db.indexExists(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[1])
        .then(function(result) {
          result.should.be.true;
          return db.createIndexIfNotExists(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[1]);
        })
        .then(function(result) {
          result.should.be.true;
          return db.indexExists(config.rethinkdb.db, config.app.tables[randomTableId], indexNames[1]);
        })
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(done);
    });
  });

  describe('createIndexesIfNotExist', function() {
    var randomTableId = Object.keys(config.app.indexes)[0];
    var indexNames = config.app.indexes[randomTableId].map(function(indexData) { return indexData.name; });

    it('should throw an error if database name if not specified', function() {
      expect(db.createIndex.bind(db)).to.throw(Error);
    });

    it('should throw an error if table name if not specified', function() {
      expect(db.createIndexesIfNotExist.bind(db, config.rethinkdb.db)).to.throw(Error);
    });

    it('should throw an error if index data if not specified', function() {
      expect(db.createIndexesIfNotExist.bind(db, config.rethinkdb.db, config.app.tables[randomTableId])).to.throw(Error);
    });

    it('should throw an error if index data is not an Array', function() {
      expect(db.createIndexesIfNotExist.bind(db, config.rethinkdb.db, config.app.tables[randomTableId], 'TEST')).to.throw(Error);
    });

    it('should create indexes and return true if they do not exist', function(done) {
      var indexesLength = null;
      db.indexesExist(config.rethinkdb.db, config.app.tables[randomTableId], indexNames)
        .then(function(results) {
          results.should.be.Array;
          indexesLength = results.length;
          results.should.not.have.length(0);
          return db.createIndexesIfNotExist(config.rethinkdb.db, config.app.tables[randomTableId], config.app.indexes[randomTableId]);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(config.app.indexes[randomTableId].length - indexesLength);
          return db.indexesExist(config.rethinkdb.db, config.app.tables[randomTableId], indexNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(indexNames.length);
          done();
        })
        .catch(done);
    });

    it('should create indexes and return if they exist', function(done) {
      db.indexesExist(config.rethinkdb.db, config.app.tables[randomTableId], indexNames)
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(indexNames.length);
          return db.createIndexesIfNotExist(config.rethinkdb.db, config.app.tables[randomTableId], config.app.indexes[randomTableId]);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          return db.indexesExist(config.rethinkdb.db, config.app.tables[randomTableId], indexNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(indexNames.length);
          done();
        })
        .catch(done);
    });
  });

  describe('migrate', function() {
    this.timeout(10000);
    before(function(done) {
      db.dropDbIfExists(config.rethinkdb.db)
        .then(function(result) {
          done();
        })
        .catch(done);
    });

    it('should migrate database with provided configuration', function(done) {
      var randomTableId = Object.keys(config.app.indexes)[0];
      var indexNames = config.app.indexes[randomTableId].map(function(indexData) { return indexData.name; });
      db.migrate(config.rethinkdb.db, config.app.tables, config.app.indexes)
        .then(function(result) {
          result.should.be.true;
          return db.dbsExist(config.rethinkdb.db);

        })
        .then(function(result) {
          result.should.be.Array;
          result.should.have.length(1);
          result.should.contain(config.rethinkdb.db);
          return db.tablesExist(config.rethinkdb.db, tableNames);
        })
        .then(function(results) {
          results.should.have.length(tableNames.length);
          results.forEach(function(result) {
            tableNames.should.contain(result);
          });
          return db.indexesExist(config.rethinkdb.db, config.app.tables[randomTableId], indexNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(indexNames.length);
          results.forEach(function(result) {
            indexNames.should.contain(result);
          });
          done();
        })
        .catch(done);
    });
  });

  describe('Model', function() {
    this.timeout(10000);
    var UrlModel = db.Model(db.r, config.rethinkdb.db, tableNames[0]);
    var objects = [
      { id: 1, url: 'http://saini.co.in/', post_id: 121, created_at: Date.now(), updated_at: Date.now() },
      { id: 2, url: 'http://gofedora.com/', post_id: 4213, created_at: null, updated_at: Date.now() },
      { id: 'acd', url: 'http://example.com/example.html', post_id: 1, created_at: Date.now(), updated_at: Date.now() },
      { id: 'AFED', url: '', post_id: 2, created_at: Date.now(), updated_at: Date.now() },
      { id: 'AF39Fdcew_asdf-s29', url: null, post_id: 1, created_at: Date.now(), updated_at: null },
      { id: null, url: 'http://4bo.net', post_id: null },
      { url: 'http://google.com/', created_at: null, updated_at: null },
      { id: 'fear', url: 'http://google.co/', post_id: 123, created_at: null, updated_at: null },
      { id: 'bounty-hunder', url: 'http://google.io/', post_id: 200, created_at: null, updated_at: null },
      { id: 'bonty-hunder2', url: 'http://goog.io/', created_at: null, updated_at: null },
      { id: '_bonty-hunder2', url: 'http://goog.io/', created_at: null, updated_at: null }
    ];

    before(function(done) {
      db.migrate(config.rethinkdb.db, config.app.tables, config.app.indexes)
        .then(function(result) {
          done();
        })
        .catch(done);
    });

    before(function(done) {
      UrlModel.create(objects)
        .then(function(result) {
          done();
        })
        .catch(done);
    });

    it('should throw an error when rethinkdbdash instance is not specified', function() {
      expect(db.Model.bind(db)).to.throw(Error);
    });

    it('should throw an error when database name is not specified', function() {
      expect(db.Model.bind(db, db.r)).to.throw(Error);
    });

    it('should throw an error when table name is not specified', function() {
      expect(db.Model.bind(db, db.r, config.rethinkdb.db)).to.throw(Error);
    });

    describe('find', function() {
      it('should not throw an error when id is not specified', function(done) {
        expect(UrlModel.find.bind(UrlModel)).to.not.throw(Error);
        UrlModel.find()
          .then(function(result) {
            should.not.exist(result);
            expect(result).to.be.null;
            done();
          })
          .catch(done);
      });

      it('should find a document with given id', function(done) {
        var object = objects[0];
        UrlModel.find(object.id)
          .then(function(result) {
            result.should.be.Object;
            result.should.be.eql(object);
            done();
          })
          .catch(done);
      });

      it('should return null for a document that does not exist', function(done) {
        UrlModel.find('asdfasdfasdfasdfasdfasdf')
          .then(function(result) {
            should.not.exist(result);
            expect(result).to.be.null;
            done();
          })
          .catch(done);
      });
    });

    describe('findAll', function() {
      it('should throw an error when fields are not specified', function() {
        expect(UrlModel.findAll.bind(UrlModel)).to.throw(Error);
      });

      it('should throw an error when index is not specified', function() {
        expect(UrlModel.findAll.bind(UrlModel, 'url')).to.throw(Error);
      });

      it('should throw an error when search field is null', function() {
        expect(UrlModel.findAll.bind(UrlModel, null, 'url')).to.throw(Error);
        expect(UrlModel.findAll.bind(UrlModel, null, 'id')).to.throw(Error);
        expect(UrlModel.findAll.bind(UrlModel, null, 'post_id')).to.throw(Error);
      });

      it('should be able to fetch document with primary key', function(done) {
        var object = objects[0];
        UrlModel.findAll(object.id, 'id')
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(1);
            var result = results[0];
            result.should.be.eql(object);
            done();
          })
          .catch(done);
      });

      it('should fetch documents with multiple primary keys', function(done) {
        UrlModel.findAll(objects[0].id, objects[1].id, 'id')
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(2);
            results.should.contain(objects[0]);
            results.should.contain(objects[1]);
            done();
          })
          .catch(done);
      });

      it('should be able to fetch document with a single secondary index', function(done) {
        var object = objects[1];
        UrlModel.findAll(object.url, 'url')
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(1);
            var result = results[0];
            result.should.be.eql(object);
            done();
          })
          .catch(done);
      });

      it('should be able to fetch documents with multiple values of a secondary index', function(done) {
        UrlModel.findAll(objects[2].url, objects[3].url, 'url')
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(2);
            results.should.contain(objects[2]);
            results.should.contain(objects[3]);
            done();
          })
          .catch(done);
      });

      it('should be able to fetch documents with compound index', function(done) {
        var object = objects[2];
        UrlModel.findAll([object.url, object.post_id], 'url_and_post_id')
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(1);
            var result = results[0];
            result.should.be.eql(object);
            done();
          })
          .catch(done);
      });

      it('should be able to fetch documents with multiple values of a compound index', function(done) {
        UrlModel.findAll([objects[1].url, objects[1].post_id], [objects[3].url, objects[3].post_id], 'url_and_post_id')
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(2);
            results.should.contain(objects[1]);
            results.should.contain(objects[3]);
            done();
          })
          .catch(done);
      });

      it('should throw an error with compound index containing null field', function() {
        UrlModel.findAll(['http://saini.co.in/', null], 'url_and_post_id').should.be.rejectedWith(Error);
        UrlModel.findAll([null, 1], 'url_and_post_id').should.be.rejectedWith(Error);
      });
    });

    describe('filter', function() {
      it('should throw an error when predicate is not specified', function() {
        expect(UrlModel.filter.bind(UrlModel)).to.throw(Error);
      });

      it('should fetch documents when a predicate is specified as ReQL', function(done) {
        UrlModel.filter(db.r.row('post_id').gt(100))
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(4);
            results.should.contain(objects[0]);
            results.should.contain(objects[1]);
            results.should.contain(objects[7]);
            results.should.contain(objects[8]);
            done();
          })
          .catch(done);
      });

      it('should fetch documents when a predicate is specified as object', function(done) {
        UrlModel.filter({ post_id: 1 })
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(2);
            results.should.contain(objects[2]);
            results.should.contain(objects[4]);
            done();
          })
          .catch(done);
      });

      it('should fetch documents when a predicate is specified as function', function(done) {
        UrlModel.filter(function(url) { return url('post_id').eq(2); })
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(1);
            results.should.contain(objects[3]);
            done();
          })
          .catch(done);
      });

      it('should fetch documents when a predicate is specified as ReQL', function(done) {
        UrlModel.filter(db.r.row('post_id').gt(100).and(db.r.row('post_id').lt(150)))
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(2);
            results.should.contain(objects[0]);
            results.should.contain(objects[7]);
            done();
          })
          .catch(done);
      });

      it('should fetch documents when a predicate is specified as ReQL', function(done) {
        UrlModel.filter(db.r.row('post_id').lt(100))
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(3);
            results.should.contain(objects[2]);
            results.should.contain(objects[3]);
            results.should.contain(objects[4]);
            done();
          })
          .catch(done);
      });

      //It's a valid query but can't fetch nothing
      it('should fetch documents when a predicate is specified as ReQL', function(done) {
        UrlModel.filter(db.r.row('post_id').eq(null))
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(0);
            done();
          })
          .catch(done);
      });

      it('should fetch documents when a predicate is specified as object', function(done) {
        UrlModel.filter({ post_id: null })
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(0);
            done();
          })
          .catch(done);
      });
    });

    describe('update', function() {
      it('should throw an error if id is not specified', function() {
        expect(UrlModel.update.bind(UrlModel)).to.throw(Error);
      });

      it('should throw an error if updates object is not specified', function() {
        expect(UrlModel.update.bind(UrlModel, 1)).to.throw(Error);
      });

      it('should update a document using an object', function(done) {
        var object = objects[0];
        var updated_at = object.updated_at;
        UrlModel.update(object.id, { post_id: 1201 })
          .then(function(result) {
            result.replaced.should.be.Number;
            result.replaced.should.be.equal(1);
            return UrlModel.find(object.id);
          })
          .then(function(result) {
            result.post_id.should.not.be.equal(object.post_id);
            result.post_id.should.be.equal(1201);
            result.updated_at.should.be.gt(updated_at);
            done();
          })
          .catch(done);
      });

      it('should update a document using a ReQL expression', function(done) {
        var object = objects[1];
        var updated_at = object.updated_at;
        UrlModel.update(object.id, { post_id: db.r.row('post_id').add(1) })
          .then(function(result) {
            result.replaced.should.be.Number;
            result.replaced.should.be.equal(1);
            return UrlModel.find(object.id);
          })
          .then(function(result) {
            result.post_id.should.not.be.equal(object.post_id);
            result.post_id.should.be.equal(object.post_id + 1);
            result.updated_at.should.be.gt(updated_at);
            done();
          })
          .catch(done);
      });
    });

    describe('destroy', function() {
      it('should throw an error if id is not specified', function() {
        expect(UrlModel.destroy.bind(UrlModel)).to.throw(Error);
      });

      it('should destroy a document with an id', function(done) {
        UrlModel.destroy(objects[9].id)
          .then(function(result) {
            result.deleted.should.be.Number;
            result.deleted.should.be.equal(1);
            done();
          })
          .catch(done);
      });

      it('should not destroy a document with an id that is not in that database', function(done) {
        UrlModel.destroy('asdfasdfasdfasdfasdfasdf')
          .then(function(result) {
            result.deleted.should.be.Number;
            result.deleted.should.be.equal(0);
            result.skipped.should.be.Number;
            result.skipped.should.be.equal(1);
            done();
          })
          .catch(done);
      });
    });

    describe('destroyAll', function() {
      before(function(done) {
        db.resetTable(config.rethinkdb.db, tableNames[0])
          .then(function(result) {
            return UrlModel.create(objects);
          })
          .then(function(result) {
            done();
          })
          .catch(done);
      });

      it('should throw an error when fields are not specified', function() {
        expect(UrlModel.destroyAll.bind(UrlModel)).to.throw(Error);
      });

      it('should throw an error when index is not specified', function() {
        expect(UrlModel.destroyAll.bind(UrlModel, 'url')).to.throw(Error);
      });

      it('should throw an error when search field is null', function() {
        expect(UrlModel.destroyAll.bind(UrlModel, null, 'url')).to.throw(Error);
        expect(UrlModel.destroyAll.bind(UrlModel, null, 'id')).to.throw(Error);
        expect(UrlModel.destroyAll.bind(UrlModel, null, 'post_id')).to.throw(Error);
      });

      it('should be able to destroy document with primary key', function(done) {
        var object = objects[9];
        UrlModel.destroyAll(object.id, 'id')
          .then(function(results) {
            results.deleted.should.be.Number;
            results.deleted.should.be.equal(1);
            done();
          })
          .catch(done);
      });

      it('should destroy documents with multiple primary keys', function(done) {
        UrlModel.destroyAll(objects[8].id, objects[7].id, 'id')
          .then(function(results) {
            results.deleted.should.be.Number;
            results.deleted.should.be.equal(2);
            done();
          })
          .catch(done);
      });

      it('should be able to fetch document with a single secondary index', function(done) {
        var object = objects[6];
        UrlModel.destroyAll(object.url, 'url')
          .then(function(results) {
            results.deleted.should.be.Number;
            results.deleted.should.be.equal(1);
            done();
          })
          .catch(done);
      });

      it('should be able to fetch documents with multiple values of a secondary index', function(done) {
        UrlModel.destroyAll(objects[4].post_id, objects[3].post_id, 'post_id')
          .then(function(results) {
            results.deleted.should.be.Number;
            results.deleted.should.be.equal(3);
            done();
          })
          .catch(done);
      });

      it('should be able to fetch documents with compound index', function(done) {
        var object = objects[2];
        UrlModel.destroyAll([object.url, object.post_id], 'url_and_post_id')
          .then(function(results) {
            results.deleted.should.be.Number;
            results.deleted.should.be.equal(0);
            done();
          })
          .catch(done);
      });

      it('should be able to fetch documents with multiple values of a compound index', function(done) {
        UrlModel.destroyAll([objects[1].url, objects[1].post_id], [objects[0].url, objects[0].post_id], 'url_and_post_id')
          .then(function(results) {
            results.deleted.should.be.Number;
            results.deleted.should.be.equal(2);
            done();
          })
          .catch(done);
      });

      it('should destroy document with rethinkdb options', function(done) {
        UrlModel.destroyAll(objects[10].url, 'url', { durability: 'hard' })
          .then(function(results) {
            results.deleted.should.be.Number;
            results.deleted.should.be.equal(1);

            done();
          })
          .catch(done);
      });

    });

    describe('create', function() {
      before(function(done) {
        db.resetTable(config.rethinkdb.db, tableNames[0])
          .then(function(result) {
            done();
          })
          .catch(done);
      });

      it('should throw an error if objects are not specified', function() {
        expect(UrlModel.create.bind(UrlModel)).to.throw(Error);
      });

      it('should not insert an object with id set as null', function(done) {
        var object = objects[5];
        UrlModel.create(object)
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(0);
            done();
          })
          .catch(done);
      });

      it('should insert when a single object is passed', function(done) {
        UrlModel.create(objects[0])
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(1);
            done();
          })
          .catch(done);
      });

      it('should insert an arbitrary number of object passed', function(done) {
        var newObjects = [objects[1], objects[2], objects[9]];
        UrlModel.create(newObjects)
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(newObjects.length);
            done();
          })
          .catch(done);
      });

      it('should not insert an object whose id already exists in table', function(done) {
        UrlModel.create(objects[0])
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(0);
            done();
          })
          .catch(done);
      });

      it('should insert documents whose ids are not already present in the table', function(done) {
        var newObjects = [objects[4], objects[2], objects[9], objects[5]];
        UrlModel.create(newObjects)
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(1);
            done();
          })
          .catch(done);
      });
    });

    describe('sync', function() {
      it('should sync table', function(done) {
        UrlModel.sync()
          .then(function(result) {
            result.synced.should.be.Number;
            result.synced.should.be.equal(1);
            done();
          })
          .catch(done);
      });
    });
  });
});
