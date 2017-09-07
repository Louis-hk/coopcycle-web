var winston = require('winston');

var REDIS;
var TIMEOUT;

var orderDispatchedCount = 0;

winston.level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

function orderDispatchedCountLogger() {
  winston.info(orderDispatchedCount + ' orders dispatched in the last 5 minutes');
}

function OrderDispatcher(redis, orderRegistry) {
  REDIS = redis;
  this.orderRegistry = orderRegistry;
  this.handler = null;
}

function next(orderRegistry, handler) {
  TIMEOUT = setTimeout(circularListHandler.bind(null, orderRegistry, handler), 1000);
}

function circularListHandler(orderRegistry, handler) {
  REDIS.rpoplpush('orders:waiting', 'orders:waiting', function(err, orderID) {
    if (err) throw err;
    if (!orderID) {
      return next(orderRegistry, handler);
    }

    winston.debug('Found order to dispatch ' + orderID);

    orderRegistry.findById(orderID)
      .then(function(order) {
        handler.call(null, order, next.bind(null, orderRegistry, handler));
      })
      .catch(function(err) {
        winston.error(err);
        next(orderRegistry, handler);
      });
  });
}

OrderDispatcher.prototype.setHandler = function(handler) {
  this.handler = handler;
};

OrderDispatcher.prototype.start = function() {
  this.stop();
  circularListHandler(this.orderRegistry, this.handler);
  setInterval(orderDispatchedCountLogger, 5 * 60000);
};

OrderDispatcher.prototype.stop = function() {
  clearTimeout(TIMEOUT);
};

module.exports = OrderDispatcher;
