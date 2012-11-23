/**
 * @license The MIT License (MIT).
 *    Copyright (c) 2012 Oleg Sklyanchuk.
 *    http://opensource.org/licenses/mit-license.html
 * @fileOverview Async directory walker for Node.js with recursion control.
 * @author Oleg Sklyanchuk
 * @version 0.2.0
 */

// JSLint directives:
/*jslint node: true */

// ECMAScript 5 strict mode:
'use strict';

var fs = require('fs'), // filesystem
    pathJoin = require('path').join; // filepath helper

/**
 * Noop function.
 * @private
 */

function noop() {}

/**
 * Walks an item with a given worker and an optional callback.
 *
 * @private
 *
 * @param {String} item Full path of a folder or file.
 * @param {Function} worker A worker function applied to every item the walker
 *    steps on. The worker should return a truthy value for sub-directories that
 *    are to be walked.
 * @param {Function} callback A callback function.
 * @param [Boolean] callback A callback function.
 *
 * @returns {Undefined}
 */

function walk(item, worker, callback, ignoreWorker) {

    // Obtain the stats of the seed item to determine a way to handle it:
    fs.stat(item, function (err, stats) {

        // Interrupt on error:
        if (err) {
            callback(err);
            return;
        }

        // Do not proceed if the item doesn't match the criteria:
        // (any falsy value is acceptable)
        if (!ignoreWorker && !worker(item, stats)) {
            callback();
            return;
        }

        // When the walker steps on directories:
        // 1. Read the directory contents into memory;
        // 2. Walk across the directory contents;
        if (stats.isDirectory()) {

            // Asynchronously read directory contents into memory, keeping in
            // mind that readdir provides a list of item names, not full paths:
            fs.readdir(item, function (err, itemNames) {

                // Cache variables for faster retreival:
                var i = 0, // item iteration identifier
                    itemCount = itemNames.length, // count of items in directory
                    pending = itemCount, // keeps track of items in async mode
                    itemPath; // placeholder for full item path

                // If failed to retrieve the list of directory items,
                // do not walk the directory and escalate the error object:
                if (err) {
                    callback(err);
                    return;
                }

                // If the directory is empty, do not walk it:
                if (itemCount === 0) {
                    callback();
                    return;
                }

                // A callback to be called for every item that has been walked:
                function itemWalkCallback(err) {
                    if ((pending -= 1) === 0) {
                        callback(err);
                    }
                }

                // Iterating through the items in the folder:
                for (i = 0; i < itemCount; i += 1) {
                    itemPath = pathJoin(item, itemNames[i]);
                    walk(itemPath, worker, itemWalkCallback);
                }

            });

        }

    });
}

/**
 * Initiates walking a seed item with a given worker and an optional callback.
 *
 * @example walk('path/to/dir', worker, callback);
 *
 * @param {String} item Seed path of a folder or file.
 * @param {Function} worker A worker function applied to every item the walker
 *    steps on. The worker should return a truthy value for sub-directories that
 *    are to be walked.
 * @param [Function] callback A callback function.
 *
 * @returns {Undefined}
 */

module.exports = function (item, worker, callback) {

    // Do not initiate walking without a valid worker:
    if (typeof worker !== 'function') {
        callback('worker not defined');
        return;
    }

    // If callback is not defined, assign a noop to it:
    if (typeof callback !== 'function') {
        callback = noop;
    }

    // Start walking, but force the worker to ignore the seed item:
    walk(item, worker, callback, true);

};