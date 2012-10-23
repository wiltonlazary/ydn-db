/**
* @fileoverview Provide atomic CRUD database operations.
*
*
*/


goog.provide('ydn.db.core.TxStorage');
goog.require('ydn.error.NotSupportedException');
goog.require('ydn.db.tr.TxStorage');
goog.require('ydn.db.io.CrudService');
goog.require('ydn.db.req.IndexedDb');
goog.require('ydn.db.req.SimpleStore');
goog.require('ydn.db.req.WebSql');



/**
 * Construct storage to execute CRUD database operations.
 *
 * Execution database operation is atomic, if a new transaction require,
 * otherwise existing transaction is used and the operation become part of
 * the existing transaction. A new transaction is required if the transaction
 * is not active or locked. Active transaction can be locked by using
 * mutex.
 *
 * @implements {ydn.db.io.CrudService}
 * @param {!ydn.db.core.Storage} storage
 * @param {number} ptx_no
 * @param {string} scope_name
 * @param {!ydn.db.schema.Database} schema
 * @constructor
 * @extends {ydn.db.tr.TxStorage}
*/
ydn.db.core.TxStorage = function(storage, ptx_no, scope_name, schema) {
  goog.base(this, storage, ptx_no, scope_name);

  /**
   * @protected
   * @final
   * @type {!ydn.db.schema.Database}
   */
  this.schema = schema;
};
goog.inherits(ydn.db.core.TxStorage, ydn.db.tr.TxStorage);


/**
 * @final
 * @return {!ydn.db.core.Storage}
 */
ydn.db.core.TxStorage.prototype.getStorage = function() {
  return /** @type {!ydn.db.core.Storage} */ (goog.base(this, 'getStorage'));
};


/**
 * @final
 * @return {string}
 */
ydn.db.core.TxStorage.prototype.getName = function() {
  // db name can be undefined during instantiation.
  this.db_name = this.db_name || this.getStorage().getName();
  return this.db_name;
};


/**
 * @protected
 * @type {ydn.db.req.RequestExecutor}
 */
ydn.db.core.TxStorage.prototype.executor = null;


/**
 * Return cache executor object or create on request. This have to be crated
 * Lazily because, we can initialize it only when transaction object is active.
 * @final
 * @protected
 * @return {ydn.db.req.RequestExecutor}
 */
ydn.db.core.TxStorage.prototype.getExecutor = function() {
  if (this.executor) {
    return this.executor;
  } else {

    var type = this.type();
    if (type == ydn.db.con.IndexedDb.TYPE) {
      this.executor = new ydn.db.req.IndexedDb(this.getName(), this.schema);
    } else if (type == ydn.db.con.WebSql.TYPE) {
      this.executor = new ydn.db.req.WebSql(this.db_name, this.schema);
    } else if (type == ydn.db.con.SimpleStorage.TYPE ||
        type == ydn.db.con.LocalStorage.TYPE ||
        type == ydn.db.con.SessionStorage.TYPE) {
      this.executor = new ydn.db.req.SimpleStore(this.db_name, this.schema);
    } else {
      throw new ydn.db.InternalError('No executor for ' + type);
    }

    return this.executor;
  }
};


/**
 * @final
 * @throws {ydn.db.ScopeError}
 * @protected
 * @param {function(ydn.db.req.RequestExecutor)} callback
 * @param {!Array.<string>} store_names store name involved in the transaction.
 * @param {ydn.db.base.TransactionMode} mode mode, default to 'readonly'.
 */
