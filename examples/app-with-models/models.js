'use strict';

var path      = require('path');
var Inflector = require('inflected');

var Jamadar   = require(path.join(__dirname, '../../'));
var rethinkdb = require(path.join(__dirname, './rethinkdb'))(process.NODE_ENV);

var jamadar = new Jamadar(rethinkdb.hosts);

function configuration() {
  var config = {
    dbInfo: {
      hosts       :  rethinkdb.hosts,
      tableConfig :  rethinkdb.tableConfig
    },
    jamadar:  jamadar,
    r:        jamadar.r,
  };

  Object.keys(rethinkdb.tableConfig).forEach(function(tableId) {
    const table = rethinkdb.tableConfig[tableId];
    const className = table.class_name || Inflector.classify(table.table_name);
    config[className] = jamadar.Model(rethinkdb.hosts.db, table.table_name).model;
  });
  return config;
}

module.exports = configuration();
