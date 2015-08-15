'use strict';

var config = {
  rethinkdb: {
    servers: [
      { host: 'localhost', port: 28015 }
    ],
    buffer: 20, //Minimum connections in pool
    max: 100, //Maximum connections in pool
    discovery: true,
    db: 'database_layer_test'
  },
  app: {
    tables: {
      url: 'urls',
      user: 'users',
      network: 'networks',
      schedule: 'schedules',
      post: 'posts',
      picture: 'pictures'
    },
    indexes: {
      url: [
        { name: 'url' },
        { name: 'post_id' },
        { name: 'created_at' },
        { name: 'updated_at' },
        { name: 'url_and_post_id', columns: [ 'url', 'post_id' ] }
      ],
      user: [
        { name: 'username' },
        { name: 'email' }
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
    },
  }
};

module.exports = config;
