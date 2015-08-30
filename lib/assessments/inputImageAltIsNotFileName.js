'use strict';

quail.inputImageAltIsNotFileName = function (quail, test, Case) {
  test.get('$scope').find('input[type=image][alt]').each(function () {
    var _case = Case({
      element: this
    });
    test.add(_case);
    if ($(this).attr('src') === $(this).attr('alt')) {
      _case.set({
        status: 'failed'
      });
    } else {
      _case.set({
        status: 'passed'
      });
    }
  });
};