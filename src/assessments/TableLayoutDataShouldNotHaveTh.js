var IsDataTableComponent = require('IsDataTableComponent');
var Case = require('Case');
var TableLayoutDataShouldNotHaveTh = {
  run: function (test) {
    test.get('$scope').find('table').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);

      if ($(this).find('th').length !== 0) {
        if (!IsDataTableComponent($(this))) {
          _case.set({
            status: 'failed'
          });
        }
        else {
          _case.set({
            status: 'passed'
          });
        }
      }
      else {
        _case.set({
          status: 'inapplicable'
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Layout tables should not contain \"th\" elements',
      nl: 'Lay-out tabellen bevatten geen \"th\"-elementen'
    },
    description: {
      en: 'Tables which are used purely for layout (as opposed to data tables), <strong>should not</strong> contain <code>th</code> elements, which would make the table appear to be a data table.',
      nl: 'Tabellen die alleen voor lay-out worden gebruikt (in tegenstelling tot datatabellen), moeten geen <code>th</code>-elementen bevatten, omdat deze de indruk wekken dat het een datatabel betreft.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: [
            'F46'
          ]
        }
      }
    },
    tags: [
      'table',
      'layout',
      'content'
    ]
  }
};
module.exports = TableLayoutDataShouldNotHaveTh;
