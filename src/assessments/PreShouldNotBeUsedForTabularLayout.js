var Case = require('Case');
var PreShouldNotBeUsedForTabularLayout = {
  run: function (test) {
    test.get('$scope').find('pre').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      var rows = $(this).text().split(/[\n\r]+/);
      _case.set({
        status: (rows.length > 1 && $(this).text().search(/\t/) > -1) ? 'failed' : 'passed'
      });
    });
  },

  meta: {
    replace: 'this'
  }
};
module.exports = PreShouldNotBeUsedForTabularLayout;
