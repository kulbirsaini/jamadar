/*jshint expr: true*/
'use strict';

var _ = require('lodash');
var chai = require('chai');
chai.config.includeStack = true;
chai.config.showDiff = true;

var chaiAsPromised = require('chai-as-promised');
var path = require('path');
var Factory = require('rosie').Factory;

var config = require(path.join(__dirname, 'config'));
var Jamadar = require(path.join(__dirname, '../index'));

var jamadar = new Jamadar(config.rethinkdb);
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
  .attr('post_id', function() { return _.random(1, 1000); })
  .attr('created_at', function() { return Date.now(); })
  .attr('updated_at', function() { return Date.now(); })
  .attr('id', function() { return _.random(1, 10000); });

function getRandomUrl() {
  return urls[_.random(0, urlLength - 1)];
}

function getRandomObjects() {
  var num = _.random(10, 20);
  var objects = [];
  var object = null;
  for (var i = 0; i < num; i++) {
    object = Factory.build('url');
    object.url = object.url + '/' + _.random(0, 1000);
    objects.push(object);
  }
  return objects;
}

function createDb(dbNames, done) {
  jamadar.createDbsIfNotExist(dbNames)
    .then(function(result) {
      done();
    })
    .catch(done);
}

function dropDb(dbNames, done) {
  jamadar.dropDbsIfExist(dbNames)
    .then(function(result) {
      done();
    })
    .catch(done);
}

function recreateDb(dbNames, done) {
  jamadar.dropDbsIfExist(dbNames)
    .then(function(result) {
      return jamadar.createDbsIfNotExist(dbNames);
    })
    .then(function(result) {
      done();
    })
    .catch(done);
}

function createTables(dbName, tableNames, done) {
  jamadar.createTablesIfNotExist(dbName, tableNames)
    .then(function(result) {
      done();
    })
    .catch(done);
}

function recreateTables(dbName, tableNames, done) {
  jamadar.dropTablesIfExist(dbName, tableNames)
    .then(function(result) {
      return jamadar.createTablesIfNotExist(dbName, tableNames);
    })
    .then(function(result) {
      done();
    })
    .catch(done);
}

