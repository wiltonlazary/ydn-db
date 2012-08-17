// Copyright 2012 YDN Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Query.
 */


goog.provide('ydn.db.Query');



/**
 * @param {!ydn.db.Query.Config} select configuration in json format
 * @constructor
 */
ydn.db.Query = function(select) {
  /**
   * Store name.
   * @final
   * @type {string}
   */
  this.store = select['store'];
  /**
   * Right value for query operation.
   * @final
   * @type {!ydn.db.Query.IDBKeyRange}
   */
  this.keyRange = ydn.db.Query.parseKeyRange(select['keyRange']);
  /**
   * Indexed field.
   * @final
   * @type {string}
   */
  this.index = select['index'];
  /**
   * Maximum number of result.
   * @final
   * @type {(number|undefined)}
   */
  this.limit = select['limit'];
  /**
   * Result to be ordered by.
   * @final
   * @type {(string|undefined)}
   */
  this.order = select['order'];
  /**
   * Result to be start by.
   * @final
   * @type {(number|undefined)}
   */
  this.offset = select['offset'];
  /**
   * @final
   * @type {function(!Object): boolean}
   */
  this.filter = select['filter'];
  /**
   * @final
   * @type {function(*, *, number, Array): *}
   * function(previousValue, currentValue, index, array)
   */
  this.reduce = select['reduce'];
};


/**
 * @inheritDoc
 */
ydn.db.Query.prototype.toJSON = function () {
  return {
    'store':this.store,
    'index':this.index,
    'keyRange': ydn.db.Query.FakeKeyRange.toJSON(this.keyRange),
    'order':this.order,
    'offset':this.offset,
    'limit':this.limit
  }
};


/**
 * JSON definition for IDBKeyRange.
 * @typedef {{
 *  lower: (*|undefined),
 *  lowerOpen: (boolean|undefined),
 *  upper: (*|undefined),
 *  upperOpen: (boolean|undefined),
 *  op: (ydn.db.Query.Op|undefined)
 * }}
 */
ydn.db.Query.KeyRange;


/**
 * This is similar to SQL SELECT statement.
 * @typedef {{
 *  store: string,
 *  index: string,
 *  keyRange: (!ydn.db.Query.KeyRange),
 *  limit: (number|undefined),
 *  order: (string|undefined),
 *  offset: (number|undefined),
 *  filter: function(!Object): boolean
 *  }}
 */
ydn.db.Query.Config;


/**
 * For those browser that not implemented IDBKeyRange.
 * @constructor
 */
ydn.db.Query.FakeKeyRange = function() {

};


ydn.db.Query.FakeKeyRange.prototype.only = function(value) {
  this.lower = value;
  this.upper = value;
};


ydn.db.Query.FakeKeyRange.prototype.bound = function(lower, upper,
  lowerOpen, upperOpen) {
  this.lower = lower;
  this.upper = upper;
  this.lowerOpen = lowerOpen;
  this.upperOpen = upperOpen;
};


ydn.db.Query.FakeKeyRange.prototype.upperBound = function(upper, upperOpen) {
  this.upper = upper;
  this.upperOpen = upperOpen;
};

ydn.db.Query.FakeKeyRange.prototype.lowerBound = function(upper, upperOpen) {
  this.lower = upper;
  this.lowerOpen = upperOpen;
};


/**
 *
 * @param {ydn.db.Query.IDBKeyRange} keyRange IDBKeyRange.
 * @return {!Object} IDBKeyRange in JSON format.
 */
ydn.db.Query.FakeKeyRange.toJSON = function(keyRange) {
  return {
    'lower': keyRange.lower,
    'upper': keyRange.upper,
    'lowerOpen': keyRange.lowerOpen,
    'upperOpen': keyRange.upperOpen
  }
};


/**
 *
 * @type {function(new:IDBKeyRange)} The IDBKeyRange interface of the IndexedDB
 * API represents a continuous interval over some data type that is used for
 * keys.
 */
ydn.db.Query.IDBKeyRange = goog.global.IDBKeyRange ||
  goog.global.webkitIDBKeyRange || ydn.db.Query.FakeKeyRange;


/**
 * @param {!ydn.db.Query.KeyRange} keyRange keyRange.
 * @return {!ydn.db.Query.IDBKeyRange} equivalent IDBKeyRange.
 */
ydn.db.Query.parseKeyRange = function (keyRange) {
  if (goog.isDef(keyRange.upper) && goog.isDef(keyRange.lower)) {
    if (keyRange.lower === keyRange.upper) {
      return ydn.db.Query.IDBKeyRange.only(keyRange.lower);
    } else {
    return ydn.db.Query.IDBKeyRange.bound(
      keyRange.lower, keyRange.upper,
      keyRange.lowerOpen, keyRange.upperOpen);
    }
  } else if (goog.isDef(keyRange.upper)) {
    return ydn.db.Query.IDBKeyRange.upperBound(keyRange.upper,
      keyRange.upperOpen);
  } else if (goog.isDef(keyRange.lower)) {
    return ydn.db.Query.IDBKeyRange.lowerBound(keyRange.lower,
      keyRange.lowerOpen);
  } else {
    throw Error('Invalid keyRange');
  }
};


/**
 * @private
 * @param keyRange
 */
ydn.db.Query.isLikeOperation_ = function (keyRange) {
  if (goog.isDef(keyRange.lower) && goog.isDef(keyRange.upper) &&
    !keyRange.lowerOpen && keyRange.upperOpen) {
    if (keyRange.lower.length == keyRange.upper.length) {
      var n = keyRange.lower.length - 1;
      return keyRange.lower.substr(0, n) ==
        keyRange.upper.substr(0, n) &&
        keyRange.lower.charCodeAt(n) + 1 == keyRange.upper.charCodeAt(n);
    } else {
      return false;
    }
  } else {
    return false;
  }
};


/**
 * @return {{where_clause: string, params: Array}} return equivalent of keyRange
 * to SQL WHERE clause and its parameters.
 */
ydn.db.Query.prototype.toWhereClause = function() {

  var where_clause = '';
  var params = [];
  var column = goog.string.quote(this.index);

  if (ydn.db.Query.isLikeOperation_(this.keyRange)) {
    where_clause = column + ' LIKE ?';
    params.push(this.keyRange.lower + '%');
  } else {
    if (goog.isDef(this.keyRange.lower)) {
      var lowerOp = this.keyRange.lowerOpen ? ' > ' : ' >= ';
      where_clause += ' ' + column + lowerOp + '?';
      params.push(this.keyRange.lower);
    }
    if (goog.isDef(this.keyRange.upper)) {
      var upperOp = this.keyRange.upperOpen ? ' < ' : ' <= ';
      var and = where_clause.length > 0 ? ' AND ' : ' ';
      where_clause += and + column + upperOp + '?';
      params.push(this.keyRange.upper);
    }
  }

  return {where_clause: where_clause, params: params};
};


/**
 * Query operator
 * @enum {string}
 */
ydn.db.Query.Op = {
  START_WITH: 'st'
};


/**
 * Helper method for creating useful KeyRange.
 * @param {ydn.db.Query.Op} op operator.
 * @param {string} value value.
 * @return {!ydn.db.Query.KeyRange} result.
 */
ydn.db.Query.createKeyRange = function (op, value) {
  if (op == ydn.db.Query.Op.START_WITH) {
    var value_upper = value.substring(0, value.length - 1) + String.fromCharCode(
      value.charCodeAt(value.length - 1) + 1);
    return {
      lower:value,
      lowerOpen:false,
      upper:value_upper,
      upperOpen:true
    };
  } else {
    throw Error('Invalid op');
  }
};

