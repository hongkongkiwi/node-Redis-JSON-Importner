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
    })
    .options('d', {
        alias: 'dryrun',
        boolean: true,
        describe: "Do not actually import anything into redis, just show commands",
        default: false
    })
    .options('a', {
        alias: 'action',
        describe: "Whether to import or export",
        default: 'import'
    })
    .check(function(argv) {
        if (argv._.length === 0) throw 'No JSON file passed';
        var file = argv._[0];
        if (path.basename(file) === file) {
            file = path.join(__dirname,file);
        }
        try {
            fs.statSync(file);
        } catch (err) {
            if (err.errno === -2) {
                throw 'Invalid JSON file passed!';
            } else {
                throw err;
            }
        }
        var json = require(file);
        if (_.isEmpty(json)) {
            throw 'JSON file is empty!';
        } else if (!_.isObject(json)) {
            throw 'JSON file the wrong format!';
        }
        argv._[0] = file;
        argv.json = json;
        if (argv.action !== 'import' && argv.action !== 'export') throw 'Unknown Action! Must be "import" or "export"';
        return true;
    });

var argv = options.argv;
var json = argv.json;

client = redis.createClient();

client.on("error", function (err) {
    console.error("Error " + err);
    client.quit();
});

client.on('ready', function() {
    if (argv.action === 'import') {
        console.log('Reading JSON file ' + path.basename(argv._[0]));
        console.log('Found ' + json.length + ' db to import');
        console.log('------------------------------');

        var dbCounter = 0;
        _.each(json, function(data) {
            _.each(_.keys(data), function(key) {
                var value = data[key];
                if (_.isEmpty(value)) {
                    // Skip empty key
                    return;
                }
                // Assume List
                if (_.isArray(value)) {
                    _.each(value, function(item) {
                        if (argv.dryrun === false) {
                            client.lpush(key, item);
                        }
                        console.log('lpush "' + key + '" "' + item + '"');
                    });
                // Assume Hash, List or Sorted Set (NOT IMPLEMENTED)
                } else if (_.isObject(value)) {
                //     _.each(_.keys(value), function(item) {
                //         console.log('sadd "' + key + '" "' + item + '"');
                //     });
                    _.each(_.keys(value), function(itemKey) {
                        if (_.isString(value[itemKey])) {
                            var itemValue = value[itemKey];
                            if (argv.dryrun === false) {
                                client.hset(key, itemKey, itemValue);
                            }
                            console.log('hset "' + key + '" "' + itemKey + '" "' + itemValue + '"');
                        // Assume this is a sorted set
                        } else if (_.isNumber(value[itemKey])) {
                            var itemWeight = value[itemKey];
                            // Should be trivial to implement sorted set, most likely
                            // client.zadd(key, itemKey, itemWeight);
                            console.error('SORTED SET NOT IMPLEMENTED');
                        // Assume this is a set
                        } else if (_.isBoolean(value[itemKey])) {
                            if (argv.dryrun === false) {
                                client.sadd(key, itemKey);
                            }
                            console.log('sadd "' + key + '" "' + itemKey + '"');
                        } else {
                            console.error('UNKNOWN DATA TYPE: ' + value[itemKey]);
                        }
                    });
                // Assume String
                } else if (_.isString(value)) {
                    if (argv.dryrun === false) {
                        client.set(key, value);
                    }
                    console.log('set "' + key + '" "' + value + '"');
                }
            });
            dbCounter++;
        });

        client.quit();
        console.log('------------------------------');
        console.log('All JSON Data Processed!');
    } else {
        console.error('EXPORT ACTION NOT IMPLEMENTED!');
    }

    process.exit(0);
});
