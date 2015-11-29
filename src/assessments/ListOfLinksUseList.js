var Case = require('Case');
var IsUnreadable = require('IsUnreadable');
var ListOfLinksUseList = {
  run: function (test) {
    var unreadableText = /(♦|›|»|‣|▶|.|◦|>|✓|◽|•|—|◾|\||\*|&bull;|&#8226;)/g;
    test.get('$scope').find('a').each(function () {
      var _case = test.add(Case({
        element: this
      }));
      // Only test if there's another a tag.
      if ($(this).next('a').length) {
        var nextText = $(this).get(0).nextSibling.wholeText.replace(unreadableText, '');
        if (!$(this).parent('li').length && IsUnreadable(nextText)) {
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
replace: 'this'
  }
};
module.exports = ListOfLinksUseList;
