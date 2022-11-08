var _ = require('lodash'),
moment = require('moment'),
JsonReporterForAzureDevops;

const SEPARATOR = ' / ';

function getParentName (item, separator) {
    var chain = [];

	if (_.isEmpty(item) || !_.isFunction(item.parent) || !_.isFunction(item.forEachParent)) { 
		return; 
	}
	
    item.forEachParent(function (parent) { 
		chain.unshift(parent.name || parent.id); 
	});
    return chain.join(_.isString(separator) ? separator : SEPARATOR);
}

JsonReporterForAzureDevops = function (newman, reporterOptions, collectionRunOptions) {
    newman.on('beforeDone',function(){
        var executions = _.get(newman, 'summary.run.executions'),
		globalValues = _.get(newman, 'summary.globals.values.members', []),
		environmentValues = _.get(newman, 'summary.environment.values.members', []),
		testsuites=[];
		
        console.log(JSON.stringify(executions));
		var date = moment(new Date()).local().format('YYYY-MM-DDTHH:mm:ss.SSS');
        
		// Process executions (testsuites)
		_.forEach(executions, function (execution) {
			var testsuite ={};
			var failures = 0, errors = 0;
			var propertyValues = _.merge(environmentValues, globalValues);

			testsuite.package = getParentName(execution.item);
			testsuite.name = execution.item.name;

			if (execution.assertions) {
				testsuite.tests=execution.assertions.length;
			}
			else {
			 	testsuite.tests=0;
			 }
			testsuite.failures=failures;
			testsuite.errors = errors;
		
			_.forEach(['prerequestScript', 'assertions', 'testScript'], function (property) {
				_.forEach(execution[property], function (testExecution) {
					if(property === "assertions"){
						testsuite.assertions=execution[property];
					}
					
				});
			});
			testsuites.push(testsuite);
		});
		
        newman.exports.push({
            name: 'json-reporter-forazuredevops',
            default: 'resultsjsonazure.json',
            path: reporterOptions.export,
            content: JSON.stringify(testsuites,null,'\t')
        });
    });
  }

  module.exports = JsonReporterForAzureDevops;