// This file was autogenerated by calcdeps.py
goog.addDependency("../../../ydn-db/js/main.js", [], ['goog.debug.Console', 'goog.debug.LogManager', 'ydn.db.Core', 'ydn.db.tr.Core', 'ydn.db.Storage', 'ydn.db.test']);
goog.addDependency("../../../ydn-db/js/ydn/db/storage.js", ['ydn.db.Storage'], ['goog.userAgent.product', 'ydn.async', 'ydn.db.LocalStorage', 'ydn.db.IndexedDb', 'ydn.db.adapter.IndexedDb', 'ydn.db.MemoryStore', 'ydn.db.WebSql', 'ydn.object', 'ydn.db.TQuery', 'ydn.db.RichStorage_', 'ydn.db.Core']);
goog.addDependency("../../../ydn-db/js/ydn/db/test_utils.js", ['ydn.db.test'], ['ydn.db.QueryService']);
goog.addDependency("../../../ydn-db/js/ydn/db/adapter/abstract_service.js", ['ydn.db.AbstractService'], ['ydn.db.Query', 'ydn.db.QueryService', 'ydn.db.Key']);
goog.addDependency("../../../ydn-db/js/ydn/db/adapter/core_service.js", ['ydn.db.CoreService'], ['goog.async.Deferred']);
goog.addDependency("../../../ydn-db/js/ydn/db/adapter/html5_storage.js", ['ydn.db.adapter.LocalStorage', 'ydn.db.adapter.SessionStorage'], ['ydn.db.adapter.SimpleStorage']);
goog.addDependency("../../../ydn-db/js/ydn/db/adapter/indexed_db.js", ['ydn.db.adapter.IndexedDb'], ['goog.Timer', 'goog.async.DeferredList', 'goog.debug.Error', 'goog.events', 'ydn.async', 'ydn.db', 'ydn.db.DatabaseSchema', 'ydn.db.CoreService', 'ydn.json']);
goog.addDependency("../../../ydn-db/js/ydn/db/adapter/simple_storage.js", ['ydn.db.adapter.SimpleStorage'], ['goog.asserts', 'goog.async.Deferred', 'goog.Timer', 'ydn.db.Key', 'ydn.db.CoreService']);
goog.addDependency("../../../ydn-db/js/ydn/db/adapter/websql.js", ['ydn.db.adapter.WebSql'], ['goog.async.Deferred', 'goog.debug.Logger', 'goog.events', 'ydn.async', 'ydn.json', 'ydn.db']);
goog.addDependency("../../../ydn-db/js/ydn/db/core/core.js", ['ydn.db.Core'], ['goog.userAgent.product', 'ydn.async', 'ydn.db.adapter.LocalStorage', 'ydn.db.adapter.SessionStorage', 'ydn.db.adapter.IndexedDb', 'ydn.db.adapter.SimpleStorage', 'ydn.db.adapter.WebSql', 'ydn.object', 'ydn.db.CoreService', 'ydn.error.ArgumentException']);
goog.addDependency("../../../ydn-db/js/ydn/db/core/db.js", ['ydn.db', 'ydn.db.YdnDbValidKeyException', 'ydn.db.InvalidStateException'], []);
goog.addDependency("../../../ydn-db/js/ydn/db/core/key.js", ['ydn.db.Key'], []);
goog.addDependency("../../../ydn-db/js/ydn/db/core/schema.js", ['ydn.db.DataType', 'ydn.db.DatabaseSchema', 'ydn.db.IndexSchema', 'ydn.db.StoreSchema'], []);
goog.addDependency("../../../ydn-db/js/ydn/db/query/html5db.js", ['ydn.db.LocalStorage', 'ydn.db.SessionStorage'], ['ydn.db.MemoryStore']);
goog.addDependency("../../../ydn-db/js/ydn/db/query/indexed_db.js", ['ydn.db.IndexedDb'], ['goog.async.DeferredList', 'ydn.db.adapter.IndexedDb', 'ydn.db.Query', 'ydn.json', 'ydn.error']);
goog.addDependency("../../../ydn-db/js/ydn/db/query/memory_store.js", ['ydn.db.MemoryStore'], ['goog.asserts', 'goog.async.Deferred', 'goog.Timer', 'ydn.db.QueryService', 'ydn.db.adapter.SimpleStorage']);
goog.addDependency("../../../ydn-db/js/ydn/db/query/query.js", ['ydn.db.Query', 'ydn.db.Query.KeyRangeJson', 'ydn.db.Query.KeyRangeImpl'], ['goog.functions']);
goog.addDependency("../../../ydn-db/js/ydn/db/query/query_service.js", ['ydn.db.QueryService', 'ydn.db.QueryServiceProvider'], ['goog.async.Deferred', 'ydn.db.Query', 'ydn.db.Key']);
goog.addDependency("../../../ydn-db/js/ydn/db/query/rich_storage_wrapper.js", ['ydn.db.RichStorage_'], ['goog.storage.ExpiringStorage', 'goog.storage.EncryptedStorage']);
goog.addDependency("../../../ydn-db/js/ydn/db/query/tkey.js", ['ydn.db.TKey'], ['ydn.db.Key']);
goog.addDependency("../../../ydn-db/js/ydn/db/query/tquery.js", ['ydn.db.TQuery'], ['ydn.db.Query', 'ydn.db.QueryService', 'ydn.db.Query']);
goog.addDependency("../../../ydn-db/js/ydn/db/query/transaction_storage.js", ['ydn.db.TxStorage'], ['ydn.db.Storage']);
goog.addDependency("../../../ydn-db/js/ydn/db/query/websql.js", ['ydn.db.WebSql'], ['goog.async.Deferred', 'goog.debug.Logger', 'goog.events', 'ydn.async', 'ydn.db.QueryService', 'ydn.db.Query', 'ydn.json', 'ydn.db.WebSql']);
goog.addDependency("../../../ydn-db/js/ydn/db/tr/core.js", ['ydn.db.tr.Core'], ['ydn.db.Core', 'ydn.db.tr.IndexedDb', 'ydn.db.tr.WebSql', 'ydn.db.tr.LocalStorage', 'ydn.db.tr.SessionStorage', 'ydn.db.tr.SimpleStorage']);
goog.addDependency("../../../ydn-db/js/ydn/db/tr/html5_storage.js", ['ydn.db.tr.LocalStorage', 'ydn.db.tr.SessionStorage'], ['ydn.db.adapter.SimpleStorage']);
goog.addDependency("../../../ydn-db/js/ydn/db/tr/indexed_db.js", ['ydn.db.tr.IndexedDb', 'ydn.db.IndexedDb'], []);
goog.addDependency("../../../ydn-db/js/ydn/db/tr/simple_storage.js", ['ydn.db.tr.SimpleStorage'], ['ydn.db.adapter.SimpleStorage']);
goog.addDependency("../../../ydn-db/js/ydn/db/tr/transaction_core.js", ['ydn.db.TxCore'], ['ydn.db.Core']);
goog.addDependency("../../../ydn-db/js/ydn/db/tr/transaction_mutex.js", ['ydn.db.tr.Mutex', 'ydn.db.tr.SqlMutex', 'ydn.db.tr.IdbMutex'], ['goog.array', 'goog.asserts', 'ydn.db.InvalidStateException']);
goog.addDependency("../../../ydn-db/js/ydn/db/tr/transaction_service.js", ['ydn.db.tr.Service'], ['ydn.db.CoreService']);
goog.addDependency("../../../ydn-db/js/ydn/db/tr/websql.js", ['ydn.db.tr.WebSql'], ['ydn.db.WebSql']);
