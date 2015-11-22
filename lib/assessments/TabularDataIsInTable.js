'use strict';

var Case = require('Case');
var TabularDataIsInTable = function TabularDataIsInTable(test) {
  test.get('$scope').find('pre').each(function () {
    if ($(this).html().search('\t') >= 0) {
      test.add(Case({
        element: this,
        status: 'failed'
      }));
    } else {
      test.add(Case({
        element: this,
        status: 'passed'
      }));
    }
  });
};
module.exports = TabularDataIsInTable;