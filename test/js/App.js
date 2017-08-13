nx.define([
  './modules/mod1',
  '../css/style.css',
  './index-view/'
], function (mod1, _, view) {
  return nx.declare({
    methods: {
      init: function () {
        console.log('I am APP.js');
      },
      start: function () {
        console.log('load:', view[0].__meta__.module);
        console.log('load:', view[1].__meta__.module);
        console.log('App start!');
      }
    }
  });
});



