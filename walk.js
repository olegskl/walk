/**
 * @fileOverview Async directory walker for Node.js with recursion control.
 * @license The MIT License (MIT).
 *    Copyright (c) 2012-2013 Oleg Sklyanchuk.
 *    http://opensource.org/licenses/mit-license.html
 * @author Oleg Sklyanchuk
 */

/*jslint node: true */

'use strict';

var fs = require('fs'), // filesystem
    pathJoin = require('path').join; // filepath helper

/**
 * Noop function.
 * @return {Undefined}
 */
function noop() {}

/**
 * Walks an item with a given worker and an optional callback.
 *
 * @param {String}   item         Full path of a folder or file.
 * @param {Function} worker       A worker function applied to every item the
 *                                walker steps on. The worker should return a
 *                                truthy value for sub-directories that are
 *                                to be walked.
 * @param {Function} callback     A callback function.
 * @param [Boolean]  ignoreWorker When truthy, ignores the worker function.
 *
 * @return {Undefined}
 */
function walk(item, worker, callback, ignoreWorker) {

    // Obtain the stats of the seed item to determine a way to handle it:
    fs.stat(item, function (error, stats) {

        // Interrupt on error:
        if (error) {
            callback(error);
            return;
        }

        // Do not proceed if the item doesn't match the criteria:
        // (any falsy value is acceptable)
        if (!ignoreWorker && !worker(item, stats)) {
            callback();
            return;
        }

        // There's nothing to do anymore if stepped on a non-directory item:
        if (!stats.isDirectory()) {
            return;
        }

        // Asynchronously read directory contents into memory, keeping in mind
        // that readdir provides a list of item names, not full paths:
        fs.readdir(item, function (error, itemNames) {

            // Cache variables for faster retreival:
            var i = 0, // item iteration identifier
                itemCount = 0, // directory items counter
                pending = 0; // keeps track of items

            // If failed to retrieve the list of directory items,
            // do not walk the directory and escalate the error object:
            if (error) {
                callback(error);
                return;
            }

            // It's now safe to refer to itemNames:
            pending = itemCount = itemNames.length;

            // If the directory is empty, do not walk it:
            if (itemCount === 0) {
                callback();
                return;
            }

            // A callback to be called for every item that has been walked:
            function itemWalkCallback(error) {
                if ((pending -= 1) === 0) {
                    callback(error);
                }
            }

            // Iterating through the items in the folder:
            for (i = 0; i < itemCount; i += 1) {
                walk(pathJoin(item, itemNames[i]), worker, itemWalkCallback);
            }

        });

    });
}

/**
 * Initiates walking a seed item with a given worker and an optional callback.
 *
 * @example walk('path/to/dir', worker, callback);
 *
 * @param {String}   item     Seed path of a folder or file.
 * @param {Function} worker   A worker function applied to every item the walker
 *                            steps on. The worker should return a truthy value
 *                            for sub-directories that are to be walked.
 * @param [Function] callback A callback function.
 *
 * @return {Undefined}
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