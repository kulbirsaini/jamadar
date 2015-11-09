'use strict';

var path    = require('path');

var Jamadar = require(path.join(__dirname, '../../'));
var rethinkdb = require(path.join(__dirname, './rethinkdb'))(process.NODE_ENV);

var jamadar = new Jamadar(rethinkdb.hosts);

module.exports = {
  dbInfo: {
    hosts:    rethinkdb.hosts,
    tables:   rethinkdb.tables,
    indexes:  rethinkdb.indexes
  },
  jamadar:       jamadar,
  r:             jamadar.r,
  Job:           jamadar.Model(rethinkdb.hosts.db, rethinkdb.tables.jobs).model,
  Picture:       jamadar.Model(rethinkdb.hosts.db, rethinkdb.tables.pictures).model,
  Post:          jamadar.Model(rethinkdb.hosts.db, rethinkdb.tables.posts).model,
  User:          jamadar.Model(rethinkdb.hosts.db, rethinkdb.tables.users).model,
  TwitterTweet:  jamadar.Model(rethinkdb.hosts.db, rethinkdb.tables.twitter_tweets).model,
  TwitterUser:   jamadar.Model(rethinkdb.hosts.db, rethinkdb.tables.twitter_users).model
};
