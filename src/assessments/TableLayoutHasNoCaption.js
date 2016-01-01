var IsDataTableComponent = require('IsDataTableComponent');
var Case = require('Case');
const DOM = require('DOM');
var TableLayoutHasNoCaption = {
  run: function (test) {
    DOM.scry('table', test.get('scope')).forEach(function (element) {
      if (DOM.scry('caption', element).length) {
        if (!IsDataTableComponent(element)) {
          test.add(Case({
            element: element,
            status: 'failed'
          }));
        }
        else {
          test.add(Case({
            element: element,
            status: 'passed'
          }));
        }
      }
      else {
        test.add(Case({
          element: element,
          status: 'inapplicable'
        }));
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All tables used for layout have no \"caption\" element',
      nl: 'Alle tabellen die alleen voor lay-out worden gebruikt hebben geen \"caption\"-element'
    },
    description: {
      en: 'If a table contains no data, and is used simply for layout, then it should not contain a <code>caption</code> element.',
      nl: 'Als een tabel geen data bevat en alle voor lay-out wordt gebruikt, moet hij geen <code>caption</code>-element krijgen.'
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
module.exports = TableLayoutHasNoCaption;
