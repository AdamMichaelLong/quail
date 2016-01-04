var CleanStringComponent = require('CleanStringComponent');
var Case = require('Case');
const DOM = require('DOM');
var RedundantStringsComponent = require('RedundantStringsComponent');
var InputImageAltNotRedundant = {
  run: function (test) {
    test.get('scope').forEach(function (scope) {
      DOM.scry('input[type=image][alt]', scope).forEach(function (element) {
        var _case = Case({
          element: element
        });
        test.add(_case);
        if (RedundantStringsComponent.inputImage.indexOf(CleanStringComponent(DOM.getAttribute(element, 'alt'))) > -1) {
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
    testability: 1,
    title: {
      en: 'The \"alt\" text for input \"image\" submit buttons must not be filler text',
      nl: 'De \"alt\"-tekst for \"image\"-knoppen moet anders zijn dan alleen placeholdertekst'
    },
    description: {
      en: 'Every form image button should not simply use filler text like \"button\" or \"submit\" as the \"alt\" text.',
      nl: 'Elke formulierknop die een afbeelding is, moet bruikbare tekst als \"alt\"-tekst hebben, anders dan \"knop\" of \"verstuur\".'
    },
    guidelines: {
      wcag: {
        '1.1.1': {
          techniques: [
            'H36'
          ]
        }
      }
    },
    tags: [
      'form',
      'image',
      'content'
    ]
  }
};
module.exports = InputImageAltNotRedundant;
