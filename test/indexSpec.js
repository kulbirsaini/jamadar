'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var path = require('path');

var config = require(path.join(__dirname, 'config'));
var dbLayer = require(path.join(__dirname, '../index'));

var db = dbLayer(config.rethinkdb);
var should = chai.should();

chai.use(chaiAsPromised);

function dropDb(dbName, done) {
  db.dropDbIfExists(config.rethinkdb.db)
  .then(function(result) {
    done();
  })
  .catch(function(error) {
    done(error);
  });
}

describe('Database Layer', function() {
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
        .catch(function(error) {
          done(error);
        });
    });
  });

  describe('dbExists', function() {
    it('should return false if a database does not exist', function(done) {
      db.dbExists(config.rethinkdb.db)
        .then(function(result) {
          result.should.be.false;
          done();
        })
        .catch(function(error) {
          done(error);
        });
    });
  });

  describe('createDb', function() {
    it('should create a database', function(done) {
      db.createDb(config.rethinkdb.db)
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(function(error) {
          done(error);
        });
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
        .catch(function(error) {
          done(error);
        });
    });
  });

  describe('dbExists', function() {
    it('should return true if a database exists', function(done) {
      db.dbExists(config.rethinkdb.db)
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(function(error) {
          done(error);
        });
    });
  });

  describe('dropDb', function() {
    it('should drop a database', function(done) {
      db.dropDb(config.rethinkdb.db)
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(function(error) {
          done(error);
        });
    });

    it('should throw an error when a database does not exist', function() {
      db.dropDb(config.rethinkdb.db).should.be.rejectedWith(Error);
    });
  });

  describe('createDbIfNotExists', function() {
    it('should create a database if it does not exist', function(done) {
      db.createDbIfNotExists(config.rethinkdb.db)
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(function(error) {
          done(error);
        });
    });

    it('should create a database even if it does exist', function(done) {
      db.createDbIfNotExists(config.rethinkdb.db)
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(function(error) {
          done(error);
        });
    });

    it('should not throw an error', function() {
      db.createDbIfNotExists(config.rethinkdb.db).should.not.be.rejectedWith(Error);
    })
  });

  describe('dropDbIfExists', function() {
    it('should drop a database if it exists', function(done) {
      db.dropDbIfExists(config.rethinkdb.db)
        .then(function(result) {
          result.should.be.true;
          done();
        })
        .catch(function(error) {
          done(error);
        });
    });

    it('should not throw an Error if database does not exist', function() {
      db.dropDbIfExists(config.rethinkdb.db).should.not.be.rejectedWith(Error);
    });
  });

  describe('createDbsIfNotExist', function() {
    var dbs = [config.rethinkdb.db, config.rethinkdb.db + '_1' + config.rethinkdb.db + '_2'];
    it('should create databases', function(done) {
      db.createDbsIfNotExist(dbs)
        .then(function(result) {
          result.should.be.Array;
          done();
        })
    });

    it('should not throw an Error if one or more of databases already exist', function() {
      db.createDbsIfNotExist(dbs).should.not.be.rejectedWith(Error);
    });
  })

  describe('dropDbsIfExist', function() {
    var dbs = [config.rethinkdb.db, config.rethinkdb.db + '_1' + config.rethinkdb.db + '_2'];
    it('should create databases', function(done) {
      db.dropDbsIfExist(dbs)
        .then(function(result) {
          result.should.be.Array;
          done();
        })
    });

    it('should not throw an Error if one or more of databases already exist', function() {
      db.dropDbsIfExist(dbs).should.not.be.rejectedWith(Error);
    });
  });

  describe('resetDb', function() {
    it('should be implemented');
  })

  describe('getTableList', function() {
    it('should be implemented');
  });

  describe('tableExists', function() {
    it('should be implemented');
  });

  describe('createTable', function() {
    it('should be implemented');
  });

  describe('dropTable', function() {
    it('should be implemented');
  });

  describe('createTableIfNotExists', function() {
    it('should be implemented');
  });

  describe('createTablesIfNotExist', function() {
    it('should be implemented');
  });

  describe('dropTableIfExists', function() {
    it('should be implemented');
  });

  describe('dropTablesIfExist', function() {
    it('should be implemented');
  });

  describe('resetTable', function() {
    it('should be implemented');
  });

  describe('resetTables', function() {
    it('should be implemented');
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
