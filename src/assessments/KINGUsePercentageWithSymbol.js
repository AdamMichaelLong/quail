var GetTextContentsComponent = require('GetTextContentsComponent');
var Case = require('Case');
var KINGUsePercentageWithSymbol = {
  run: function (test) {
    function testPercentFormat (index, element) {
      // Detect dates with several separators.
      var percentName = [
        'percent',
        'pct\\.'
      ];
      // Test the words and any eventual extra letters for s and all.
      var percentReg = new RegExp('\\d{1,}\\s*(' + percentName.join('|') + ')|(' + percentName.join('|') + ')\\s*\\d{1,}', 'ig');

      var text = GetTextContentsComponent($(element));
      var _case = Case({
        element: this
      });
      test.add(_case);

      _case.set({
        status: percentReg.test(text) ? 'failed' : 'passed'
      });
    }
    test.get('$scope').find('p').each(testPercentFormat);
  },

  meta: {
replace: 'this'
  }
};
module.exports = KINGUsePercentageWithSymbol;
