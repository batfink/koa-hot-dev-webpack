(function() {
  var compiler, devMiddleware, hotMiddleware, webpack, whm;

  webpack = require("webpack");

  devMiddleware = require('webpack-dev-middleware');

  hotMiddleware = require("webpack-hot-middleware");

  whm = null;

  compiler = null;

  module.exports = function(webconf, options) {
    var entry, hotReloadPath, key, ref, val, wdm;
    if (webconf.plugins == null) {
      webconf.plugins = [];
    }
    if (webpack.optimize.OccurenceOrderPlugin != null) {
      webconf.plugins.push(new webpack.optimize.OccurenceOrderPlugin());
      webconf.plugins.push(new webpack.NoErrorsPlugin());
    } else {
      webconf.plugins.push(new webpack.NoEmitOnErrorsPlugin());
    }
    webconf.plugins.push(new webpack.HotModuleReplacementPlugin());
    entry = webconf.entry != null ? webconf.entry : webconf.entry = {};
    hotReloadPath = require.resolve('./hot-reload');
    if (typeof entry === "string" || entry instanceof String) {
      webconf.entry = [hotReloadPath, entry];
    } else if (Array.isArray(entry)) {
      if (!(entry.indexOf(hotReloadPath) > -1)) {
        entry.unshift(hotReloadPath);
      }
    } else {
      ref = webconf.entry;
      for (key in ref) {
        val = ref[key];
        if (Array.isArray(val)) {
          if (!(entry.indexOf(hotReloadPath) > -1)) {
            val.unshift(hotReloadPath);
          }
        } else {
          webconf.entry[key] = [hotReloadPath, val];
        }
      }
    }
    if (options == null) {
      options = {};
    }
    if (options.publicPath == null) {
      options.publicPath = webconf.output.publicPath || "/";
    }
    if (options.noInfo == null) {
      options.noInfo = true;
    }
    if (options.stats == null) {
      options.stats = {
        colors: true
      };
    }
    compiler = webpack(webconf);
    wdm = devMiddleware(compiler, options);
    whm = hotMiddleware(compiler);
    compiler.plugin('compilation', function(compilation) {
      return compilation.plugin('html-webpack-plugin-after-emit', function(data, cb) {
        whm.publish({
          action: 'reload'
        });
        return cb();
      });
    });
    return function*(next) {
      var ctx, ended;
      ctx = this;
      ended = (yield function(done) {
        return wdm(ctx.req, {
          end: function(content) {
            ctx.body = content;
            return done(null, true);
          },
          setHeader: function() {
            return ctx.set.apply(ctx, arguments);
          }
        }, function() {
          return done(null, false);
        });
      });
      if (!ended) {
        yield whm.bind(null, ctx.req, ctx.res);
        return (yield next);
      }
    };
  };

  module.exports.reload = function() {
    return whm != null ? whm.publish({
      action: 'reload'
    }) : void 0;
  };

  module.exports.invalidate = function() {
    return compiler != null ? typeof compiler.invalidate === "function" ? compiler.invalidate() : void 0 : void 0;
  };

  module.exports.close = function() {
    return compiler != null ? typeof compiler.close === "function" ? compiler.close() : void 0 : void 0;
  };

}).call(this);
