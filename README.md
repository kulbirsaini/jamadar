# Jamadar #

Simplified database, table and index management functions for rethinkdb.

### How To Install? ###

```bash
npm install --save jamadar
```

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
    discovery: false,
    db: 'lolstack_dev'
  },
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
  }
};
```

Sample application using `Jamadar` with migration.

```javascript
'use strict';

var path = require('path');

var config = require(path.join(__dirname, 'config'));
var db = require('jamadar')(config.rethinkdb);

db.migrate(config.rethinkdb.db, config.tables, config.indexes)
  .then(function(result) {
    debug('Database setup complete.');
    // Database is migrated
    // Continue with regular tasks here.
    // Start express server may be.
  })
  .catch(function(error) {
    debug('Error in migrating database', error.message);
    debug(error.stack);
  });
```

The `config.rethinkdb` options Object must be same as options you'd provide to [rethinkdbdash](https://github.com/neumino/rethinkdbdash).


## License

(The MIT License)

Copyright (c) 2015 Kulbir Saini

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
