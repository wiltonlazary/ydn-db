
goog.require('goog.debug.Console');
goog.require('ydn.db.algo.NestedLoop');
goog.require('ydn.db.algo.ZigzagMerge');
goog.require('ydn.db.algo.SortedMerge');
goog.require('goog.testing.jsunit');

goog.require('ydn.db.Storage');



var reachedFinalContinuation;

var debug_console = new goog.debug.Console();
debug_console.setCapturing(true);
goog.debug.LogManager.getRoot().setLevel(goog.debug.Logger.Level.WARNING);
//goog.debug.Logger.getLogger('ydn.gdata.MockServer').setLevel(goog.debug.Logger.Level.FINEST);
goog.debug.Logger.getLogger('ydn.db.con.IndexedDb').setLevel(goog.debug.Logger.Level.FINEST);
goog.debug.Logger.getLogger('ydn.db.algo').setLevel(goog.debug.Logger.Level.FINEST);
goog.debug.Logger.getLogger('ydn.db.index.req').setLevel(goog.debug.Logger.Level.FINEST);


var db_name = 'test_algo_scan_1';

var setUp = function() {

  ydn.db.core.req.IndexedDb.DEBUG = true;
  ydn.db.index.req.IDBCursor.DEBUG = true;


  reachedFinalContinuation = false;
};

var tearDown = function() {
  assertTrue('The final continuation was not reached', reachedFinalContinuation);
};


/**
 * Query for
 * SELECT id WHERE first = 'B' AND last = 'M'
 */
var test_scan_reference_value = function() {

  var store_name = 'test_scan_reference_value';
  var objs = [
    {id: 0, first: 'A', last: 'M', age: 20},
    {id: 1, first: 'B', last: 'M', age: 24},
    {id: 2, first: 'B', last: 'L', age: 16},
    {id: 3, first: 'D', last: 'P', age: 49},
    {id: 4, first: 'B', last: 'M', age: 21}
  ];

  var schema = {
    stores: [{
      name: store_name,
      keyPath: 'id',
      indexes: [{
        name: 'fa',
        keyPath: 'first'
      }, {
        name: 'la',
        keyPath: 'last'
      }]
    }]
  };
  var db = new ydn.db.Storage(db_name, schema, options);

  db.clear(store_name);
  db.put(store_name, objs).addCallback(function (value) {
    console.log(db + 'store: ' + store_name + ' ready.');
  });


  var done;
  var result_keys = [];
  // sorted by primary key
  var results = [1, 4];

  waitForCondition(
      // Condition
      function () {
        return done;
      },
      // Continuation
      function () {
        assertArrayEquals('result', results, result_keys);
        reachedFinalContinuation = true;
        db.close();
      },
      100, // interval
      1000); // maxTimeout

  var q1 = new ydn.db.KeyIterator(store_name, 'fa', ydn.db.KeyRange.only('B'));
  var q2 = new ydn.db.KeyIterator(store_name, 'la', ydn.db.KeyRange.only('M'));

  var solver = function(keys, values) {
    console.log(JSON.stringify(keys) + ':' + JSON.stringify(values));
    if (keys.some(function(x) {return !goog.isDefAndNotNull(x)})) {
      return []; // done;
    }
    var a = values[0];
    var b = values[1];
    var cmp = ydn.db.cmp(a, b);
    if (cmp == 0) {
      console.log('get match at ' + a + ' : ' + values[0]);
      result_keys.push(values[0]);
      return [true, true];
    } else if (cmp == 1) {
      return {next_primary_keys: [undefined, a]};
    } else {
      return {next_primary_keys: [b, undefined]};
    }
  };

  var req = db.scan([q1, q2], solver);

  req.addCallback(function (result) {
    //console.log(result);
    done = true;
  });
  req.addErrback(function (e) {
    console.log(e);
    done = true;
  });
};



/**
 * Query for
 * SELECT age WHERE first = 'B' AND last = 'M' ORDER BY age
 */
var test_scan_effective_key = function() {

  var store_name = 'test_scan_effective_key';
  var objs = [
    {id: 0, first: 'A', last: 'M', age: 20},
    {id: 1, first: 'B', last: 'M', age: 24},
    {id: 2, first: 'B', last: 'L', age: 16},
    {id: 3, first: 'D', last: 'P', age: 49},
    {id: 4, first: 'B', last: 'M', age: 21}
  ];

  var schema = {
    stores: [{
      name: store_name,
      keyPath: 'id',
      indexes: [{
        name: 'fa',
        keyPath: ['first', 'age']
      }, {
        name: 'la',
        keyPath: ['last', 'age']
      }]
    }]
  };
  var db = new ydn.db.Storage(db_name, schema, options);

  db.put(store_name, objs).addCallback(function (value) {
    console.log(db + 'store: ' + store_name + ' ready.');
  });


  var done;
  var result_keys = [];
  // sorted by primary key
  var results = [4, 1];

  waitForCondition(
    // Condition
    function () {
      return done;
    },
    // Continuation
    function () {
      assertArrayEquals('result', results, result_keys);
      reachedFinalContinuation = true;
      db.close();
    },
    100, // interval
    1000); // maxTimeout

  var q1 = new ydn.db.KeyIterator(store_name, 'fa', ydn.db.KeyRange.starts(['B']));
  var q2 = new ydn.db.KeyIterator(store_name, 'la', ydn.db.KeyRange.starts(['M']));

  var solver = function(keys, values) {
    //console.log(JSON.stringify(keys));
    if (keys.some(function(x) {return !goog.isDefAndNotNull(x)})) {
      return []; // done;
    }
    var a = keys[0][1];
    var b = keys[1][1];
    var cmp = ydn.db.cmp(a, b);
    if (cmp == 0) {
      //console.log('get match at ' + a + ' : ' + values[0]);
      result_keys.push(values[0]);
      return [true, true];
    } else if (cmp == 1) {
      var next_pos = [keys[1][0], a];
      return [undefined, next_pos];
    } else {
      var next_pos = [keys[0][0], b];
      return [next_pos, undefined];
    }
  };

  var req = db.scan([q1, q2], solver);

  req.addCallback(function (result) {
    //console.log(result);
    done = true;
  });
  req.addErrback(function (e) {
    console.log(e);
    done = true;
  });
};



var testCase = new goog.testing.ContinuationTestCase();
testCase.autoDiscoverTests();
G_testRunner.initialize(testCase);



