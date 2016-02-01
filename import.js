#!/usr/bin/env node
var path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    redis = require("redis");

var options = require('optimist')
    .usage('Import a JSON file into redis.\nUsage: ' + path.basename(__filename) + ' <data.json>')
    .options('u', {
        alias: 'redisurl',
        describe: "connect url for redis",
        default: 'redis://localhost:6379'
    });
var argv = options.argv;

if (argv._.length === 0) {
    console.log(options.help());
    console.log('No JSON file passed');
    process.exit(1);
}

var file = argv._[0];
if (path.basename(file) === file) {
    file = path.join(__dirname,file);
}

try {
    fs.statSync(file);
} catch (err) {
    if (err.errno === -2) {
        console.log(options.help());
        console.log('Invalid JSON file passed!');
    } else {
        console.error('ERROR: Error getting stats for file!');
        console.error(err);
    }
    process.exit(1);
}

var json = require(file);

if (_.isEmpty(json)) {
    console.log(options.help());
    console.log('JSON file is empty!');
    process.exit(1);
} else if (!_.isObject(json)) {
    console.log(options.help());
    console.log('JSON file the wrong format!');
    process.exit(1);
}

var data = json[1];

client = redis.createClient();

client.on("error", function (err) {
    console.error("Error " + err);
    client.quit();
});

client.on('ready', function() {
    console.log('Reading JSON file ' + path.basename(file));
    console.log('------------------------------');

    _.each(_.keys(data), function(key) {
        var value = data[key];
        if (_.isEmpty(value)) {
            // Skip empty key
            return;
        }
        // Assume Set
        if (_.isArray(value)) {
            _.each(value, function(item) {
                if (!argv.dryrun) {
                    client.sadd(key, item);
                }
                console.log('sadd "' + key + '" "' + item + '"');
            });
        // Assume Hash, List or Sorted Set (NOT IMPLEMENTED)
        } else if (_.isObject(value)) {
        //     _.each(_.keys(value), function(item) {
        //         console.log('sadd "' + key + '" "' + item + '"');
        //     });
            console.log('NOT IMPLEMENTED FOR THIS TYPE');
        // Assume String
        } else if (_.isString(value)) {
            if (!argv.dryrun) {
                client.set(key, value);
            }
            console.log('set "' + key + '" "' + value + '"');
        }
    });

    client.quit();
    console.log('------------------------------');
    console.log('All JSON Data Processed!');

    process.exit(0);
});
