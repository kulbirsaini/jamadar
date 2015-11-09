'use strict';

var config = {
  hosts: { // Host config is same as rethinkdbdash config https://github.com/neumino/rethinkdbdash#importing-the-driver
    servers: [
      { host: 'localhost', port: 28015 }
    ],
    buffer: 10, //Minimum connections in pool
    max: 50,  //Maximum connections in pool
    discovery: false,
    db: 'jamadar_dev'
  },
  tables: { // table names. Keys and names can be different
    users: 'users',
    posts: 'blog_posts',
    pictures: 'user_pictures',
    jobs: 'jobs',
    twitter_users: 'twitter_users',
    twitter_tweets: 'tweets'
  },
  indexes: { // index definitions for tables. Keys should be same as tables' keys
    users: [
      // if index name is same as field name, just mention name
      { name: 'username' },
      { name: 'email' }
    ],
    posts: [
      // if index name is different, provide fn
      { name: 'index_on_user_id', fn: function(row) { return row('user_id'); } },
      { name: 'published' },
      { name: 'emailed' },
      // For indexes on multiple fields, provide fn. fn get `row` as argument and should return a compound index definition.
      { name: 'published_created_at', fn: function(row) { return [row('published'), row('created_at')]; } }
    ],
    pictures: [
      { name: 'user_id' }
    ],
    jobs: [
      { name: 'type' }
    ],
    twitter_users: [
      { name: 'screen_name' },
      { name: 'created_at' },
      { name: 'protected_synced_at', fn: function(row) { return [row('protected'), row('synced_at')]; } }
    ],
    twitter_tweets: [
      { name: 'user_id' },
      { name: 'created_at' },
      { name: 'synced_at' }
    ]
  }
};

function configuration(env) {
  env = env || process.NODE_ENV;
  switch(env) {
    case 'test':
      return Object.assign({}, config, { hosts: { db: 'jamadar_test' } });
    case 'production':
      return Object.assign({}, config, { hosts: { db: 'jamadar' } });
    default:
      return Object.assign({}, config, { hosts: { db: 'jamadar_dev' } });
  }
}

module.exports = configuration;
