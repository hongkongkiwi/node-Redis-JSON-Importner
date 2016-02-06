Redis JSON Importer
===================

Simple node script designed to import json files from [redis-rdb-tools](https://github.com/sripathikrishnan/redis-rdb-tools).

It reads a JSON file and re-imports the data based on a few assumptions about the structure.

The following formats are read:
* SET - {'key':'value'}
* HSET {'hashkey':{'key':'value'}}
* SADD {'setname': {'value': true}}
* ZADD (COMING SOON!)

Export features will also be coming soon :-)

## License

redis-json-importer is licensed under the MIT License. See 
[LICENSE](https://github.com/hongkongkiwi/node-redis-json-importer/blob/master/LICENSE)

## Maintained By 

Andy Savage : @honkongkiwi

