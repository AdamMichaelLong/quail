var Case = require('Case');
const DOM = require('DOM');
var IsUnreadable = require('IsUnreadable');
var ALinksAreSeparatedByPrintableCharacters = {
  run: function (test) {
    DOM.scry('a', test.get('scope')).forEach(function (element) {
      var _case = test.add(Case({
        element: element
      }));
      // Only test if there's another a tag.
      var next = DOM.next(element);
      if (next && DOM.is(next, 'a')) {
        if (IsUnreadable(element.nextSibling.wholeText)) {
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
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Lists of links should be seperated by printable characters',
      nl: 'Lijsten met links moeten gescheiden worden door afdrukbare tekens'
    },
    description: {
      en: 'If a list of links is provided within the same element, those links should be seperated by a non-linked, printable character. Structures like lists are not included in this.',
      nl: 'Als een rij met links binnen eenzelfde element staat, moeten de links gescheiden zijn door een niet-gelinkt, afdrukbaar teken. Dit geldt niet voor een gestructureerde lijst.'
    },
    guidelines: [

    ],
    tags: [
      'link',
      'content'
    ]
  }
};
module.exports = ALinksAreSeparatedByPrintableCharacters;
