var Case = require('Case');
const DOM = require('DOM');
var ConvertToPxComponent = require('ConvertToPxComponent');
var FocusElements = require('FocusElements');
var FocusIndicatorVisible = {
  run: function (test) {
    DOM.scry(FocusElements, test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      var $el = $(element);
      var noFocus = {
        borderWidth: $el.css('border-width'),
        borderColor: $el.css('border-color'),
        backgroundColor: $el.css('background-color'),
        boxShadow: $el.css('box-shadow')
      };

      var listener = function () {
        if (noFocus.backgroundColor.trim() !== $el.css('background-color').trim()) {
          element.blur();
          _case.set({
            status: 'passed'
          });
          return;
        }

        var borderWidth = ConvertToPxComponent($el.css('border-width'));
        if (borderWidth > 2 && borderWidth !== ConvertToPxComponent(noFocus.borderWidth)) {
          element.blur();
          _case.set({
            status: 'passed'
          });
          return;
        }

        var boxShadow = ($el.css('box-shadow') && $el.css('box-shadow') !== 'none') ? $el.css('box-shadow').match(/(-?\d+px)|(rgb\(.+\))/g) : false;
        if (boxShadow && $el.css('box-shadow') !== noFocus.boxShadow && ConvertToPxComponent(boxShadow[3]) > 3) {
          element.blur();
          _case.set({
            status: 'passed'
          });
          return;
        }
        element.blur();
        _case.set({
          status: 'failed'
        });

        element.removeEventListener('focus', listener, false);
      };
      // Focus needs to be triggered through a web driver protocol.
      element.addEventListener('focus', listener, false);
    });
  },

  meta: {
    title: {
      en: 'Focus indicators have high visibility',
      nl: 'Focus indicators moeten goed zichtbaar zijn'
    },
    description: {
      en: 'When a focus indicator is used, it should have enough contrast with the background and big enough to be highly visible.',
      nl: 'Wanneer je een focus indicator gebruikt, moet het contrast tussen de indicator en de achtergrond groot genoeg zijn in verband met de zichtbaarheid.'
    },
    guidelines: {
      wcag: {
        '2.4.7': {
          techniques: [
            'C15',
            'G165',
            'G195'
          ]
        }
      }
    },
    tags: [
      'focus',
      'content'
    ]
  }
};
module.exports = FocusIndicatorVisible;
