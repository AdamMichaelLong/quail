var Case = require('Case');
var TableUsesAbbreviationForHeader = function (test) {
  test.get('$scope').find('th:not(th[abbr])').each(function () {
    if ($(this).text().length > 20) {
      test.add(Case({
        element: this,
        status: 'failed'
      }));
    }
  });
};
module.exports = TableUsesAbbreviationForHeader;
