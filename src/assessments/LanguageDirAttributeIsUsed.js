var GetTextContentsComponent = require('GetTextContentsComponent');
var TextSelectorComponent = require('TextSelectorComponent');
var Case = require('Case');
const DOM = require('DOM');
var LanguageComponent = require('LanguageComponent');
var TextNodeFilterComponent = require('TextNodeFilterComponent');
var LanguageDirAttributeIsUsed = {
  run: function (test) {

    var textDirection = LanguageComponent.textDirection;

    function countDirAttributes (element) {
      var currentDirection = DOM.getAttribute(element, 'dir');
      if (!currentDirection) {
        var dirScope = DOM.parents(element).find((parent) => {
          return DOM.hasAttribute(parent, 'dir');
        })[0];
        var parentDir = dirScope && DOM.getAttribute(dirScope, 'dir');
        currentDirection = parentDir || currentDirection;
      }
      if (typeof currentDirection === 'string') {
        currentDirection = currentDirection.toLowerCase();
      }
      if (typeof textDirection[currentDirection] === 'undefined') {
        currentDirection = 'ltr';
      }
      var oppositeDirection = (currentDirection === 'ltr') ? 'rtl' : 'ltr';
      var text = GetTextContentsComponent(element);
      var textMatches = text.match(textDirection[oppositeDirection]);
      if (!textMatches) {
        return;
      }
      var matches = textMatches.length;
      DOM.scry('[dir=' + oppositeDirection + ']', element).forEach(function () {
        var childMatches = element.textContent.match(textDirection[oppositeDirection]);
        if (childMatches) {
          matches -= childMatches.length;
        }
      });

      var _case = test.add(Case({
        element: element
      }));

      _case.set({
        status: (matches > 0) ? 'failed' : 'passed'
      });
    }

    test.get('scope').forEach(function (scope) {
      DOM.scry(TextSelectorComponent, scope)
        .filter(function (element) {
          return TextNodeFilterComponent(element);
        })
        .forEach(countDirAttributes);
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Use the dir attribute when the language direction changes',
      nl: 'Gebruik het dir-attribuut als de richting van de taal verandert'
    },
    description: {
      en: 'When there are nested directional changes in text, use an inline element with a <code>dir</code> attribute to indicate direction.',
      nl: 'Gebruik een inline element met een <code>dir</code>-attribuut om richting aan te geven wanneer er geneste richtingsveranderingen in de tekst zijn.'
    },
    guidelines: {
      wcag: {
        '1.3.2': {
          techniques: [
            'H56'
          ]
        }
      }
    },
    tags: [
      'language',
      'content'
    ]
  }
};
module.exports = LanguageDirAttributeIsUsed;