function resetTables(dbName, tableNames, done) {
  jamadar.resetTables(dbName, tableNames)
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

describe('Jamadar', function() {
  var dbName = config.rethinkdb.db;
  var tableConfig = config.tableConfig;
  var indexes = {};
  var tableNames = [];

  Object.keys(tableConfig).forEach(function(tableId) {
    tableNames.push(tableConfig[tableId].table_name);
    if (_.isObject(tableConfig[tableId].indexes)) {
      indexes[tableId] = tableConfig[tableId].indexes;
    }
  });

  var randomTableId = Object.keys(tableConfig)[0];
  var indexNames = indexes[randomTableId].map(function(indexData) { return indexData.name; });
  var urlTable = tableNames[0];
  var UrlModel = jamadar.Model(dbName, urlTable).model;

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
      jamadar.getDbList()
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
      jamadar.getDbList()
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
      jamadar.dbExists(dbName)
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
      jamadar.dbExists(dbName)
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
      jamadar.createDb().should.be.rejectedWith(Error);
    });

    it('should create a database', function(done) {
      jamadar.createDb(dbName)
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should be rejected with an error if a database already exists', function() {
      jamadar.createDb(dbName).should.be.rejectedWith(Error);
    });
  });

  describe('dropDb', function() {
    before(function(done) {
      recreateDb(dbName, done);
    });

    it('should be rejected with an error if database is not specified', function() {
      jamadar.dropDb().should.be.rejectedWith(Error);
    });

    it('should drop a database', function(done) {
      jamadar.dropDb(dbName)
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should be rejected with an error when a database does not exist', function() {
      jamadar.dropDb(dbName).should.be.rejectedWith(Error);
    });
  });

  describe('createDbIfNotExists', function() {
    before(function(done) {
      dropDb(dbName, done);
    });

    it('should be rejected with an error if database is not specified', function() {
      jamadar.createDbIfNotExists().should.be.rejectedWith(Error);
    });

    it('should create a database if it does not exist', function(done) {
      jamadar.dbExists(dbName)
        .then(function(result) {
          mustBeFalse(result);
          return jamadar.createDbIfNotExists(dbName);
        })
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.dbExists(dbName);
        })
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should create a database even if it does exist', function(done) {
      jamadar.dbExists(dbName)
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.createDbIfNotExists(dbName);
        })
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.dbExists(dbName);
        })
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should not be rejected with an error even if database already exists', function() {
      jamadar.createDbIfNotExists(dbName).should.not.be.rejectedWith(Error);
    });
  });

  describe('dropDbIfExists', function() {
    before(function(done) {
      createDb(dbName, done);
    });

    it('should not be rejected with an error if database is not specified', function() {
      jamadar.dropDbIfExists().should.not.be.rejectedWith(Error);
    });

    it('should return true if a database is not specified', function(done) {
      jamadar.dropDbIfExists()
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should drop a database if it exists', function(done) {
      jamadar.dbExists(dbName)
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.dropDbIfExists(dbName);
        })
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.dbExists(dbName);
        })
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });

    it('should not throw an Error if database does not exist', function() {
      jamadar.dropDbIfExists(dbName).should.not.be.rejectedWith(Error);
    });
  });

  describe('createDbsIfNotExist', function() {
    var dbs = [dbName, dbName + '_1' + dbName + '_2'];

    it('should be rejected with an error if database(s) are not specified', function() {
      jamadar.createDbsIfNotExist().should.be.rejectedWith(Error);
    });

    it('should create databases', function(done) {
      jamadar.createDbsIfNotExist(dbs)
        .then(function(results) {
          results.should.be.Array;
          results.filter(function(result) {
            return result === false;
          }).should.have.length(0);
          return jamadar.dbsExist(dbs);
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
      jamadar.createDbsIfNotExist(dbs).should.not.be.rejectedWith(Error);
    });
  });

  describe('dropDbsIfExist', function() {
    var dbs = [dbName, dbName + '_1' + dbName + '_2'];

    it('should not be rejected with an error if database(s) are not specified', function() {
      jamadar.dropDbsIfExist().should.not.be.rejectedWith(Error);
    });

    it('should drop databases', function(done) {
      jamadar.dropDbsIfExist(dbs)
        .then(function(results) {
          results.should.be.Array;
          results.filter(function(result) {
            return result === false;
          }).should.have.length(0);
          return jamadar.dbsExist(dbs);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should not throw an Error if one or more of databases already exist', function() {
      jamadar.dropDbsIfExist(dbs).should.not.be.rejectedWith(Error);
    });
  });

  describe('getTableList', function() {
    before(function(done) {
      dropDb(dbName, done);
    });

    it('should be rejected with an error when database is not specified', function() {
      jamadar.getTableList().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error when database does not exist', function() {
      jamadar.getTableList(dbName).should.be.rejectedWith(Error);
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
      jamadar.getTableList(dbName)
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should not be rejected with an error when database exists', function() {
      jamadar.getTableList(dbName).should.not.be.rejectedWith(Error);
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
      jamadar.getTableList(dbName)
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
      jamadar.tableExists(dbName, tableNames[0])
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should return false if a table does not exist', function(done) {
      jamadar.tableExists(dbName, 'asdfasdfasdfasdfasdfasdf')
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });

    it('should return false when table name is not specified', function(done) {
      jamadar.tableExists(dbName)
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });

    it('should be rejected with an error when database name is not specified', function() {
      jamadar.tableExists().should.be.rejectedWith(Error);
    });

    it('should not be rejected with an error when table name is not specified', function() {
      jamadar.tableExists(dbName).should.not.be.rejectedWith(Error);
    });
  });

  describe('createTable', function() {
    before(function(done) {
      recreateDb(dbName, done);
    });

    it('should be rejected with an error when database name is not specified', function() {
      jamadar.createTable().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error when table name is not specified', function() {
      jamadar.createTable(dbName).should.be.rejectedWith(Error);
    });

    it('should create a table when it does not exist', function(done) {
      jamadar.tableExists(dbName, 'asdfasdfasdfasdfasdfasdf')
        .then(function(result) {
          mustBeFalse(result);
          return jamadar.createTable(dbName, 'asdfasdfasdfasdfasdfasdf');
        })
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.tableExists(dbName, 'asdfasdfasdfasdfasdfasdf');
        })
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should be rejected with an error when table already exists', function() {
      jamadar.createTable(dbName, 'asdfasdfasdfasdfasdfasdf').should.be.rejectedWith(Error);
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
      jamadar.dropTable().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error when table name is not specified', function() {
      jamadar.dropTable(dbName).should.be.rejectedWith(Error);
    });

    it('should drop a table if it exists', function(done) {
      jamadar.tableExists(dbName, 'asdfasdfasdfasdfasdfasdf')
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.dropTable(dbName, 'asdfasdfasdfasdfasdfasdf');
        })
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.tableExists(dbName, 'asdfasdfasdfasdfasdfasdf');
        })
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });

    it('should be rejected with an error when table does not exist', function() {
      jamadar.dropTable(dbName, 'asdfasdfasdfasdfasdfasdf').should.be.rejectedWith(Error);
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
      jamadar.dropTableIfExists().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error when table name is not specified', function() {
      jamadar.dropTableIfExists(dbName).should.be.fulfilled;
    });

    it('should return true if not table name is specified', function(done) {
      jamadar.dropTableIfExists(dbName)
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should drop table if exists', function(done) {
      jamadar.tableExists(dbName, tableNames[0])
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.dropTableIfExists(dbName, tableNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.tableExists(dbName, tableNames[0]);
        })
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });

    it('should drop table if does not exist', function(done) {
      jamadar.tableExists(dbName, tableNames[0])
        .then(function(result) {
          mustBeFalse(result);
          return jamadar.dropTableIfExists(dbName, tableNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.tableExists(dbName, tableNames[0]);
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
      jamadar.dropTablesIfExist().should.be.rejectedWith(Error);
    });

    it('should not be rejected with an error when table names are not specified', function() {
      jamadar.dropTablesIfExist(dbName).should.be.resolved;
    });

    it('should drop tables if exist', function(done) {
      var curTables = tableNames.slice(0, 3);
      jamadar.tablesExist(dbName, curTables)
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(curTables.length);
          results.filter(function(result) {
            return curTables.indexOf(result) < 0;
          }).should.have.length(0);
          return jamadar.dropTablesIfExist(dbName, curTables);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(curTables.length);
          results.filter(function(result) {
            return result === true;
          }).should.have.length(curTables.length);
          return jamadar.tablesExist(dbName, curTables);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should drop tables if not exist', function(done) {
      jamadar.tablesExist(dbName, ['a', 'b', 'c'])
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          return jamadar.dropTablesIfExist(dbName, ['a', 'b', 'c']);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should return empty array when not table names specified', function(done) {
      jamadar.dropTablesIfExist(dbName)
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
      jamadar.createTableIfNotExists().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error when table name is not specified', function() {
      jamadar.createTableIfNotExists(dbName).should.be.rejectedWith(Error);
    });

    it('should create a table if not exists', function(done) {
      jamadar.tableExists(dbName, tableNames[0])
        .then(function(result) {
          mustBeFalse(result);
          return jamadar.createTableIfNotExists(dbName, tableNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.tableExists(dbName, tableNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should create a table if exists', function(done) {
      jamadar.tableExists(dbName, tableNames[0])
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.createTableIfNotExists(dbName, tableNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.tableExists(dbName, tableNames[0]);
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
      jamadar.createTablesIfNotExist().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error when table name is not specified', function() {
      jamadar.createTablesIfNotExist(dbName).should.be.rejectedWith(Error);
    });

    it('should create tables if not exist', function(done) {
      jamadar.tablesExist(dbName, tableNames)
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          return jamadar.createTablesIfNotExist(dbName, tableNames);
        })
        .then(function(result) {
          result.should.be.Array;
          result.should.have.length(tableNames.length);
          return jamadar.tablesExist(dbName, tableNames);
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
      jamadar.tablesExist(dbName, tableNames)
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(tableNames.length);
          results.filter(function(result) {
            return tableNames.indexOf(result) < 0;
          }).should.have.length(0);
          return jamadar.createTablesIfNotExist(dbName, tableNames);
        })
        .then(function(result) {
          result.should.be.Array;
          result.should.have.length(0);
          return jamadar.getTableList(dbName);
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
      jamadar.getIndexList().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table name if not specified', function() {
      jamadar.getIndexList(dbName).should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table does not exit', function() {
      jamadar.getIndexList(dbName, 'adfs').should.be.rejectedWith(Error);
    });

    it('should return an empty list when table has no indexes', function(done) {
      jamadar.getIndexList(dbName, tableNames[0])
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should return list of indexes on a table', function(done) {
      jamadar.createIndexesIfNotExist(dbName, tableConfig[randomTableId].table_name, indexes[randomTableId])
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(indexNames.length);
          return jamadar.getIndexList(dbName, tableConfig[randomTableId].table_name);
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
      jamadar.indexExists().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table name if not specified', function() {
      jamadar.indexExists(dbName).should.be.rejectedWith(Error);
    });

    it('should return true if an index exist on a table', function(done) {
      jamadar.createIndexesIfNotExist(dbName, tableConfig[randomTableId].table_name, indexes[randomTableId])
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(indexNames.length);
          return jamadar.indexExists(dbName, tableConfig[randomTableId].table_name, indexNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should return false if an index does not exist on a table', function(done) {
      jamadar.indexExists(dbName, tableConfig[randomTableId].table_name, 'asdfasdfasdfasdfasdfasdf')
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });

    it('should be rejected with an error if a table does not exist', function() {
      jamadar.indexExists(dbName, 'asdfasdfasdfasdfasdfasdffsadfasdf', 'asdfasdfasdfasdfasdfasdf').should.be.rejectedWith(Error);
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
      jamadar.dropIndex().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table name if not specified', function() {
      jamadar.dropIndex(dbName).should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if index name if not specified', function() {
      jamadar.dropIndex(dbName, tableConfig[randomTableId].table_name).should.be.rejectedWith(Error);
    });

    it('should drop an index and return true if exists', function(done) {
      jamadar.createIndexIfNotExists(dbName, tableConfig[randomTableId].table_name, indexNames[0])
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.indexExists(dbName, tableConfig[randomTableId].table_name, indexNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.dropIndex(dbName, tableConfig[randomTableId].table_name, indexNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.indexExists(dbName, tableConfig[randomTableId].table_name, indexNames[0]);
        })
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });

    it('should be rejected with an error if index does not exist', function() {
      jamadar.dropIndex(dbName, tableConfig[randomTableId].table_name, indexNames[0]).should.be.rejectedWith(Error);
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
      jamadar.dropIndexIfExists().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table name if not specified', function() {
      jamadar.dropIndexIfExists(dbName).should.be.rejectedWith(Error);
    });

    it('should not be rejected with an error if index name if not specified', function() {
      jamadar.dropIndexIfExists(dbName, tableConfig[randomTableId].table_name).should.not.be.rejectedWith(Error);
    });

    it('should drop an index and return true if exists', function(done) {
      jamadar.createIndexIfNotExists(dbName, tableConfig[randomTableId].table_name, indexNames[1])
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.indexExists(dbName, tableConfig[randomTableId].table_name, indexNames[1]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.dropIndexIfExists(dbName, tableConfig[randomTableId].table_name, indexNames[1]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.indexExists(dbName, tableConfig[randomTableId].table_name, indexNames[1]);
        })
        .then(function(result) {
          mustBeFalse(result);
          done();
        })
        .catch(done);
    });

    it('should drop an index and return true if it does not exist', function(done) {
      jamadar.indexExists(dbName, tableConfig[randomTableId].table_name, indexNames[1])
        .then(function(result) {
          mustBeFalse(result);
          return jamadar.dropIndexIfExists(dbName, tableConfig[randomTableId].table_name, indexNames[1]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.indexExists(dbName, tableConfig[randomTableId].table_name, indexNames[1]);
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
      jamadar.dropIndexesIfExist().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table name is not specified', function() {
      jamadar.dropIndexesIfExist(dbName).should.be.rejectedWith(Error);
    });

    it('should not be rejected with an error if index names are not specified', function() {
      jamadar.dropIndexesIfExist(dbName, tableConfig[randomTableId].table_name).should.not.be.rejectedWith(Error);
    });

    it('should drop indexes and return true if they exist', function(done) {
      jamadar.createIndexesIfNotExist(dbName, tableConfig[randomTableId].table_name, indexes[randomTableId])
        .then(function(results) {
          results.should.be.Array;
          results.filter(function(result) {
            return result === true;
          }).should.have.length(indexNames.length);
          return jamadar.indexesExist(dbName, tableConfig[randomTableId].table_name, indexNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(indexNames.length);
          return jamadar.dropIndexesIfExist(dbName, tableConfig[randomTableId].table_name, indexNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.filter(function(result) {
            return result === true;
          }).should.have.length(indexNames.length);
          return jamadar.indexesExist(dbName, tableConfig[randomTableId].table_name, indexNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          done();
        })
        .catch(done);
    });

    it('should drop indexes and return if they do not exist', function(done) {
      jamadar.indexesExist(dbName, tableConfig[randomTableId].table_name, indexNames)
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          return jamadar.dropIndexesIfExist(dbName, tableConfig[randomTableId].table_name, indexNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          return jamadar.indexesExist(dbName, tableConfig[randomTableId].table_name, indexNames);
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
      jamadar.createIndex().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table name if not specified', function() {
      jamadar.createIndex(dbName).should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if index name if not specified', function() {
      jamadar.createIndex(dbName, tableConfig[randomTableId].table_name).should.be.rejectedWith(Error);
    });

    it('should create an index if does not exist', function(done) {
      jamadar.indexExists(dbName, tableConfig[randomTableId].table_name, indexNames[0])
        .then(function(result) {
          mustBeFalse(result);
          return jamadar.createIndex(dbName, tableConfig[randomTableId].table_name, indexNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.indexExists(dbName, tableConfig[randomTableId].table_name, indexNames[0]);
        })
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should be rejected with an error if index already exist', function() {
      jamadar.createIndex(dbName, tableConfig[randomTableId].table_name, indexNames[0]).should.be.rejectedWith(Error);
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
      jamadar.createIndexIfNotExists().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table name if not specified', function() {
      jamadar.createIndexIfNotExists(dbName).should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if index name if not specified', function() {
      jamadar.createIndexIfNotExists(dbName, tableConfig[randomTableId].table_name).should.be.rejectedWith(Error);
    });

    it('should create an index if does not exist', function(done) {
      jamadar.indexExists(dbName, tableConfig[randomTableId].table_name, indexNames[1])
        .then(function(result) {
          mustBeFalse(result);
          return jamadar.createIndexIfNotExists(dbName, tableConfig[randomTableId].table_name, indexNames[1]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.indexExists(dbName, tableConfig[randomTableId].table_name, indexNames[1]);
        })
        .then(function(result) {
          mustBeTrue(result);
          done();
        })
        .catch(done);
    });

    it('should return true if index exist', function(done) {
      jamadar.indexExists(dbName, tableConfig[randomTableId].table_name, indexNames[1])
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.createIndexIfNotExists(dbName, tableConfig[randomTableId].table_name, indexNames[1]);
        })
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.indexExists(dbName, tableConfig[randomTableId].table_name, indexNames[1]);
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
      jamadar.createIndex().should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if table name if not specified', function() {
      jamadar.createIndexesIfNotExist(dbName).should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if index data if not specified', function() {
      jamadar.createIndexesIfNotExist(dbName, tableConfig[randomTableId].table_name).should.be.rejectedWith(Error);
    });

    it('should be rejected with an error if index data is not an Array', function() {
      jamadar.createIndexesIfNotExist(dbName, tableConfig[randomTableId].table_name, 'TEST').should.be.rejectedWith(Error);
    });

    it('should create indexes and return true if they do not exist', function(done) {
      var curIndexNames = indexNames.slice(0, 2);
      var curIndexData = indexes[randomTableId].slice(0, 2);
      jamadar.indexesExist(dbName, tableConfig[randomTableId].table_name, curIndexNames)
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(0);
          return jamadar.createIndexesIfNotExist(dbName, tableConfig[randomTableId].table_name, curIndexData);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(curIndexNames.length);
          return jamadar.indexesExist(dbName, tableConfig[randomTableId].table_name, curIndexNames);
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
      jamadar.indexesExist(dbName, tableConfig[randomTableId].table_name, indexNames)
        .then(function(results) {
          results.should.be.Array;
          indexesInDb = results.length;
          return jamadar.createIndexesIfNotExist(dbName, tableConfig[randomTableId].table_name, indexes[randomTableId]);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(indexNames.length - indexesInDb);
          return jamadar.indexesExist(dbName, tableConfig[randomTableId].table_name, indexNames);
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
      jamadar.migrate(dbName, tableConfig)
        .then(function(result) {
          mustBeTrue(result);
          return jamadar.dbsExist(dbName);

        })
        .then(function(result) {
          result.should.be.Array;
          result.should.have.length(1);
          result.should.contain(dbName);
          return jamadar.tablesExist(dbName, tableNames);
        })
        .then(function(results) {
          results.should.be.Array;
          results.should.have.length(tableNames.length);
          results.forEach(function(result) {
            tableNames.should.contain(result);
          });
          return jamadar.indexesExist(dbName, tableConfig[randomTableId].table_name, indexNames);
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
      jamadar.createIndexesIfNotExist(dbName, tableConfig[randomTableId].table_name, indexes[randomTableId])
        .then(function(result) {
          done();
        })
        .catch(done);
    });

    it('should throw an error when rethinkdbdash instance is not specified', function() {
      jamadar.Model().should.be.rejectedWith(Error);
    });

    it('should throw an error when database name is not specified', function() {
      jamadar.Model(jamadar.r).should.be.rejectedWith(Error);
    });

    it('should throw an error when table name is not specified', function() {
      jamadar.Model(jamadar.r, dbName).should.be.rejectedWith(Error);
    });

    describe('get', function() {
      before(function(done) {
        resetTables(dbName, urlTable, done);
      });

      it('should throw an error when id is not specified', function() {
        expect(function (){ UrlModel.get().run(); }).to.throw(Error);
      });

      it('should find a document with given id', function(done) {
        var object = Factory.build('url');
        UrlModel.insert(object).run()
          .then(function(result) {
            mustBeTrue(result.inserted === 1);
            return UrlModel.get(object.id).run();
          })
          .then(function(result) {
            result.should.be.Object;
            result.should.be.eql(object);
            done();
          })
          .catch(done);
      });

      it('should return null for a document that does not exist', function(done) {
        UrlModel.get('asdfasdfasdfasdfasdfasdf').run()
          .then(function(result) {
            should.not.exist(result);
            expect(result).to.be.null;
            done();
          })
          .catch(done);
      });
    });

    describe('getAll', function() {
      var objects = getRandomObjects();

      before(function(done) {
        resetTables(dbName, urlTable, done);
      });

      before(function(done) {
        UrlModel.insert(objects).run()
          .then(function(results) {
            done();
          })
          .catch(done);
      });

      it('should throw an error when fields are not specified', function() {
        expect(function() { UrlModel.getAll().run(); }).to.throw(Error);
      });

      it('should throw an error when search field is null', function() {
        UrlModel.getAll(null, { index: 'url' }).run().should.be.rejectedWith(Error);
        UrlModel.getAll(null, { index: 'id' }).run().should.be.rejectedWith(Error);
        UrlModel.getAll(null, { index: 'post_id' }).run().should.be.rejectedWith(Error);
      });

      it('should be able to fetch document with primary key', function(done) {
        var object = objects[0];
        UrlModel.getAll(object.id, {index: 'id' }).run()
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

        UrlModel.getAll(objects[0].id, objects[1].id, { index: 'id' }).run()
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

        UrlModel.getAll(url, { index: 'url' }).run()
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

        UrlModel.getAll(url1, url2, { index: 'url' }).run()
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(totalUrls);
            done();
          })
          .catch(done);
      });

      it('should be able to fetch documents with compound index', function(done) {
        var object = objects[2];
        UrlModel.getAll([object.url, object.post_id], { index: 'url_and_post_id' }).run()
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(1);
            results[0].should.be.eql(object);
            done();
          })
          .catch(done);
      });

      it('should be able to fetch documents with multiple values of a compound index', function(done) {
        UrlModel.getAll([objects[1].url, objects[1].post_id], [objects[3].url, objects[3].post_id], { index: 'url_and_post_id' }).run()
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
        UrlModel.getAll(['http://saini.co.in/', null], { index: 'url_and_post_id' }).run().should.be.rejectedWith(Error);
        UrlModel.getAll([null, 1], { index: 'url_and_post_id' }).run().should.be.rejectedWith(Error);
      });
    });

    describe('filter', function() {
      var objects = getRandomObjects();

      before(function(done) {
        resetTables(dbName, urlTable, done);
      });

      before(function(done) {
        UrlModel.insert(objects).run()
          .then(function(results) {
            done();
          })
          .catch(done);
      });

      it('should throw an error when predicate is not specified', function() {
        expect(function() { UrlModel.filter().run(); }).to.throw(Error);
      });

      it('should fetch documents when a predicate is specified as ReQL', function(done) {
        var totalUrls = objects.filter(function(object) {
          return object.post_id > 100;
        }).length;
        UrlModel.filter(jamadar.r.row('post_id').gt(100)).run()
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
        UrlModel.filter({ post_id: objects[1].post_id }).run()
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
        UrlModel.filter(function(url) { return url('post_id').eq(objects[2].post_id); }).run()
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
        UrlModel.filter(jamadar.r.row('post_id').gt(100).and(jamadar.r.row('post_id').lt(200))).run()
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
        UrlModel.filter(jamadar.r.row('post_id').lt(100)).run()
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(totalUrls);
            done();
          })
          .catch(done);
      });

      //It's a valid query but can't fetch nothing
      it('should fetch documents when a predicate is specified as ReQL', function(done) {
        UrlModel.filter(jamadar.r.row('post_id').eq(null)).run()
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(0);
            done();
          })
          .catch(done);
      });

      it('should fetch documents when a predicate is specified as object', function(done) {
        UrlModel.filter({ post_id: null }).run()
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(0);
            done();
          })
          .catch(done);
      });
    });

    describe('insert', function() {
      var objects = getRandomObjects();

      before(function(done) {
        resetTables(dbName, urlTable, done);
      });

      it('should throw an error if objects are not specified', function() {
        expect(function(){ UrlModel.insert().run(); }).to.throw(Error);
      });

      it('should not insert an object with id set as null', function(done) {
        var object = objects[0];
        object.id = null;
        UrlModel.insert(object).run()
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(0);
            done();
          })
          .catch(done);
      });

      it('should insert when a single object is passed', function(done) {
        UrlModel.insert(objects[1]).run()
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(1);
            return UrlModel.get(objects[1].id).run();
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
        UrlModel.insert(newObjects).run()
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(newObjects.length);
            return UrlModel.getAll(objects[2].id, objects[3].id, objects[4].id, {index: 'id' }).run();
          })
          .then(function(results) {
            results.should.be.Array;
            results.should.have.length(newObjects.length);
            done();
          })
          .catch(done);
      });

      it('should not insert an object whose id already exists in table', function(done) {
        UrlModel.insert(objects[0]).run()
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(0);
            done();
          })
          .catch(done);
      });

      it('should not insert an arbitrary number of object passed whose ids already exist in table', function(done) {
        var newObjects = [objects[2], objects[3], objects[4]];
        UrlModel.insert(newObjects).run()
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(0);
            done();
          })
          .catch(done);
      });

      it('should insert documents whose ids are not already present in the table', function(done) {
        var newObjects = [objects[2], objects[3], objects[5], objects[6]];
        UrlModel.insert(newObjects).run()
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(2);
            return UrlModel.getAll(objects[2].id, objects[3].id, objects[5].id, objects[6].id, { index: 'id' }).run();
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
        UrlModel.insert(newObjects).run()
          .then(function(result) {
            result.inserted.should.be.Number;
            result.inserted.should.be.equal(1);
            return UrlModel.getAll(objects[5].id, objects[6].id, objects[8].id, { index: 'id' }).run();
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
        UrlModel.sync().run()
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
