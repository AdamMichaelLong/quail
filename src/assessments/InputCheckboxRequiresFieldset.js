var Case = require('Case');
var InputCheckboxRequiresFieldset = function (test) {
  test.get('$scope').find('input[type="checkbox"]').each(function () {
    var _case = Case({
      element: this
    });
    test.add(_case);
    if (!$(this).parents('fieldset').length) {
      _case.set({
        status: 'failed'
      });
    }
    else {
      _case.set({
        status: 'passed'
      });
    }
  });
};
module.exports = InputCheckboxRequiresFieldset;
