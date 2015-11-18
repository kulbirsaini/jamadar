'use strict';

var tableConfig = {
  url: {
    table_name: 'urls',
    indexes: [
      { name: 'url' },
      { name: 'post_id' },
      { name: 'created_at' },
      { name: 'updated_at' },
      { name: 'url_and_post_id', fn: function(row) { return [row('url'), row('post_id')]; } }
    ]
  },
  users: {
    table_name: 'users',
    indexes: [
      { name: 'username' },
      { name: 'email' }
    ]
  }
};

var config = {
  rethinkdb: {
    servers: [
      { host: 'localhost', port: 28015 }
    ],
    buffer: 20, //Minimum connections in pool
    max: 100, //Maximum connections in pool
    discovery: false, //Setting to false. It seems to be creating a lot of issues.
    db: 'jamadar_test_afj928dfas'
  },
  tableConfig: tableConfig
};

module.exports = config;
