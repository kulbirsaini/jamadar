'use strict';

var chai = require('chai');
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
          setTimeout(done, 10);
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
          setTimeout(done, 10);
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
          setTimeout(done, 10);
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
    })
  });

  describe('dropDbIfExists', function() {
    it('should not throw an error if database is not specified', function() {
      db.dropDbIfExists().should.not.be.rejectedWith(Error);
    });

    it('should drop a database if it exists', function(done) {
      db.dropDbIfExists(config.rethinkdb.db)
        .then(function(result) {
          result.should.be.true;
          setTimeout(done, 10);
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
  })

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

  describe('resetDb', function() {
    it('should be implemented');
  })

  describe('resetTable', function() {
    it('should be implemented');
  });

  describe('resetTables', function() {
    it('should be implemented');
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
          setTimeout(done, 10);
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
          setTimeout(done, 10);
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
    })
  });

  describe('createTable', function() {
    it('should throw an error when database name is not specified', function() {
      expect(db.createTable.bind(db)).to.throw(Error);
    })

    it('should throw an error when table name is not specified', function() {
      expect(db.createTable.bind(db, config.rethinkdb.db)).to.throw(Error);
    })

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
    })

    it('should throw an error when table name is not specified', function() {
      expect(db.dropTable.bind(db, config.rethinkdb.db)).to.throw(Error);
    })

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
    })

    it('should throw an error when table name is not specified', function() {
      expect(db.dropTableIfExists.bind(db, config.rethinkdb.db)).to.not.throw(Error);
    })

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
    })

    it('should not throw an error when table name is not specified', function() {
      expect(db.dropTablesIfExist.bind(db, config.rethinkdb.db)).to.not.throw(Error);
    })

    it('should drop tables if exist', function(done) {
      db.dropTablesIfExist(config.rethinkdb.db, tableNames)
        .then(function(result) {
          result.should.be.Array;
          result.should.have.length(tableNames.length);
          done();
        })
        .catch(done);
    });

    it('should drop tables if not exist', function(done) {
      db.dropTablesIfExist(config.rethinkdb.db, ['a', 'b', 'c'])
        .then(function(result) {
          result.should.be.Array;
          result.should.have.length(3);
          done();
        })
        .catch(done);
    });
  });

  describe('createTableIfNotExists', function() {
    it('should throw an error when database name is not specified', function() {
      expect(db.createTableIfNotExists.bind(db)).to.throw(Error);
    })

    it('should throw an error when table name is not specified', function() {
      expect(db.createTableIfNotExists.bind(db, config.rethinkdb.db)).to.throw(Error);
    })

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
    })

    it('should throw an error when table name is not specified', function() {
      expect(db.createTablesIfNotExist.bind(db, config.rethinkdb.db)).to.throw(Error);
    })

    it('should create tables if not exist', function(done) {
      db.createTablesIfNotExist(config.rethinkdb.db, tableNames)
        .then(function(result) {
          result.should.be.Array;
          result.should.have.length(tableNames.length);
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
          result.should.have.length(tableNames.length);
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
    it('should be implemented');
  });

  describe('indexExists', function() {
    it('should be implemented');
  });

  describe('createIndex', function() {
    it('should be implemented');
  });

  describe('dropIndex', function() {
    it('should be implemented');
  });

  describe('createIndexIfNotExists', function() {
    it('should be implemented');
  });

  describe('createIndexesIfNotExist', function() {
    it('should be implemented');
  });

  describe('dropIndexIfExists', function() {
    it('should be implemented');
  });

  describe('dropIndexesIfExist', function() {
    it('should be implemented');
  });

  describe('migrate', function() {
    it('should be implemented');
  });

  describe('model', function() {
    describe('table', function() {
      it('should be implemented');
    });

    describe('get', function() {
      it('should be implemented');
    });

    describe('getAll', function() {
      it('should be implemented');
    });

    describe('find', function() {
      it('should be implemented');
    });

    describe('findAll', function() {
      it('should be implemented');
    });

    describe('filter', function() {
      it('should be implemented');
    });

    describe('create', function() {
      it('should be implemented');
    });

    describe('update', function() {
      it('should be implemented');
    });

    describe('replace', function() {
      it('should be implemented');
    });

    describe('destroy', function() {
      it('should be implemented');
    });

    describe('destroyAll', function() {
      it('should be implemented');
    });

    describe('sync', function() {
      it('should be implemented');
    });
  });
});
