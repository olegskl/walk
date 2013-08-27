# walk #

Asynchronous directory walker with recursion control.

## Installation ##

    npm install git://github.com/olegskl/walk.git

or in package.json as a dependency:

    "dependencies": {
        "walk": "git://github.com/olegskl/walk.git"
    }

## Usage example ##

    var walk = require('walk');
    
    // The worker is a function applied to every item the walker steps on;
    // it receives two arguments:
    // 1. path - a full path of an item the walker steps on
    // 2. stats - an fs.Stats object of the item,
    //    see http://nodejs.org/api/fs.html#fs_class_fs_stats
    function worker(path, stats) {
        if (stats.isDirectory() && path.substr(-4) === '1337') {
            console.info('Descend into "%s" because it ends with "1337"', path);
            return true;
        }
        if (stats.isFile() && /\.txt$/.test(path)) {
            console.info('Stepped on "%s" because it ends with ".txt"', path);
            // Do something with the file here,
            // maybe pass to a processing queue?..
        }
    }
    
    // The callback is called when all items have been walked:
    function callback(err) {
        if (err) {
            console.error(err);
        }
        console.timeEnd('Walk finished; time spent');
    }
    
    console.time('Walk finished; time spent');
    walk('path/to/dir', worker, callback);

## Tests ##

If [Mocha](https://github.com/visionmedia/mocha) is not installed:

    npm install

Use any of the following to run the test suite:

    mocha
<!-- -->
    npm test
<!-- -->
    make test

## License ##

http://opensource.org/licenses/mit-license.html
