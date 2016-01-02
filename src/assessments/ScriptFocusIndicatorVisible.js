var ConvertToPxComponent = require('ConvertToPxComponent');
var FocusElements = require('FocusElements');

var ScriptFocusIndicatorVisible = {
  run: function () {
    FocusElements.forEach(function (element) {

      // Preparation for test: remove focus indicators done with CSS
      var sheet, rules, rulesCache, rule;

      rulesCache = [];

      for (var i = 0, l = document.styleSheets.length; i < l; ++i) {
        sheet = document.styleSheets[i];
        rules = sheet.cssRules || sheet.rules;

        for (var j = rules.length - 1; j >= 0; --j) {
          rule = rules[j];
          if (rule.selectorText && rule.selectorText.indexOf(':focus') !== -1) {
            rulesCache.push({
              css: rule.cssText,
              index: j,
              sheet: i
            });

            sheet.deleteRule(j);
          }
        }
      }

      var noFocus = {
        borderWidth: DOM.getComputedStyle(element, 'border-width'),
        borderColor: DOM.getComputedStyle(element, 'border-color'),
        backgroundColor: DOM.getComputedStyle(element, 'background-color'),
        boxShadow: DOM.getComputedStyle(element, 'box-shadow'),
        outlineWidth: DOM.getComputedStyle(element, 'outline-width'),
        outlineColor: DOM.getComputedStyle(element, 'outline-color')
      };

      element.focus();

      // it is sufficient to not remove the default outline on focus: pass test
      var outlineWidth = ConvertToPxComponent(DOM.getComputedStyle(element, 'outline-width'));
      if (outlineWidth > 2 && outlineWidth !== ConvertToPxComponent(noFocus.outlineWidth)) {
        element.blur();
        return;
      }

      // in any other case, it is acceptable to change other visual components

      if (noFocus.backgroundColor !== DOM.getComputedStyle(element, 'background-color')) {
        element.blur();
        return;
      }

      var borderWidth = ConvertToPxComponent(DOM.getComputedStyle(element, 'border-width'));
      if (borderWidth > 2 && borderWidth !== ConvertToPxComponent(noFocus.borderWidth)) {
        element.blur();
        return;
      }

      var boxShadow = (DOM.getComputedStyle(element, 'box-shadow') && DOM.getComputedStyle(element, 'box-shadow') !== 'none') ? DOM.getComputedStyle(element, 'box-shadow').match(/(-?\d+px)|(rgb\(.+\))/g) : false;
      if (boxShadow && DOM.getComputedStyle(element, 'box-shadow') !== noFocus.boxShadow && ConvertToPxComponent(boxShadow[3]) > 3) {
        element.blur();
        return;
      }

      element.blur();

      var ruleCache;

      for (var k = rulesCache.length - 1; k >= 0; --i) {
        ruleCache = rulesCache[k];

        document.styleSheets[ruleCache.sheet].insertRule(ruleCache.css, ruleCache.index);
      }
    });
  },

  meta: {
    title: {
      en: 'Script focus indicators have high visibility',
      nl: 'Script focus indicatoren zijn goed zichtbaar'
    },
    description: {
      en: 'When a focus indicator is used with script, it should have enough contrast with the background and big enough to be highly visible.',
      nl: 'Wanneer je een focus indicator gebruikt met script, moet het contrast tussen de indicator en de achtergrond groot genoeg zijn in verband met de zichtbaarheid.'
    },
    guidelines: {
      wcag: {
        '2.4.7': {
          techniques: [
            'C15',
            'G165',
            'G195',
            'SCR31'
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
module.exports = ScriptFocusIndicatorVisible;
