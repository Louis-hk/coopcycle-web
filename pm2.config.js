var argv = require('minimist')(process.argv.slice(2));
var _ = require('underscore');

var watchOptions = {
  usePolling: true,
  ignorePermissionErrors: true,
  followSymlinks: false,
  interval: 400
}

var env = argv.env || 'development';

var apps = [{
  name: "coopcycle-dispatch",
  script: "./js/api/dispatch/index.js",
  watch: ["./js/api/dispatch/index.js", "./js/api/models/*.js", "./js/api/*.js"],
}, {
  name: "coopcycle-tracking",
  script: "./js/api/tracking/index.js",
  watch: ["./js/api/tracking/index.js", "./js/api/tracking/index.html"],
}, {
  name: "coopcycle-order-tracking",
  script: "./js/api/order/tracking.js",
  watch: ["./js/api/order/tracking.js"],
}];

apps = _.map(apps, function(app) {
  if (env === 'production') {
    delete app.watch;
    app = _.extend(app, {
      cwd: __dirname,
    });
  } else {
    app = _.extend(app, {
      watch_options: watchOptions
    });
  }

  return _.extend(app, {
    env: {
      NODE_ENV: "development",
    },
    env_production : {
      NODE_ENV: "production"
    },
    env_test : {
      NODE_ENV: "test"
    }
  })
});

module.exports = {
  apps: apps
}