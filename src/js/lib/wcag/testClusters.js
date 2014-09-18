quail.lib.wcag2.TestCluster = (function () {
	var defaultAssert = {
		// type: 'assert',
		// subject: '',
		// assertedBy: '',
		// mode: 'automated'
	};

	var resultPrioMap = [
		'untested', 'notApplicable', 'passed',
		'cantTell', 'failed'
	];


	/**
	 * Get an array of elements common to all tests provided
	 * @param  {Object} tests
	 * @return {Array}        Array of HTML elements
	 */
	function getCommonElements(tests) {
		var common = [],
		map = [];

		$.each(tests, function (i, test) {
			var elms = [];
			test.each(function () {
				elms.push(this.get('element'));
			});
			map.push(elms);
		});
		$.each(map, function (i, arr) {
			if (i === 0) {
				common = arr;
				return;
			}
			var newArr = [];
			$.each(arr, function (i, val) {
				if (common.indexOf(val) !== -1) {
					newArr.push(val);
				}
			});
			common = newArr;
		});
		return common;
	}

	/**
	 * Run the callback for each testcase within the array of tests
	 * @param  {array}   tests    
	 * @param  {Function} callback Given the parameters (test, testcase)
	 */
	function eachTestcase(tests, callback) {
		$.each(tests, function (i, test) {
			test.each(function () {
				callback.call(this, test, this);
			});
		});
	}


	/**
	 * Look at each unique element and create an assert for it
	 * @param  {array[DOM element]} elms
	 * @param  {object} base Base object for the assert
	 * @return {array[assert]}      Array with asserts
	 */
	function createAssertForEachElement(elms, base) {
		var asserts = [];
		// Create asserts for each element
		$.each(elms, function (i, elm) {
			var assert = $.extend(base, defaultAssert);

			if (elm) { // Don't do undefined pointers
				assert.outcome.pointer = elm;
			}
			asserts.push(assert);
		});
		return asserts;
	}
	
	/**
	 * Return the priorty index of the result
	 * @param  {result|assert|outcome} val
	 * @return {integer}     Result index in order of prioerty
	 */
	function getResultPrio(val) {
		if (typeof val === 'object') {
			if (val.outcome) {
				val = val.outcome.result;
			} else {
				val = val.result;
			}
		}
		return resultPrioMap.indexOf(val);
	}


	/**
	 * Combine the test results of a cluster into asserts
	 * @param  {Object} cluster
	 * @param  {Array[Object]} tests
	 * @return {Array[Object]}         Array of Asserts
	 */
	function getCombinedAsserts(cluster, tests) {
		var elms = getCommonElements(tests),
		asserts = createAssertForEachElement(elms, {
			testCase: cluster.id,
			outcome: {result: 'failed'}
		});

		// Iterate over all results to build the assert
		eachTestcase(tests, function (test, testcase) {
			// Look up the assert, if any
			var newResult = testcase.get('status'),
			assert = asserts[elms.indexOf(
				testcase.get('element')
			)];

			// Allow the cluster to override the results
			if (cluster[newResult]) {
				newResult = cluster[newResult];
			}

			// Override if the resultId is higher or equal (combine)
			if (assert && getResultPrio(assert) >= getResultPrio(newResult)) {
				assert.outcome = {
					result: newResult,
					info: test.get('title')
				};
			}
		});

		return asserts;
	}


	/**
	 * Stack the test results of a cluster into asserts
	 * @param  {Object} cluster
	 * @param  {Array[Object]} tests
	 * @return {Array[Object]}         Array of Asserts
	 */
	function getStackedAsserts(cluster, tests) {
		var elms = getCommonElements(tests),
		asserts = createAssertForEachElement(elms, {
			testCase: cluster.id,
			outcome: { result: 'untested'}
		});

		// Iterate over all results to build the assert
		eachTestcase(tests, function (test, testcase) {
			// Look up the assert, if any
			var newResult = testcase.get('status'),
			assert = asserts[elms.indexOf(
				testcase.get('element')
			)];

			// Allow the cluster to override the results
			if (cluster[newResult]) {
				newResult = cluster[newResult];
			}

			// Override if the resultId is lower (stacked)
			if (assert && getResultPrio(assert) < getResultPrio(newResult)) {
				assert.outcome = {
					result: newResult,
					info: test.get('title')
				};
			}
		});
		return asserts;
	}


	function constructor(config, testDefinitions) {
		var cluster = $.extend({
			id: config.tests.join('+')
		}, config);


		cluster.tests = $.map(cluster.tests, function (test) {
			return testDefinitions[test];
		});

		/**
		 * Filter the data array so it only contains results 
		 * from this cluster
		 * @param  {Array} data
		 * @return {Array}
		 */
		cluster.filterDataToTests = function (data) {
			var names = $.map(cluster.tests, function (test) {
				return test.name;
			}),
			testData = [];

			$.each(data, function (i, result) {
				if (names.indexOf(result.get('name')) !== -1) {
					testData.push(result);
				}
			});
			return testData;
		};

		cluster.getResults = function (tests) {
			var asserts;
			tests = cluster.filterDataToTests(tests);

			if (tests.length === 1 || cluster.type === 'combined') {
				asserts = getCombinedAsserts(cluster, tests);

			} else if (cluster.type === "stacking") {
				asserts = getStackedAsserts(cluster, tests);
				
			} else if (window) {
				window.console.error(
					"Unknown type for cluster " +cluster.id
				);
			}

			// Return a default assert if none was defined
			if (asserts) {
				if (asserts.length === 0) {
					asserts.push($.extend({
						testCase: cluster.id,
						outcome: {
							result: 'notApplicable'
						}
					}, defaultAssert));
				}
				return asserts;
			}
		};

		return cluster;
	}

	return constructor;
}());