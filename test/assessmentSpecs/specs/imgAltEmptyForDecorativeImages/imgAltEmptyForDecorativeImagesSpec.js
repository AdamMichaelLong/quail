describe('assessment: imgAltEmptyForDecorativeImages', function () {
  var client, assessments, quailResults;

  // Evaluate the test page with Quail.
  before('load webdrivers and run evaluations with Quail', function () {
    return quailTestRunner.setup({
        url: 'http://localhost:9999/imgAltEmptyForDecorativeImages/imgAltEmptyForDecorativeImages.html',
        assessments: [
          'imgAltEmptyForDecorativeImages'
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

  it('should return the correct number of tests', function () {
    expect(quailResults.stats.tests).to.equal(1);
  });
  it('should return the correct number of cases', function () {
    expect(quailResults.stats.cases).to.equal(0);
  });

  it('should have correct key under the test results', function () {
    expect(quailResults.tests).to.include.keys('imgAltEmptyForDecorativeImages');
  });

  it('should return the proper assessment for the test', function () {
    var cases = quailResults.tests['imgAltEmptyForDecorativeImages'].cases;
    expect(cases).quailGetById('assert-1').to.have.quailStatus('passed');
    expect(cases).quailGetById('assert-2').to.have.quailStatus('failed');
  });
});