ydn.db.core.TxStorage.prototype.execute = function(callback, store_names, mode)
{
  var me = this;
  var mu_tx = this.getMuTx();

  if (mu_tx.isActiveAndAvailable()) {
    //window.console.log(mu_tx.getScope() + ' continuing');
    // call within a transaction
    // continue to use existing transaction
    me.getExecutor().setTx(mu_tx.getTx(), me.scope);
    callback(me.getExecutor());
  } else {
    //console.log('creating new')
    //
    // create a new transaction and close for invoke in non-transaction context
    var tx_callback = function(idb) {
      // transaction should be active now
      if (!mu_tx.isActive()) {
        throw new ydn.db.InternalError('Tx not active for scope: ' + me.scope);
      }
      if (!mu_tx.isAvailable()) {
        throw new ydn.db.InternalError('Tx not available for scope: ' + me.scope);
      }
      me.getExecutor().setTx(mu_tx.getTx(), me.scope);
      callback(me.getExecutor());
      mu_tx.lock(); // explicitly told not to use this transaction again.
    };
    //var cbFn = goog.partial(tx_callback, callback);
    tx_callback.name = this.scope; // scope name
    //window.console.log(mu_tx.getScope() +  ' active: ' + mu_tx.isActive() + ' locked: ' + mu_tx.isSetDone());
    this.run(tx_callback, store_names, mode);
    // need to think about handling oncompleted and onerror callback of the
    // transaction. after executed all the requests, the transaction is not
    // completed. consider this case
    // db.put(data).addCallback(function(id) {
    //    // at this stage, transaction for put request is not grantee finished.
    //    db.get(id);
    //    // but practically, when next transaction is open,
    //    // the previous transaction should be finished anyways,
    //    // due to 'readwrite' lock.
    //    // so seems like OK. it is not necessary to listen oncompleted
    //    // callback.
    // });
  }
};



/**
 *
 * @param {(string|number)=}id
 * @param {ydn.db.Key=} opt_parent
 * @return {ydn.db.io.Key}
 */
ydn.db.core.TxStorage.prototype.key = function(store_or_json_or_value, id, opt_parent) {
  return new ydn.db.io.Key(this, store_or_json_or_value, id, opt_parent);
};


/**
 *
 * @param {string} store_name
 * @return {!goog.async.Deferred} return object in deferred function.
 */
ydn.db.core.TxStorage.prototype.count = function(store_name) {
  var df = ydn.db.base.createDeferred();
  var count = function(executor) {
    executor.count(df, store_name);
  };
  this.execute(count, [store_name], ydn.db.base.TransactionMode.READ_ONLY);
  return df;
};



/**
 * Return object or objects of given key or keys.
 * @param {(string|!ydn.db.Key|!Array.<!ydn.db.Key>)=} arg1 table name.
 * @param {(string|number|!Array.<string>|!Array.<!Array.<string>>)=} arg2
 * object key to be retrieved, if not provided,
 * all entries in the store will return.
 * @return {!goog.async.Deferred} return object in deferred function.
 */
