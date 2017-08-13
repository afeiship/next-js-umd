(function (nx, global) {

  var DOT = '.',
    DOUBLE_DOT = '..',
    SLASH = '/';

  nx.declare('nx.amd.Path', {
    statics: {
      normalize: function (inPath) {
        var tokens = inPath.split(SLASH);
        var normalized = [], token, count = 0;

        for (var i = 0, len = tokens.length; i < len; i++) {
          token = tokens[i];
          if (token) {
            if (token === DOUBLE_DOT) {
              if (count > 0) {
                count--;
                normalized.pop();
              } else {
                normalized.push(DOUBLE_DOT);
              }
            } else if (token === DOT) {
              if (i === 0) {
                normalized.push(DOT);
              }
            } else {
              count++;
              normalized.push(token);
            }
          } else {
            if (count > 0 && i < len - 1) {
              normalized = normalized.slice(0, -count);
            } else {
              normalized.push('');
            }
          }
        }

        return normalized.join(SLASH);
      },
      parent: function (inPath) {
        return inPath.slice(0, inPath.lastIndexOf(SLASH) + 1);
      },
      last: function (inPath) {
        return inPath.slice(inPath.lastIndexOf(SLASH) + 1);
      },
      setExt: function (inPath, inExt) {
        var extLength = inExt.length;
        var end = inPath.slice(-extLength);

        if (end === inExt) {
          return inPath;
        } else if (end[extLength - 1] === SLASH) {
          return inPath + 'index' + DOT + inExt;
        } else {
          return inPath + DOT + inExt;
        }
      },
      getExt: function (inPath) {
        var slashIndex = inPath.lastIndexOf(SLASH);
        var dotIndex = inPath.lastIndexOf(DOT);

        if (dotIndex > slashIndex) {
          return inPath.slice(dotIndex + 1);
        } else {
          return 'js';
        }
      }
    }
  });

}(nx, nx.GLOBAL));

(function (nx, global) {

  nx.declare('nx.amd.Status', {
    statics: {
      PENDING: 0,
      LOADING: 1,
      RESOLVING: 2,
      RESOLVED: 3
    }
  });

}(nx, nx.GLOBAL));

(function (nx, global) {

  var STATUS = nx.amd.Status;
  var Path = nx.amd.Path;
  var isNodeEnv = typeof module !== 'undefined' && module.exports;
  var Module = nx.declare('nx.amd.Module', {
    statics: {
      all: {},
      current: null,
      load: function (inPath, inCallback, inOwner) {
        var currentPath = inPath,
          currentModule,
          ownerPath,
          loader,
          ext = Path.getExt(inPath);

        // If original path does not contain a SLASH, it should be the library path
        ownerPath = inOwner ? Path.parent(inOwner.get('path')) : './';
        currentPath = Path.normalize(ownerPath + currentPath);
        currentModule = Module.all[currentPath];

        if (currentModule) {
          return currentModule.load(inCallback);
        } else {
          if (!isNodeEnv) {
            loader = new nx.amd.Loader(currentPath, ext, inCallback);
          } else {
            loader = new nx.amd.Loader(inPath, 'nodejs', inCallback);
          }
          loader.load();
        }
      }
    },
    properties: {
      path: '',
      status: STATUS.PENDING,
      dependencies: null,
      factory: null,
      exports: null
    },
    methods: {
      init: function (inPath, inDeps, inFactory) {
        this.sets({
          path: inPath || '',
          dependencies: inDeps || [],
          factory: inFactory || nx.noop,
          exports: null
        });

        this._callbacks = [];
      },
      load: function (inCallback) {
        var status = this.get('status');
        if (status === STATUS.RESOLVED) {
          if (inCallback) {
            inCallback(this.get('exports'));
          }
        } else {
          if (inCallback) {
            this._callbacks.push(inCallback);
          }
        }

        if (status === STATUS.LOADING) {
          var deps = this.get('dependencies');
          var factory = this.get('factory');
          var exports = this.get('exports');
          var count = deps.length;
          var params = [];
          var self = this;
          var done = function (inValue, inParams) {
            var value = factory.apply(inValue, inParams) || inValue;
            self.set('exports', value);
            self.set('status', STATUS.RESOLVED);

            nx.each(self._callbacks, function (_, callback) {
              callback(value);
            });

            self._callbacks = [];
          };

          this.set('status', STATUS.RESOLVING);

          if (count === 0) {
            done(exports, params);
          } else {
            nx.each(deps, function (index, dep) {
              Module.load(dep, function (param) {
                params[index] = param;
                count--;
                if (count === 0) {
                  done(exports, params);
                }
              }, self);
            });
          }
        }
      }
    }
  });

}(nx, nx.GLOBAL));

