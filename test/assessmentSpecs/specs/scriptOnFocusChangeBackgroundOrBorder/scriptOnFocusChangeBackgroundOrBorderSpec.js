describe('assessment: scriptOnFocusChangeBackgroundOrBorder', function () {
  var client, assessments, quailResults, cases;

  // Evaluate the test page with Quail.
  before('load webdrivers and run evaluations with Quail', function () {
    return quailTestRunner.setup({
        url: 'http://localhost:9999/scriptOnFocusChangeBackgroundOrBorder/scriptOnFocusChangeBackgroundOrBorder.html',
        assessments: [
          'scriptOnFocusChangeBackgroundOrBorder'
        ]
      })
      .spread(function (_client_, _assessments_, _quailResults_) {
        client = _client_;
        assessments = _assessments_;
        quailResults = _quailResults_;
        cases = quailResults.tests['scriptOnFocusChangeBackgroundOrBorder'].cases;
        debugger;
      });
  });

  after('end the webdriver session', function () {
    return quailTestRunner.teardown(client);
  });

  it('should return the correct number of tests', function () {
    expect(quailResults.stats.tests).to.equal(1);
  });
  it('should return the correct number of cases', function () {
    expect(quailResults.stats.cases).to.equal(3);
  });

  it('should have correct key under the test results', function () {
    expect(quailResults.tests).to.include.keys('scriptOnFocusChangeBackgroundOrBorder');
  });

  it('should return the proper assessment for assert-1', function () {
    expect(cases).quailGetById('assert-1').to.have.quailStatus('passed');
  });
  it('should return the proper assessment for assert-2', function () {
    expect(cases).quailGetById('assert-2').to.have.quailStatus('passed');
  });
  it('should return the proper assessment for assert-3', function () {
    expect(cases).quailGetById('assert-3').to.have.quailStatus('failed');
  });
});
