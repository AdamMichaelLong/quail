describe('assessment: aMustHaveTitle', function () {
  var client, assessments, quailResults, cases;

  // Evaluate the test page with Quail.
  before('load webdrivers and run evaluations with Quail', function () {
    return quailTestRunner.setup({
        url: 'http://localhost:9999/aMustHaveTitle/aMustHaveTitle.html',
        assessments: [
          'aMustHaveTitle'
        ]
      })
      .spread(function (_client_, _assessments_, _quailResults_) {
        client = _client_;
        assessments = _assessments_;
        quailResults = _quailResults_;
      });
  });

  after('end the webdriver session', function () {
    return quailTestRunner.teardown(client);
  });

  it('should return the correct stats', function () {
    expect(quailResults.stats.tests).to.equal(1);
    expect(quailResults.stats.cases).to.equal(2);
  });

  it('should have correct key under the test results', function () {
    expect(quailResults.tests).to.include.keys('aMustHaveTitle');
  });

  it('should return the proper assessment for assert-1', function () {
    cases = quailResults.tests['aMustHaveTitle'].cases;
    expect(cases).quailGetById('assert-1').to.have.quailStatus('passed');
  });
});
