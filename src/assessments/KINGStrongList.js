var Case = require('Case');
var KINGStrongList = {
  run: function (test) {
    test.get('$scope').find('strong').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      _case.set({
        status: $(this).parent().is('li') ? 'passed' : 'failed'
      });
    });
  },

  meta: {
    replace: 'this'
  }
};
module.exports = KINGStrongList;