(function (nx, global) {

  var doc = global.document;
  var head = doc && (doc.head || doc.getElementsByTagName('head')[0] || doc.documentElement);
  var Path = nx.amd.Path;
  var Module = nx.amd.Module;
  var STATUS = nx.amd.Status;
  var completeRE = /loaded|complete/;

  nx.declare('nx.amd.Loader', {
    methods: {
      init: function (inPath, inExt, inCallback) {
        var path = this.path = inPath || '';
        this.ext = inExt;
        this.module = Module.all[path] = new Module(path);
        this.callback = inCallback || nx.noop;
      },
      load: function () {
        var ext = this.ext;
        if (ext) {
          return this[ext]();
        }
        nx.error('The ext ' + ext + ' is not supported.');
      },
      nodejs: function () {
        //todo:need optimize
        var currentModule, path = this.path;
        var exports = nx.__currentRequire(path);
        var isNodeModule = path[0].indexOf('.') === -1;
        var status = isNodeModule ? STATUS.RESOLVED : STATUS.LOADING;
        currentModule = Module.current;
        if (currentModule) {
          this.module.sets({
            exports: exports,
            path: path,
            dependencies: currentModule.get('dependencies'),
            factory: currentModule.get('factory'),
            status: status
          });
        } else {
          this.module.sets({
            exports: exports,
            path: path,
            status: status
          });
        }
        this.module.load(this.callback);
      },
      css: function () {
        var linkNode = doc.createElement('link'),
          currentModule;
        linkNode.rel = 'stylesheet';
        linkNode.href = Path.setExt(this.path, 'css');
        head.appendChild(linkNode);
        currentModule = Module.current;

        this.module.sets({
          exports: linkNode,
          path: this.path,
          dependencies: currentModule.get('dependencies'),
          factory: currentModule.get('factory'),
          status: STATUS.RESOLVED
        });
        this.module.load(this.callback);
      },
      js: function () {
        var scriptNode = doc.createElement('script');
        var supportOnload = "onload" in scriptNode;
        var self = this;
        var currentModule;
        var complete = function (err) {
          scriptNode.onload = scriptNode.onerror = scriptNode.onreadystatechange = null;
          if (err) {
            nx.error('Failed to load module:' + self.path);
          } else {
            currentModule = Module.current;
            self.module.sets({
              path: self.path,
              dependencies: currentModule.get('dependencies'),
              factory: currentModule.get('factory'),
              status: STATUS.LOADING
            });
            self.module.load(self.callback);
          }
        };

        scriptNode.src = Path.setExt(self.path, 'js');
        scriptNode.async = true;
        head.appendChild(scriptNode);
        if (supportOnload) {
          scriptNode.onload = function () {
            complete(null);
          };
        } else {
          scriptNode.onreadystatechange = function (e) {
            if (completeRE.test(scriptNode.readyState)) {
              complete(null);
            } else {
              complete(e);
            }
          };
        }
        scriptNode.onerror = function (e) {
          complete(e);
        };
      }
    }
  });

}(nx, nx.GLOBAL));

(function (nx, global) {


  var Module = nx.amd.Module;
  var nxIs = nx.isServer || require('next-is').isServer;

  nx.define = function (inDeps, inFactory) {
    var len = arguments.length;
    var deps = [];
    var factory = null;
    switch (true) {
      case len === 2:
        deps = inDeps;
        factory = arguments[1];
        break;
      case len === 1 && nx.isFunction(inDeps):
        factory = inDeps;
        break;
      case len === 1 && nx.isArray(inDeps):
        deps = inDeps;
        factory = function () {
          var result = {length: arguments.length};
          nx.each(arguments, function (index, mod) {
            if (mod.__module__) {
              result[mod.__module__] = mod;
            }
            result[index] = mod;
          });

          return result;
        };
        break;
      default:
        nx.error('Invalid arguments.');
    }
    Module.current = new Module('', deps, factory);
    return Module.current;
  };


  nx.require = function (inDeps, inCallback) {
    var nDeps = inDeps.length;
    var count = 0, params = [];
    var done = function () {
      if (count === nDeps) {
        inCallback.apply(null, params);
      }
    };

    inDeps.forEach(function (dep) {
      Module.load(dep, function (param) {
        count++;
        params.push(param);
        done();
      });
    });
  };


  if (nx.isServer()) {
    nx.__currentRequire = function (inSystemRequire) {
      nx.__currentRequire = inSystemRequire;
    };

    module.exports = nx.__currentRequire;
  }


}(nx, nx.GLOBAL));
