'use strict';

var express = require('express');
var path = require('path');

var models = require(path.join(__dirname, './models'));

var app = express();

models.jamadar.migrate(models.dbInfo.hosts.db, models.dbInfo.tableConfig)
  .then(function(result) {
    console.log('Database migration complete');

    // Run your app once database migration is complete
    app.listen(9110, function(error) {
      if (error) {
        return console.log('Failed to start express app', error);
      }
      console.log('Listening on http://localhost:9110');
    });
  })
  .catch(function(error) {
    console.log('Error in migrating database:', error.message);
    console.log(error.stack);
  });
