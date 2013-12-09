/**
 * @fileOverview Asynchronous directory walker with recursion control.
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
 * Default callback function.
 * @return {Undefined}
 */
function defaultCallback(error) {
    if (error) { throw error; }
}

/**
 * Walks a path with a given worker and a callback.
 *
 * @param {String}   path         Full path of a folder or file.
 * @param {Function} worker       A worker function applied to every path the
 *                                walker steps on. The worker should return a
 *                                truthy value for sub-directories that are
 *                                to be walked.
 * @param {Function} callback     A callback function.
 * @param [Boolean]  ignoreWorker When truthy, ignores the worker function.
 *                                Note that this argument is not available in
 *                                the exported function.
 *
 * @return {Undefined}
 */
function walk(path, worker, callback, ignoreWorker) {

    // Obtain the stats of the seed path to determine a way to handle it:
    fs.stat(path, function (error, stats) {

        // Interrupt on error:
        if (error) {
            callback(error);
            return;
        }

        // Do not proceed if the path doesn't match the criteria:
        // (any falsy value is acceptable)
        if (!ignoreWorker && !worker(path, stats)) {
            callback();
            return;
        }

        // There's nothing to do anymore if stepped on a non-directory path:
        if (!stats.isDirectory()) {
            callback();
            return;
        }

        // Asynchronously read directory contents into memory, keeping in mind
        // that readdir provides a list of path names, not full paths:
        fs.readdir(path, function (error, pathNames) {

            // Cache variables for faster retreival:
            var i = 0, // path iteration identifier
                pathCount = 0, // directory paths counter
                pending = 0; // keeps track of paths

            // If failed to retrieve the list of directory paths,
            // do not walk the directory and escalate the error object:
            if (error) {
                callback(error);
                return;
            }

            // It's now safe to refer to pathNames:
            pending = pathCount = pathNames.length;

            // If the directory is empty, do not walk it:
            if (pathCount === 0) {
                callback();
                return;
            }

            // A callback to be called for every path that has been walked:
            function pathWalkCallback(error) {
                pending -= 1;
                if (!pending) {
                    callback(error);
                }
            }

            // Iterating through the paths in the folder:
            for (i = 0; i < pathCount; i += 1) {
                walk(pathJoin(path, pathNames[i]), worker, pathWalkCallback);
            }

        });

    });
}

/**
 * Initiates walking a seed path with a given worker and an optional callback.
 *
 * @example walk('path/to/dir', worker, callback);
 *
 * @param {String}   path     Seed path of a folder or file.
 * @param {Function} worker   A worker function applied to every path the walker
 *                            steps on. The worker should return a truthy value
 *                            for sub-directories that are to be walked.
 * @param [Function] callback A callback function.
 *
 * @return {Undefined}
 */
module.exports = function (path, worker, callback) {

    // If callback is not defined, assign a defaultCallback to it:
    if (typeof callback !== 'function') {
        callback = defaultCallback;
    }

    // Validate path before passing it to fs.stat:
    if (typeof path !== 'string') {
        callback(new TypeError('Expected path to be a String. ' + typeof path +
            ' given.'));
        return;
    }

    // Do not initiate walking without a valid worker:
    if (typeof worker !== 'function') {
        callback(new TypeError('Expected worker to be a Function. ' +
            typeof worker + ' given.'));
        return;
    }

    // Start walking, but force the worker to ignore the seed path:
    walk(path, worker, callback, true);

};