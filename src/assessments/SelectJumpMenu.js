var Case = require('Case');
var HasEventListenerComponent = require('HasEventListenerComponent');
var SelectJumpMenu = {
  run: function (test) {
    var $scope = test.get('$scope');
    if ($scope.find('select').length === 0) {
      return;
    }

    $scope.find('select').each(function () {
      if ($(this).parent('form').find(':submit').length === 0 &&
          HasEventListenerComponent($(this), 'change')) {
        test.add(Case({
          element: this,
          status: 'failed'
        }));
      }
      else {
        test.add(Case({
          element: this,
          status: 'passed'
        }));
      }
    });
  },

  meta: {
replace: 'this'
  }
};
module.exports = SelectJumpMenu;
