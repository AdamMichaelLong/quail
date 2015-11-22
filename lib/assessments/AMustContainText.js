'use strict';

var ContainsReadableTextComponent = require('ContainsReadableTextComponent');
var Case = require('Case');
var AMustContainText = function AMustContainText(test) {
  test.get('$scope').find('a').each(function () {
    var _case = Case({
      element: this
    });
    test.add(_case);

    if (!$(this).attr('href') || $(this).css('display') === 'none') {
      _case.set({
        status: 'inapplicable'
      });
      return;
    }

    if (ContainsReadableTextComponent($(this), true)) {
      _case.set({
        status: 'passed'
      });
    } else {
      _case.set({
        status: 'failed'
      });
    }
  });
};
module.exports = AMustContainText;