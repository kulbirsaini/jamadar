/*jshint expr: true*/
'use strict';

var chai = require('chai');
chai.config.includeStack = true;
chai.config.showDiff = true;

var chaiAsPromised = require('chai-as-promised');
var path = require('path');
var Factory = require('rosie').Factory;

var config = require(path.join(__dirname, 'config'));
var dbLayer = require(path.join(__dirname, '../index'));

var db = dbLayer(config.rethinkdb);
var expect = chai.expect;
var should = chai.should();
var urls = [
  'http://saini.co.in/',
  'http://gofedora.com',
  'http://4bo.net',
  'http://example.com',
  'http://google.com/whatever',
  'http://google.io',
  'http://wow.com',
  'http://saini.co.in/asdf',
  'http://gofedora.com/fewasdf',
  'http://4bo.net/fewljkasdf',
  'http://example.com/asdf/asdf/wesadf',
  'http://google.com/whatever/fewsjdfasd/asdf/wefas',
  'http://google.io/wkwksks.as./s/asd/sd/sdf',
  'http://wow.com/fewsadf/sdf',
  'http://www.saini.co.in/',
  'http://www.gofedora.com',
  'http://www.4bo.net',
  'http://www.example.com',
  'http://www.google.com/whatever',
  'http://www.google.io',
  'http://www.wow.com',
  'http://www.saini.co.in/asdf',
  'http://www.gofedora.com/fewasdf',
  'http://www.4bo.net/fewljkasdf',
  'http://www.example.com/asdf/asdf/wesadf',
  'http://www.google.com/whatever/fewsjdfasd/asdf/wefas',
  'http://www.google.io/wkwksks.as./s/asd/sd/sdf',
  'http://www.wow.com/fewsadf/sdf'
];
var urlLength = urls.length;

chai.use(chaiAsPromised);

Factory.define('url')
  .attr('url', function() { return getRandomUrl(); })
  .attr('post_id', function() { return randomIntFromInterval(1, 1000); })
  .attr('created_at', function() { return Date.now(); })
  .attr('updated_at', function() { return Date.now(); })
  .attr('id', function() { return randomIntFromInterval(1, 10000); });

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random()*(max - min + 1) + min);
}

function getRandomUrl() {
  return urls[randomIntFromInterval(0, urlLength - 1)];
}

function getRandomObjects() {
  var num = randomIntFromInterval(10, 20);
  var objects = [];
  var object = null;
  for (var i = 0; i < num; i++) {
    object = Factory.build('url');
    object.url = object.url + '/' + randomIntFromInterval(0, 1000);
    objects.push(object);
  }
  return objects;
}

function createDb(dbNames, done) {
  db.createDbsIfNotExist(dbNames)
    .then(function(result) {
      done();
    })
    .catch(done);
}

function dropDb(dbNames, done) {
  db.dropDbsIfExist(dbNames)
  .then(function(result) {
    done();
  })
  .catch(done);
}

function recreateDb(dbNames, done) {
  db.dropDbsIfExist(dbNames)
    .then(function(result) {
      return db.createDbsIfNotExist(dbNames);
    })
    .then(function(result) {
      done();
    })
    .catch(done);
}

function createTables(dbName, tableNames, done) {
  db.createTablesIfNotExist(dbName, tableNames)
    .then(function(result) {
      done();
    })
    .catch(done);
}

function recreateTables(dbName, tableNames, done) {
  db.dropTablesIfExist(dbName, tableNames)
    .then(function(result) {
      return db.createTablesIfNotExist(dbName, tableNames);
    })
    .then(function(result) {
      done();
    })
    .catch(done);
}

function resetTables(dbName, tableNames, done) {
  db.resetTables(dbName, tableNames)
    .then(function(result) {
      done();
    })
    .catch(done);
}

function mustBeTrue(result) {
  result.should.be.Boolean;
  result.should.be.true;
}

function mustBeFalse(result) {
  result.should.be.Boolean;
  result.should.be.false;
}

