# Database Layer #

This module provides basic functionality required to setup a database so that we don't have to copy the same files to all of our applications.

### How To Install? ###

Directly include in your `package.json`.

```javascript
{
  "name": "schedule-consumer",
  "private": true,
  "version": "0.0.1",
  "description": "Consumes scheduled tweets and posts them",
  "dependencies": {
    "database-layer": "git@bitbucket.org:lolstack/database-layer.git"
  }
}
```

Then fire `npm install`.

### How To Use? ###

Sample configuration file `config.js`.

```javascript
'use strict';

module.exports = {
  rethinkdb: {
    servers: [
      { host: 'localhost', port: 28015 }
    ],
    buffer: 20, //Minimum connections in pool
    max: 100, //Maximum connections in pool
    discovery: true,
    db: 'lolstack_dev'
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
      user: [
        { name: 'username' },
        { name: 'email' }
      ],
      url: [
        { name: 'url' },
        { name: 'post_id' },
        { name: 'created_at' },
        { name: 'updated_at' },
        { name: 'url_and_post_id', columns: [ 'url', 'post_id' ] }
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
```

Sample application using `database-layer` with migration.

```javascript
'use strict';

var path = require('path');

var config = require(path.join(__dirname, 'config'));
var db = require('database-layer')(config.rethinkdb);

db.migrate(config.rethinkdb.db, config.app.tables, config.app.indexes)
  .then(function(result) {
    debug('Database setup complete.');
  })
  .catch(function(error) {
    debug('Error in setting up application.');
    debug(error.stack);
  });
```

The options Object must be same as options you'd provide to [rethinkdbdash](https://github.com/neumino/rethinkdbdash).


### Exposed Functions ###

See the module [exports](https://bitbucket.org/lolstack/database-layer/src/7a21c7bbcd3af3b073d5609780b8eb394d93b54c/index.js?at=master#index.js-590).
