var Case = require('Case');
const DOM = require('DOM');
var KINGStrongList = {
  run: function (test) {
    test.get('scope').forEach(function (scope) {
      DOM.scry('strong', scope).forEach(function (element) {
        var _case = Case({
          element: element
        });
        test.add(_case);
        _case.set({
          status: DOM.is(element.parentElement, 'li') ? 'passed' : 'failed'
        });
      });
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Use strong in lists only'
    },
    description: {
      en: 'STRONG only allowed when parent element is LI.'
    },
    guidelines: [

    ],
    tags: [
      'KING'
    ]
  }
};
module.exports = KINGStrongList;