//TODO FIXME write tests for functions which use instanceof method.
describe('Database Layer', function() {
  var dbName = config.rethinkdb.db;
  var tables = config.app.tables;
  var indexes = config.app.indexes;
  var tableNames = Object.keys(tables).map(function(tableId) { return tables[tableId]; });
  var randomTableId = Object.keys(indexes)[0];
  var indexNames = indexes[randomTableId].map(function(indexData) { return indexData.name; });
  var urlTable = tableNames[0];
  var UrlModel = db.Model(db.r, dbName, urlTable);

  this.timeout(20000);

  before(function(done) {
    dropDb(dbName, done);
  });

  after(function(done) {
    dropDb(dbName, done);
  });

  describe('getDbList', function() {
    before(function(done) {
      dropDb(dbName, done);
    });

    it('should return a list of database names', function(done) {
      db.getDbList()
        .then(function(result) {
          result.should.be.Array;
          result.should.not.contain(dbName);
          done();
        })
        .catch(done);
    });
  });

  describe('getDbList', function() {
    before(function(done) {
      createDb(dbName, done);
    });

    it('should return a list of database names', function(done) {
      db.getDbList()
        .then(function(result) {
          result.should.be.Array;
          result.should.contain(dbName);
          done();
        })
        .catch(done);
    });
  });

  describe('dbExists', function() {
    before(function(done) {
      dropDb(dbName, done);
    });

    it('should return false if a database does not exist', function(done) {
      db.dbExists(dbName)
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });
  });

  describe('dbExists', function() {
    before(function(done) {
      createDb(dbName, done);
    });

    it('should return true if a database does not exist', function(done) {
      db.dbExists(dbName)
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });
  });

  describe('createDb', function() {
    before(function(done) {
      dropDb(dbName, done);
    });

    it('should be rejected with an error if database is not specified', function() {
      db.createDb().should.be.rejectedWith(Error);
    });

    it('should create a database', function(done) {
      db.createDb(dbName)
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should be rejected with an error if a database already exists', function() {
      db.createDb(dbName).should.be.rejectedWith(Error);
    });
  });

  describe('dropDb', function() {
    before(function(done) {
      recreateDb(dbName, done);
    });

    it('should be rejected with an error if database is not specified', function() {
      db.dropDb().should.be.rejectedWith(Error);
    });

    it('should drop a database', function(done) {
      db.dropDb(dbName)
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should be rejected with an error when a database does not exist', function() {
      db.dropDb(dbName).should.be.rejectedWith(Error);
    });
  });

  describe('createDbIfNotExists', function() {
    before(function(done) {
      dropDb(dbName, done);
    });

    it('should be rejected with an error if database is not specified', function() {
      db.createDbIfNotExists().should.be.rejectedWith(Error);
    });

    it('should create a database if it does not exist', function(done) {
      db.dbExists(dbName)
        .then(function(result) {
          mustBeFalse(result);
          return db.createDbIfNotExists(dbName);
        })
        .then(function(result) {
          mustBeTrue(result);
          return db.dbExists(dbName);
        })
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should create a database even if it does exist', function(done) {
      db.dbExists(dbName)
        .then(function(result) {
          mustBeTrue(result);
          return db.createDbIfNotExists(dbName);
        })
        .then(function(result) {
          mustBeTrue(result);
          return db.dbExists(dbName);
        })
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should not be rejected with an error even if database already exists', function() {
      db.createDbIfNotExists(dbName).should.not.be.rejectedWith(Error);
    });
  });

  describe('dropDbIfExists', function() {
    before(function(done) {
      createDb(dbName, done);
    });

    it('should not be rejected with an error if database is not specified', function() {
      db.dropDbIfExists().should.not.be.rejectedWith(Error);
    });

    it('should return true if a database is not specified', function(done) {
      db.dropDbIfExists()
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should drop a database if it exists', function(done) {
      db.dbExists(dbName)
        .then(function(result) {
          mustBeTrue(result);
          return db.dropDbIfExists(dbName);
        })
        .then(function(result) {
          mustBeTrue(result);
          return db.dbExists(dbName);
        })
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });

    it('should not throw an Error if database does not exist', function() {
      db.dropDbIfExists(dbName).should.not.be.rejectedWith(Error);
    });
  });

  describe('createDbsIfNotExist', function() {
    var dbs = [dbName, dbName + '_1' + dbName + '_2'];

    it('should be rejected with an error if database(s) are not specified', function() {
      db.createDbsIfNotExist().should.be.rejectedWith(Error);
    });

    it('should create databases', function(done) {
      db.createDbsIfNotExist(dbs)
        .then(function(results) {
          results.should.be.Array;
          results.filter(function(result) {
            return result === false;
          }).should.have.length(0);
          return db.dbsExist(dbs);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(dbs.length);
          results.filter(function(result) {
            return dbs.indexOf(result) < 0;
          }).should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should not throw an Error if one or more of databases already exist', function() {
      db.createDbsIfNotExist(dbs).should.not.be.rejectedWith(Error);
    });
  });

  describe('dropDbsIfExist', function() {
    var dbs = [dbName, dbName + '_1' + dbName + '_2'];

    it('should not be rejected with an error if database(s) are not specified', function() {
      db.dropDbsIfExist().should.not.be.rejectedWith(Error);
    });

    it('should drop databases', function(done) {
      db.dropDbsIfExist(dbs)
        .then(function(results) {
          results.should.be.Array;
          results.filter(function(result) {
            return result === false;
          }).should.have.length(0);
          return db.dbsExist(dbs);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should not throw an Error if one or more of databases already exist', function() {
      db.dropDbsIfExist(dbs).should.not.be.rejectedWith(Error);
    });
  });

  describe('getTableList', function() {
    before(function(done) {
      dropDb(dbName, done);
    });

    it('should be rejected with an error when database is not specified', function() {
      db.getTableList().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error when database does not exist', function() {
      db.getTableList(dbName).should.be.rejectedWith(Error);
    });
  });

  describe('getTableList', function() {
    before(function(done) {
      dropDb(dbName, done);
    });

    before(function(done) {
      createDb(dbName, done);
    });

    it('should return an empty list when there are no tables', function(done) {
      db.getTableList(dbName)
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should not be rejected with an error when database exists', function() {
      db.getTableList(dbName).should.not.be.rejectedWith(Error);
    });
  });

  describe('getTableList', function() {
    before(function(done) {
      createDb(dbName, done);
    });

    before(function(done) {
      createTables(dbName, tableNames, done);
    });

    it('should return a list of tables', function(done) {
      db.getTableList(dbName)
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
    before(function(done) {
      recreateDb(dbName, done);
    });

    before(function(done) {
      recreateTables(dbName, tableNames, done);
    });

    it('should return true if a table exists', function(done) {
      db.tableExists(dbName, tableNames[0])
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should return false if a table does not exist', function(done) {
      db.tableExists(dbName, 'asdfasdfasdfasdfasdfasdf')
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });

    it('should return false when table name is not specified', function(done) {
      db.tableExists(dbName)
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });

    it('should be rejected with an error when database name is not specified', function() {
      db.tableExists().should.be.rejectedWith(Error);
    });

    it('should not be rejected with an error when table name is not specified', function() {
      db.tableExists(dbName).should.not.be.rejectedWith(Error);
    });
  });

  describe('createTable', function() {
    before(function(done) {
      recreateDb(dbName, done);
    });

    it('should be rejected with an error when database name is not specified', function() {
      db.createTable().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error when table name is not specified', function() {
      db.createTable(dbName).should.be.rejectedWith(Error);
    });

    it('should create a table when it does not exist', function(done) {
      db.tableExists(dbName, 'asdfasdfasdfasdfasdfasdf')
        .then(function(result) {
          mustBeFalse(result);
          return db.createTable(dbName, 'asdfasdfasdfasdfasdfasdf');
        })
        .then(function(result) {
          mustBeTrue(result);
          return db.tableExists(dbName, 'asdfasdfasdfasdfasdfasdf');
        })
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should be rejected with an error when table already exists', function() {
      db.createTable(dbName, 'asdfasdfasdfasdfasdfasdf').should.be.rejectedWith(Error);
    });
  });

  describe('dropTable', function() {
    before(function(done) {
      recreateDb(dbName, done);
    });

    before(function(done) {
      createTables(dbName, 'asdfasdfasdfasdfasdfasdf', done);
    });

    it('should be rejected with an error when database name is not specified', function() {
      db.dropTable().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error when table name is not specified', function() {
      db.dropTable(dbName).should.be.rejectedWith(Error);
    });

    it('should drop a table if it exists', function(done) {
      db.tableExists(dbName, 'asdfasdfasdfasdfasdfasdf')
        .then(function(result) {
          mustBeTrue(result);
          return db.dropTable(dbName, 'asdfasdfasdfasdfasdfasdf');
        })
        .then(function(result) {
          mustBeTrue(result);
          return db.tableExists(dbName, 'asdfasdfasdfasdfasdfasdf');
        })
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });

    it('should be rejected with an error when table does not exist', function() {
      db.dropTable(dbName, 'asdfasdfasdfasdfasdfasdf').should.be.rejectedWith(Error);
    });
  });

  describe('dropTableIfExists', function() {
    before(function(done) {
      recreateDb(dbName, done);
    });

    before(function(done) {
      recreateTables(dbName, tableNames, done);
    });

    it('should be rejected with an error when database name is not specified', function() {
      db.dropTableIfExists().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error when table name is not specified', function() {
      db.dropTableIfExists(dbName).should.not.be.rejectedWith(Error);
    });

    it('should return true if not table name is specified', function(done) {
      db.dropTableIfExists(dbName)
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should drop table if exists', function(done) {
      db.tableExists(dbName, tableNames[0])
        .then(function(result) {
          mustBeTrue(result);
          return db.dropTableIfExists(dbName, tableNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return db.tableExists(dbName, tableNames[0]);
        })
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });

    it('should drop table if does not exist', function(done) {
      db.tableExists(dbName, tableNames[0])
        .then(function(result) {
          mustBeFalse(result);
          return db.dropTableIfExists(dbName, tableNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return db.tableExists(dbName, tableNames[0]);
        })
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });
  });

  describe('dropTablesIfExist', function() {
    before(function(done) {
      recreateDb(dbName, done);
    });

    before(function(done) {
      recreateTables(dbName, tableNames, done);
    });

    it('should be rejected with an error when database name is not specified', function() {
      db.dropTablesIfExist().should.be.rejectedWith(Error);
    });

    it('should not be rejected with an error when table name is not specified', function() {
      db.dropTablesIfExist(dbName).should.not.be.rejectedWith(Error);
    });

    it('should drop tables if exist', function(done) {
      var curTables = tableNames.slice(0, 3);
      db.tablesExist(dbName, curTables)
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(curTables.length);
          results.filter(function(result) {
            return curTables.indexOf(result) < 0;
          }).should.have.length(0);
          return db.dropTablesIfExist(dbName, curTables);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(curTables.length);
          results.filter(function(result) {
            return result === true;
          }).should.have.length(curTables.length);
          return db.tablesExist(dbName, curTables);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should drop tables if not exist', function(done) {
      db.tablesExist(dbName, ['a', 'b', 'c'])
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          return db.dropTablesIfExist(dbName, ['a', 'b', 'c']);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should return empty array when not table names specified', function(done) {
      db.dropTablesIfExist(dbName)
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          done();
        })
        .catch(done);
    });
  });

  describe('createTableIfNotExists', function() {
    before(function(done) {
      recreateDb(dbName, done);
    });

    it('should be rejected with an error when database name is not specified', function() {
      db.createTableIfNotExists().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error when table name is not specified', function() {
      db.createTableIfNotExists(dbName).should.be.rejectedWith(Error);
    });

    it('should create a table if not exists', function(done) {
      db.tableExists(dbName, tableNames[0])
        .then(function(result) {
          mustBeFalse(result);
          return db.createTableIfNotExists(dbName, tableNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return db.tableExists(dbName, tableNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should create a table if exists', function(done) {
      db.tableExists(dbName, tableNames[0])
        .then(function(result) {
          mustBeTrue(result);
          return db.createTableIfNotExists(dbName, tableNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return db.tableExists(dbName, tableNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });
  });

  describe('createTablesIfNotExist', function() {
    before(function(done) {
      recreateDb(dbName, done);
    });

    it('should be rejected with an error when database name is not specified', function() {
      db.createTablesIfNotExist().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error when table name is not specified', function() {
      db.createTablesIfNotExist(dbName).should.be.rejectedWith(Error);
    });

    it('should create tables if not exist', function(done) {
      db.tablesExist(dbName, tableNames)
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          return db.createTablesIfNotExist(dbName, tableNames);
        })
        .then(function(result) {
          result.should.be.Array;
          result.should.have.length(tableNames.length);
          return db.tablesExist(dbName, tableNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(tableNames.length);
          results.filter(function(result) {
            return tableNames.indexOf(result) < 0;
          }).should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should create tables if exist', function(done) {
      db.tablesExist(dbName, tableNames)
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(tableNames.length);
          results.filter(function(result) {
            return tableNames.indexOf(result) < 0;
          }).should.have.length(0);
          return db.createTablesIfNotExist(dbName, tableNames);
        })
        .then(function(result) {
          result.should.be.Array;
          result.should.have.length(0);
          return db.getTableList(dbName);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(tableNames.length);
          results.filter(function(result) {
            return tableNames.indexOf(result) < 0;
          }).should.have.length(0);
          done();
        })
        .catch(done);
    });
  });

  describe('getIndexList', function() {

    before(function(done) {
      recreateDb(dbName, done);
    });

    before(function(done) {
      recreateTables(dbName, tableNames, done);
    });

    it('should be rejected with an error if database name if not specified', function() {
      db.getIndexList().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table name if not specified', function() {
      db.getIndexList(dbName).should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table does not exit', function() {
      db.getIndexList(dbName, 'adfs').should.be.rejectedWith(Error);
    });

    it('should return an empty list when table has no indexes', function(done) {
      db.getIndexList(dbName, tableNames[0])
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should return list of indexes on a table', function(done) {
      db.createIndexesIfNotExist(dbName, tables[randomTableId], indexes[randomTableId])
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(indexNames.length);
          return db.getIndexList(dbName, tables[randomTableId]);
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
    before(function(done) {
      recreateDb(dbName, done);
    });

    before(function(done) {
      recreateTables(dbName, tableNames, done);
    });

    it('should be rejected with an error if database name if not specified', function() {
      db.indexExists().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table name if not specified', function() {
      db.indexExists(dbName).should.be.rejectedWith(Error);
    });

    it('should return true if an index exist on a table', function(done) {
      db.createIndexesIfNotExist(dbName, tables[randomTableId], indexes[randomTableId])
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(indexNames.length);
          return db.indexExists(dbName, tables[randomTableId], indexNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should return false if an index does not exist on a table', function(done) {
      db.indexExists(dbName, tables[randomTableId], 'asdfasdfasdfasdfasdfasdf')
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });

    it('should be rejected with an error if a table does not exist', function() {
      db.indexExists(dbName, 'asdfasdfasdfasdfasdfasdffsadfasdf', 'asdfasdfasdfasdfasdfasdf').should.be.rejectedWith(Error);
    });
  });

  describe('dropIndex', function() {
    before(function(done) {
      recreateDb(dbName, done);
    });

    before(function(done) {
      recreateTables(dbName, tableNames, done);
    });

    it('should be rejected with an error if database name if not specified', function() {
      db.dropIndex().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table name if not specified', function() {
      db.dropIndex(dbName).should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if index name if not specified', function() {
      db.dropIndex(dbName, tables[randomTableId]).should.be.rejectedWith(Error);
    });

    it('should drop an index and return true if exists', function(done) {
      db.createIndexIfNotExists(dbName, tables[randomTableId], indexNames[0])
        .then(function(result) {
          mustBeTrue(result);
          return db.indexExists(dbName, tables[randomTableId], indexNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return db.dropIndex(dbName, tables[randomTableId], indexNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return db.indexExists(dbName, tables[randomTableId], indexNames[0]);
        })
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });

    it('should be rejected with an error if index does not exist', function() {
      db.dropIndex(dbName, tables[randomTableId], indexNames[0]).should.be.rejectedWith(Error);
    });
  });

  describe('dropIndexIfExists', function() {
    before(function(done) {
      recreateDb(dbName, done);
    });

    before(function(done) {
      recreateTables(dbName, tableNames, done);
    });

    it('should be rejected with an error if database name if not specified', function() {
      db.dropIndexIfExists().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table name if not specified', function() {
      db.dropIndexIfExists(dbName).should.be.rejectedWith(Error);
    });

    it('should not be rejected with an error if index name if not specified', function() {
      db.dropIndexIfExists(dbName, tables[randomTableId]).should.not.be.rejectedWith(Error);
    });

    it('should drop an index and return true if exists', function(done) {
      db.createIndexIfNotExists(dbName, tables[randomTableId], indexNames[1])
        .then(function(result) {
          mustBeTrue(result);
          return db.indexExists(dbName, tables[randomTableId], indexNames[1]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return db.dropIndexIfExists(dbName, tables[randomTableId], indexNames[1]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return db.indexExists(dbName, tables[randomTableId], indexNames[1]);
        })
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });

    it('should drop an index and return true if it does not exist', function(done) {
      db.indexExists(dbName, tables[randomTableId], indexNames[1])
        .then(function(result) {
          mustBeFalse(result);
          return db.dropIndexIfExists(dbName, tables[randomTableId], indexNames[1]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return db.indexExists(dbName, tables[randomTableId], indexNames[1]);
        })
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });
  });

  describe('dropIndexesIfExist', function() {
    before(function(done) {
      recreateDb(dbName, done);
    });

    before(function(done) {
      recreateTables(dbName, tableNames, done);
    });

    it('should be rejected with an error if database name if not specified', function() {
      db.dropIndexesIfExist().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table name is not specified', function() {
      db.dropIndexesIfExist(dbName).should.be.rejectedWith(Error);
    });

    it('should not be rejected with an error if index names are not specified', function() {
      db.dropIndexesIfExist(dbName, tables[randomTableId]).should.not.be.rejectedWith(Error);
    });

    it('should drop indexes and return true if they exist', function(done) {
      db.createIndexesIfNotExist(dbName, tables[randomTableId], indexes[randomTableId])
        .then(function(results) {
          results.should.be.Array;
          results.filter(function(result) {
            return result === true;
          }).should.have.length(indexNames.length);
          return db.indexesExist(dbName, tables[randomTableId], indexNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(indexNames.length);
          return db.dropIndexesIfExist(dbName, tables[randomTableId], indexNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.filter(function(result) {
            return result === true;
          }).should.have.length(indexNames.length);
          return db.indexesExist(dbName, tables[randomTableId], indexNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should drop indexes and return if they do not exist', function(done) {
      db.indexesExist(dbName, tables[randomTableId], indexNames)
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          return db.dropIndexesIfExist(dbName, tables[randomTableId], indexNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          return db.indexesExist(dbName, tables[randomTableId], indexNames);
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
    before(function(done) {
      recreateDb(dbName, done);
    });

    before(function(done) {
      recreateTables(dbName, tableNames, done);
    });

    it('should be rejected with an error if database name if not specified', function() {
      db.createIndex().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table name if not specified', function() {
      db.createIndex(dbName).should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if index name if not specified', function() {
      db.createIndex(dbName, tables[randomTableId]).should.be.rejectedWith(Error);
    });

    it('should create an index if does not exist', function(done) {
      db.indexExists(dbName, tables[randomTableId], indexNames[0])
        .then(function(result) {
          mustBeFalse(result);
          return db.createIndex(dbName, tables[randomTableId], indexNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return db.indexExists(dbName, tables[randomTableId], indexNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should be rejected with an error if index already exist', function() {
      db.createIndex(dbName, tables[randomTableId], indexNames[0]).should.be.rejectedWith(Error);
    });
  });

  describe('createIndexIfNotExists', function() {
    before(function(done) {
      recreateDb(dbName, done);
    });

    before(function(done) {
      recreateTables(dbName, tableNames, done);
    });

    it('should be rejected with an error if database name if not specified', function() {
      db.createIndexIfNotExists().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table name if not specified', function() {
      db.createIndexIfNotExists(dbName).should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if index name if not specified', function() {
      db.createIndexIfNotExists(dbName, tables[randomTableId]).should.be.rejectedWith(Error);
    });

    it('should create an index if does not exist', function(done) {
      db.indexExists(dbName, tables[randomTableId], indexNames[1])
        .then(function(result) {
          mustBeFalse(result);
          return db.createIndexIfNotExists(dbName, tables[randomTableId], indexNames[1]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return db.indexExists(dbName, tables[randomTableId], indexNames[1]);
        })
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should return true if index exist', function(done) {
      db.indexExists(dbName, tables[randomTableId], indexNames[1])
        .then(function(result) {
          mustBeTrue(result);
          return db.createIndexIfNotExists(dbName, tables[randomTableId], indexNames[1]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return db.indexExists(dbName, tables[randomTableId], indexNames[1]);
        })
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });
  });

  describe('createIndexesIfNotExist', function() {
    before(function(done) {
      recreateDb(dbName, done);
    });

    before(function(done) {
      recreateTables(dbName, tableNames, done);
    });

    it('should be rejected with an error if database name if not specified', function() {
      db.createIndex().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table name if not specified', function() {
      db.createIndexesIfNotExist(dbName).should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if index data if not specified', function() {
      db.createIndexesIfNotExist(dbName, tables[randomTableId]).should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if index data is not an Array', function() {
      db.createIndexesIfNotExist(dbName, tables[randomTableId], 'TEST').should.be.rejectedWith(Error);
    });

    it('should create indexes and return true if they do not exist', function(done) {
      var curIndexNames = indexNames.slice(0, 2);
      var curIndexData = indexes[randomTableId].slice(0, 2);
      db.indexesExist(dbName, tables[randomTableId], curIndexNames)
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          return db.createIndexesIfNotExist(dbName, tables[randomTableId], curIndexData);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(curIndexNames.length);
          return db.indexesExist(dbName, tables[randomTableId], curIndexNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(curIndexNames.length);
          done();
        })
        .catch(done);
    });

    it('should create indexes and return if they exist', function(done) {
      var indexesInDb = null;
      db.indexesExist(dbName, tables[randomTableId], indexNames)
        .then(function(results) {
          results.should.be.Array;
          indexesInDb = results.length;
          return db.createIndexesIfNotExist(dbName, tables[randomTableId], indexes[randomTableId]);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(indexNames.length - indexesInDb);
          return db.indexesExist(dbName, tables[randomTableId], indexNames);
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
    before(function(done) {
      dropDb(dbName, done);
    });

    it('should migrate database with provided configuration', function(done) {
      db.migrate(dbName, tables, indexes)
        .then(function(result) {
          mustBeTrue(result);
          return db.dbsExist(dbName);

        })
        .then(function(result) {
          result.should.be.Array;
          result.should.have.length(1);
          result.should.contain(dbName);
          return db.tablesExist(dbName, tableNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(tableNames.length);
          results.forEach(function(result) {
            tableNames.should.contain(result);
          });
          return db.indexesExist(dbName, tables[randomTableId], indexNames);
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
    before(function(done) {
      recreateDb(dbName, done);
    });

    before(function(done) {
      recreateTables(dbName, tableNames, done);
    });

    before(function(done) {
      db.createIndexesIfNotExist(dbName, tables[randomTableId], indexes[randomTableId])
        .then(function(result) {
          done();
        })
        .catch(done);
    });

    it('should be rejected with an error when rethinkdbdash instance is not specified', function() {
      db.Model().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error when database name is not specified', function() {
      db.Model(db.r).should.be.rejectedWith(Error);
    });

    it('should be rejected with an error when table name is not specified', function() {
      db.Model(db.r, dbName).should.be.rejectedWith(Error);
    });

    describe('find', function() {
      before(function(done) {
        resetTables(dbName, urlTable, done);
      });

      it('should not be rejected with an error when id is not specified', function(done) {
        UrlModel.find().should.not.be.rejectedWith(Error);
        UrlModel.find()
          .then(function(result) {
            should.not.exist(result);
            expect(result).to.be.null;
            done();
          })
          .catch(done);
      });

      it('should find a document with given id', function(done) {
        var object = Factory.build('url');
        UrlModel.create(object)
          .then(function(result) {
            mustBeTrue(result.inserted === 1);
            return UrlModel.find(object.id);
          })
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
      var objects = getRandomObjects();

      before(function(done) {
        resetTables(dbName, urlTable, done);
      });

      before(function(done) {
        UrlModel.create(objects)
          .then(function(results) {
            done();
          })
          .catch(done);
      });

      it('should be rejected with an error when fields are not specified', function() {
        UrlModel.findAll().should.be.rejectedWith(Error);
      });

      it('should be rejected with an error when index is not specified', function() {
        UrlModel.findAll('url').should.be.rejectedWith(Error);
      });

      it('should be rejected with an error when search field is null', function() {
        UrlModel.findAll(null, 'url').should.be.rejectedWith(Error);
        UrlModel.findAll(null, 'id').should.be.rejectedWith(Error);
        UrlModel.findAll(null, 'post_id').should.be.rejectedWith(Error);
      });

      it('should be able to fetch document with primary key', function(done) {
        var object = objects[0];
        UrlModel.findAll(object.id, 'id')
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(1);
            results[0].should.be.eql(object);
            done();
          })
          .catch(done);
      });

      it('should fetch documents with multiple primary keys', function(done) {
        var id1 = objects[0].id;
        var id2 = objects[1].id;
        var totalIds = objects.filter(function(object) {
          return object.id === id1 || object.id === id2;
        }).length;

        UrlModel.findAll(objects[0].id, objects[1].id, 'id')
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(totalIds);
            done();
          })
          .catch(done);
      });

      it('should be able to fetch document with a single secondary index', function(done) {
        var url = objects[1].url;
        var totalUrls = objects.filter(function(object) {
          return object.url === url;
        }).length;

        UrlModel.findAll(url, 'url')
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(totalUrls);
            done();
          })
          .catch(done);
      });

      it('should be able to fetch documents with multiple values of a secondary index', function(done) {
        var url1 = objects[2].url;
        var url2 = objects[3].url;
        var totalUrls = objects.filter(function(object) {
          return object.url === url1 || object.url === url2;
        }).length;

        UrlModel.findAll(url1, url2, 'url')
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(totalUrls);
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
            results[0].should.be.eql(object);
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

      it('should be rejected with an error with compound index containing null field', function() {
        UrlModel.findAll(['http://saini.co.in/', null], 'url_and_post_id').should.be.rejectedWith(Error);
        UrlModel.findAll([null, 1], 'url_and_post_id').should.be.rejectedWith(Error);
      });
    });

    describe('filter', function() {
      var objects = getRandomObjects();

      before(function(done) {
        resetTables(dbName, urlTable, done);
      });

      before(function(done) {
        UrlModel.create(objects)
          .then(function(results) {
            done();
          })
          .catch(done);
      });

      it('should be rejected with an error when predicate is not specified', function() {
        UrlModel.filter().should.be.rejectedWith(Error);
      });

      it('should fetch documents when a predicate is specified as ReQL', function(done) {
        var totalUrls = objects.filter(function(object) {
          return object.post_id > 100;
        }).length;
        UrlModel.filter(db.r.row('post_id').gt(100))
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(totalUrls);
            done();
          })
          .catch(done);
      });

      it('should fetch documents when a predicate is specified as object', function(done) {
        var totalUrls = objects.filter(function(object) {
          return object.post_id === objects[1].post_id;
        }).length;
        UrlModel.filter({ post_id: objects[1].post_id })
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(totalUrls);
            done();
          })
          .catch(done);
      });

      it('should fetch documents when a predicate is specified as function', function(done) {
        var totalUrls = objects.filter(function(object) {
          return object.post_id === objects[2].post_id;
        }).length;
        UrlModel.filter(function(url) { return url('post_id').eq(objects[2].post_id); })
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(totalUrls);
            done();
          })
          .catch(done);
      });

      it('should fetch documents when a predicate is specified as ReQL', function(done) {
        var totalUrls = objects.filter(function(object) {
          return object.post_id > 100 && object.post_id < 200;
        }).length;
        UrlModel.filter(db.r.row('post_id').gt(100).and(db.r.row('post_id').lt(200)))
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(totalUrls);
            done();
          })
          .catch(done);
      });

      it('should fetch documents when a predicate is specified as ReQL', function(done) {
        var totalUrls = objects.filter(function(object) {
          return object.post_id < 100;
        }).length;
        UrlModel.filter(db.r.row('post_id').lt(100))
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(totalUrls);
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
      var objects = getRandomObjects();

      before(function(done) {
        resetTables(dbName, urlTable, done);
      });

      before(function(done) {
        UrlModel.create(objects)
          .then(function(results) {
            done();
          })
          .catch(done);
      });

      it('should be rejected with an error if id is not specified', function() {
        UrlModel.update().should.be.rejectedWith(Error);
      });

      it('should be rejected with an error if updates object is not specified', function() {
        UrlModel.update(1).should.be.rejectedWith(Error);
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
      var objects = getRandomObjects();

      before(function(done) {
        resetTables(dbName, urlTable, done);
      });

      before(function(done) {
        UrlModel.create(objects)
          .then(function(results) {
            done();
          })
          .catch(done);
      });

      it('should be rejected with an error if id is not specified', function() {
        UrlModel.destroy().should.be.rejectedWith(Error);
      });

      it('should destroy a document with an id', function(done) {
        UrlModel.destroy(objects[9].id)
          .then(function(result) {
            result.deleted.should.be.Number;
            result.deleted.should.be.equal(1);
            return UrlModel.find(objects[9].id);
          })
          .then(function(result) {
            should.not.exist(result);
            expect(result).to.be.null;
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
      var objects = getRandomObjects();

      before(function(done) {
        resetTables(dbName, urlTable, done);
      });

      before(function(done) {
        UrlModel.create(objects)
          .then(function(results) {
            done();
          })
          .catch(done);
      });

      it('should be rejected with an error when fields are not specified', function() {
        UrlModel.destroyAll().should.be.rejectedWith(Error);
      });

      it('should be rejected with an error when index is not specified', function() {
        UrlModel.destroyAll('url').should.be.rejectedWith(Error);
      });

      it('should be rejected with an error when search field is null', function() {
        UrlModel.destroyAll(null, 'url').should.be.rejectedWith(Error);
        UrlModel.destroyAll(null, 'id').should.be.rejectedWith(Error);
        UrlModel.destroyAll(null, 'post_id').should.be.rejectedWith(Error);
      });

      it('should be able to destroy document with primary key', function(done) {
        var id = objects[0].id;
        var totalUrls = objects.filter(function(object) {
          return object.id === id;
        }).length;
        UrlModel.destroyAll(id, 'id')
          .then(function(results) {
            results.deleted.should.be.Number;
            results.deleted.should.be.equal(totalUrls);
            return UrlModel.find(id);
          })
          .then(function(result) {
            should.not.exist(result);
            expect(result).to.be.null;
            done();
          })
          .catch(done);
      });

      it('should destroy documents with multiple primary keys', function(done) {
        var id1 = objects[1].id;
        var id2 = objects[2].id;
        var totalUrls = objects.filter(function(object) {
          return object.id === id1 || object.id === id2;
        }).length;
        UrlModel.destroyAll(id1, id2, 'id')
          .then(function(results) {
            results.deleted.should.be.Number;
            results.deleted.should.be.equal(totalUrls);
            return UrlModel.findAll(id1, id2, 'id');
          })
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(0);
            done();
          })
          .catch(done);
      });

      it('should destroy document with a single secondary index', function(done) {
        var url = objects[3].url;
        var totalUrls = objects.filter(function(object) {
          return object.url === url;
        }).length;
        UrlModel.destroyAll(url, 'url')
          .then(function(results) {
            results.deleted.should.be.Number;
            results.deleted.should.be.equal(totalUrls);
            return UrlModel.find(objects[3].id);
          })
          .then(function(result) {
            should.not.exist(result);
            expect(result).to.be.null;
            done();
          })
          .catch(done);
      });

      it('should destroy documents with multiple values of a secondary index', function(done) {
        var pid1 = objects[4].post_id;
        var pid2 = objects[5].post_id;
        var totalUrls = objects.filter(function(object) {
          return object.post_id === pid1 || object.post_id === pid2;
        }).length;
        UrlModel.destroyAll(pid1, pid2, 'post_id')
          .then(function(results) {
            results.deleted.should.be.Number;
            results.deleted.should.be.equal(totalUrls);
            return UrlModel.findAll(pid1, pid2, 'post_id');
          })
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(0);
            done();
          })
          .catch(done);
      });

      it('should be able to fetch documents with compound index', function(done) {
        var object = objects[6];
        UrlModel.destroyAll([object.url, object.post_id], 'url_and_post_id')
          .then(function(results) {
            results.deleted.should.be.Number;
            results.deleted.should.be.equal(1);
            return UrlModel.findAll([object.url, object.post_id], 'url_and_post_id');
          })
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(0);
            done();
          })
          .catch(done);
      });

      it('should be able to fetch documents with multiple values of a compound index', function(done) {
        UrlModel.destroyAll([objects[7].url, objects[7].post_id], [objects[8].url, objects[8].post_id], 'url_and_post_id')
          .then(function(results) {
            results.deleted.should.be.Number;
            results.deleted.should.be.equal(2);
            return UrlModel.findAll([objects[7].url, objects[7].post_id], [objects[8].url, objects[8].post_id], 'url_and_post_id');
          })
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(0);
            done();
          })
          .catch(done);
      });

      it('should destroy document with rethinkdb options', function(done) {
        var url = objects[9].url;
        var totalUrls = objects.filter(function(object) {
          return object.url === url;
        }).length;
        UrlModel.destroyAll(url, 'url', { durability: 'hard' })
          .then(function(results) {
            results.deleted.should.be.Number;
            results.deleted.should.be.equal(totalUrls);
            return UrlModel.find(objects[9].id);
          })
          .then(function(result) {
            should.not.exist(result);
            expect(result).to.be.null;
            done();
          })
          .catch(done);
      });
    });

    describe('create', function() {
      var objects = getRandomObjects();

      before(function(done) {
        resetTables(dbName, urlTable, done);
      });

      it('should be rejected with an error if objects are not specified', function() {
        UrlModel.create().should.be.rejectedWith(Error);
      });

      it('should not insert an object with id set as null', function(done) {
        var object = objects[0];
        object.id = null;
        UrlModel.create(object)
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(0);
            done();
          })
          .catch(done);
      });

      it('should insert when a single object is passed', function(done) {
        UrlModel.create(objects[1])
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(1);
            return UrlModel.find(objects[1].id);
          })
          .then(function(result) {
            result.should.be.Object;
            result.should.be.eql(objects[1]);
            done();
          })
          .catch(done);
      });

      it('should insert an arbitrary number of object passed', function(done) {
        var newObjects = [objects[2], objects[3], objects[4]];
        UrlModel.create(newObjects)
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(newObjects.length);
            return UrlModel.findAll(objects[2].id, objects[3].id, objects[4].id, 'id');
          })
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(newObjects.length);
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

      it('should not insert an arbitrary number of object passed whose ids already exist in table', function(done) {
        var newObjects = [objects[2], objects[3], objects[4]];
        UrlModel.create(newObjects)
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(0);
            done();
          })
          .catch(done);
      });

      it('should insert documents whose ids are not already present in the table', function(done) {
        var newObjects = [objects[2], objects[3], objects[5], objects[6]];
        UrlModel.create(newObjects)
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(2);
            return UrlModel.findAll(objects[2].id, objects[3].id, objects[5].id, objects[6].id, 'id');
          })
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(newObjects.length);
            done();
          })
          .catch(done);
      });

      it('should insert documents whose ids are not already present in the table or whose ids are null', function(done) {
        var newObjects = [objects[5], objects[6], objects[7], objects[8]];
        newObjects[2].id = null;
        UrlModel.create(newObjects)
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(1);
            return UrlModel.findAll(objects[5].id, objects[6].id, objects[8].id, 'id');
          })
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(newObjects.length - 1);
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
