var Case = require('Case');
const DOM = require('DOM');
var IsUnreadable = require('IsUnreadable');
var ImgNonDecorativeHasAlt = {
  run: function (test) {
    test.get('scope').forEach((scope) => {
      DOM.scry('img[alt]', scope).forEach(function (element) {
        var _case = Case({
          element: element
        });
        test.add(_case);
        var computedWidth =
          parseInt(removePX(DOM.getComputedStyle(element, 'width')), 10);
        var computedHeight =
          parseInt(removePX(DOM.getComputedStyle(element, 'height')), 10);
        if (IsUnreadable(DOM.getAttribute(element, 'alt')) &&
            (computedWidth > 100 || computedHeight > 100)) {
          _case.set({
            status: 'failed'
          });
        }
        else {
          _case.set({
            status: 'passed'
          });
        }
      });
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Any non-decorative images should have a non-empty \"alt\" attribute',
      nl: 'Elke niet-decoratieve afbeelding moet een gevuld \"alt\"-attribuut hebben'
    },
    description: {
      en: 'Any image that is not used decoratively or which is purely for layout purposes cannot have an empty \"alt\" attribute.',
      nl: 'Elke afbeelding die niet ter decoratie is of voor lay-out doeleinden wordt gebruikt, moet een gevuld \"alt\"-attribuut hebben.'
    },
    guidelines: {
      508: [
        'a'
      ],
      wcag: {
        '1.1.1': {
          techniques: [
            'F38'
          ]
        }
      }
    },
    tags: [
      'image',
      'content'
    ]
  }
};
module.exports = ImgNonDecorativeHasAlt;
