quail.imgAltNotEmptyInAnchor = function(quail, test, Case) {
  test.get('$scope').find('a[href] img').each(function() {
    var $img  = $(this);
    var _case = Case({
      element: this,
      expected: $img.closest('.quail-test').data('expected')
    });
    test.add(_case);

    var $a   = $img.closest('a');
    var text = $a.text();
    $a.find('img[alt]').not(this).each(function () {
      text += ' ' + $(this).attr('alt');
    });

    if (quail.isUnreadable($(this).attr('alt')) &&
        quail.isUnreadable(text)) {
      _case.set({
        'status': 'failed'
      });
    }
    else {
      _case.set({
        'status': 'passed'
      });
    }
  });
};
