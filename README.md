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

Require in your application.

```javascript
var dbLayer = require('database-layer');
var db = dbLayer({
      servers: [
        { host: 'localhost', port: 28015 }
      ],
      buffer: 20, //Minimum connections in pool
      max: 100, //Maximum connections in pool
      discovery: true,
      db: 'lolstack_dev'
    });
```

The options Object must be same as options you'd provide to [rethinkdbdash](https://github.com/neumino/rethinkdbdash).


### Exposed Functions ###

See the module [exports](https://bitbucket.org/lolstack/database-layer/src/7a21c7bbcd3af3b073d5609780b8eb394d93b54c/index.js?at=master#index.js-590).