ydn.db.core.TxStorage.prototype.get = function (arg1, arg2) {

  var df = ydn.db.base.createDeferred();


  if (arg1 instanceof ydn.db.Key) {
    /**
     * @type {ydn.db.Key}
     */
    var k = arg1;
    var k_store_name = k.getStoreName();
    goog.asserts.assert(this.schema.hasStore(k_store_name), 'Store: ' +
      k_store_name + ' not found.');
    var kid = k.getId();
    this.execute(function (executor) {
      executor.getById(df, k_store_name, kid);
    }, [k_store_name], ydn.db.base.TransactionMode.READ_ONLY);
  } else if (goog.isString(arg1)) {
    var store_name = arg1;
    var store = this.schema.getStore(store_name);
    if (!store) {
      throw new ydn.error.ArgumentException('Store: ' + store_name + ' not found.')
    }
    // here I have very concern about schema an object store mismatch!
    // should try query without sniffing store.type
    if (store.type == ydn.db.schema.DataType.ARRAY) {
      if (goog.isArray(arg2)) {
        var arr = arg2;
        var key0 = arr[0];
        if (goog.isArray(key0)) {
          if (goog.isString(key0[0]) || goog.isNumber(key0[0])) {
            this.execute(function (executor) {
              executor.getByIds(df, store_name, arr);
            }, [store_name], ydn.db.base.TransactionMode.READ_ONLY);
          } else {
            throw new ydn.error.ArgumentException('key array too deep.');
          }
        } else if (goog.isDef(arg2)) {
          var arr_id = arg2;
          this.execute(function (executor) {
            executor.getById(df, store_name, arr_id);
          }, [store_name], ydn.db.base.TransactionMode.READ_ONLY);
        } else {
          throw new ydn.error.ArgumentException();
        }
      } else {
        throw new ydn.error.ArgumentException('array key required.');
      }
    } else {
      if (goog.isArray(arg2)) {
        if (goog.isString(arg2[0]) || goog.isNumber(arg2[0])) {
          var ids = arg2;
          this.execute(function (executor) {
            executor.getByIds(df, store_name, ids);
          }, [store_name], ydn.db.base.TransactionMode.READ_ONLY);
        } else {
          throw new ydn.error.ArgumentException('key must be string or number');
        }
      } else if (goog.isString(arg2) || goog.isNumber(arg2)) {
        /** @type {string} */
        /** @type {string|number} */
        var id = arg2;
        this.execute(function (executor) {
          executor.getById(df, store_name, id);
        }, [store_name], ydn.db.base.TransactionMode.READ_ONLY);
      } else if (!goog.isDef(arg2)) {
        this.execute(function (executor) {
          executor.getByStore(df, store_name);
        }, [store_name], ydn.db.base.TransactionMode.READ_ONLY);

      } else {
        throw new ydn.error.ArgumentException();
      }
    }
  } else if (goog.isArray(arg1)) {
    if (arg1[0] instanceof ydn.db.Key) {
      var store_names = [];
      /**
       * @type {!Array.<!ydn.db.Key>}
       */
      var keys = arg1;
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var i_store_name = key.getStoreName();
        if (!this.schema.hasStore(i_store_name)) {
          throw new ydn.error.ArgumentException('Store: ' + i_store_name + ' not found.');
        }
        if (!goog.array.contains(store_names, i_store_name)) {
          store_names.push(i_store_name);
        }
      }
      this.execute(function (executor) {
        executor.getByKeys(df, keys);
      }, store_names, ydn.db.base.TransactionMode.READ_ONLY);
    } else {
      throw new ydn.error.ArgumentException();
    }
  } else if (!goog.isDef(arg1) && !goog.isDef(arg2)) {
    this.execute(function (executor) {
      executor.getByStore(df);
    }, this.schema.getStoreNames(), ydn.db.base.TransactionMode.READ_ONLY);
  } else {
    throw new ydn.error.ArgumentException();
  }

  return df;
};


/**
 * Execute PUT request either storing result to tx or callback to df.
 * @param {string|StoreSchema} store_name_or_schema store name or
 * schema.
 * @param {!Object|!Array.<!Object>} value object to put.
 * @param {string|number|!Array.<(string|number)>=} opt_keys out-of-line keys
 * @return {!goog.async.Deferred}
 */
ydn.db.core.TxStorage.prototype.put = function (store_name_or_schema, value, opt_keys) {


  var store_name = goog.isString(store_name_or_schema) ?
    store_name_or_schema : goog.isObject(store_name_or_schema) ?
    store_name_or_schema['name'] : undefined;
  if (!goog.isString(store_name))  {
    throw new ydn.error.ArgumentException('store name');
  }

  var store = this.schema.getStore(store_name);
  if (!store) {
    if (goog.isObject(store_name_or_schema)) {
      // this is async process, but we don't need to wait for it.
      store = ydn.db.schema.Store.fromJSON(store_name_or_schema);
      this.addStoreSchema(store);
    } else {
      throw new ydn.error.ArgumentException('store schema required.');
    }
  } else if (this.schema.isAutoSchema() && goog.isObject(store_name_or_schema)) {
    // if there is changes in schema, change accordingly.
    var new_schema = ydn.db.schema.Store.fromJSON(store_name_or_schema);
    var diff = store.difference(new_schema);
    if (diff) {
      throw new ydn.error.NotSupportedException('schema change: ' + diff);
      // this.addStoreSchema(store);
    }
  }

  var df = ydn.db.base.createDeferred();
  var me = this;

  if (!store) {
    throw new ydn.error.ArgumentException('Store: ' + store_name + ' not exists.');
  }
  // https://developer.mozilla.org/en-US/docs/IndexedDB/IDBObjectStore#put
  if ((goog.isString(store.keyPath)) && goog.isDef(opt_keys)) {
    // The object store uses in-line keys or has a key generator, and a key parameter was provided.
    throw new ydn.error.ArgumentException('key cannot provide while in-line key is in used.');
  } else if (store.autoIncrement && goog.isDef(opt_keys)) {
    // The object store uses in-line keys or has a key generator, and a key parameter was provided.
    throw new ydn.error.ArgumentException('key cannot provide while autoIncrement is true.');
  } else if (!goog.isString(store.keyPath) && !store.autoIncrement && !goog.isDef(opt_keys)) {
    // The object store uses out-of-line keys and has no key generator, and no key parameter was provided.
    throw new ydn.error.ArgumentException('out-of-line key must be provided.');
  }

  if (goog.isArray(value)) {
    var objs = value;
    var keys = /** @type {!Array.<(number|string)>|undefined} */ (opt_keys);
    this.execute(function (executor) {
      executor.putObjects(df, store_name, objs, keys);
    }, [store_name], ydn.db.base.TransactionMode.READ_WRITE);
  } else if (goog.isObject(value)) {
    var obj = value;
    var key = /** @type {number|string|undefined} */  (opt_keys);
    this.execute(function (executor) {
      executor.putObject(df, store_name, obj, key);
    }, [store_name], ydn.db.base.TransactionMode.READ_WRITE);
  } else {
    throw new ydn.error.ArgumentException();
  }

  return df;


};


/**
 * Remove a specific entry from a store or all.
 * @param {(!Array.<string>|string)=} arg1 delete the table as provided otherwise
 * delete all stores.
 * @param {(string|number)=} arg2 delete a specific row.
 * @see {@link #remove}
 * @return {!goog.async.Deferred} return a deferred function.
 */
ydn.db.core.TxStorage.prototype.clear = function(arg1, arg2) {

  var df = ydn.db.base.createDeferred();

  if (goog.isString(arg1)) {
    var store_name = arg1;
    if (goog.isString(arg2) || goog.isNumber(arg2)) {
      var id = arg2;
      this.execute(function(executor) {
        executor.clearById(df, store_name, id);
      }, [store_name], ydn.db.base.TransactionMode.READ_WRITE);
    } else if (!goog.isDef(arg2)) {
      this.execute(function(executor) {
        executor.clearByStore(df, store_name);
      }, [store_name], ydn.db.base.TransactionMode.READ_WRITE);
    } else {
      throw new ydn.error.ArgumentException();
    }
  } else if (goog.isArray(arg1) && goog.isString(arg1[0])) {
    var store_names = arg1;
    this.execute(function(executor) {
      executor.clearByStore(df, store_names);
    }, store_names, ydn.db.base.TransactionMode.READ_WRITE);
  } else if (!goog.isDef(arg1)) {
    var store_names = this.schema.getStoreNames();
    this.execute(function(executor) {
      executor.clearByStore(df, store_names);
    }, store_names, ydn.db.base.TransactionMode.READ_WRITE);
  } else {
    throw new ydn.error.ArgumentException();
  }

  return df;
};



/** @override */
ydn.db.core.TxStorage.prototype.toString = function() {
  var s = 'TxStorage:' + this.getStorage().getName();
  if (goog.DEBUG) {
    var scope = this.getScope();
    scope = scope ? '[' + scope + ']' : '';
    var mu = this.getMuTx().getScope();
    var mu_scope = mu ? '[' + mu + ']' : '';
    return s + ':' + this.q_no_ + scope + ':' + this.getTxNo() + mu_scope;
  }
  return s;
};




