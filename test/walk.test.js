/**
 * @fileOverview Unit test suite for walk.js.
 * @license The MIT License (MIT).
 *    Copyright (c) 2013 Oleg Sklyanchuk.
 *    http://opensource.org/licenses/mit-license.html
 * @author Oleg Sklyanchuk
 */

/*jslint node: true */
/*global describe, it */

// Test directory structure:
// -------------------------
// foo/
//   ↳ a/
//      ↳ g
//      ↳ h
//      ↳ i
//      ↳ j
//      ↳ k
//      ↳ l
//   ↳ b/
//      ↳ m
//      ↳ n
//      ↳ o
//      ↳ p
//      ↳ q
//      ↳ r
//   ↳ c/
//      ↳ s
//      ↳ t
//      ↳ u
//      ↳ v
//      ↳ w
//      ↳ x
//      ↳ y
//      ↳ z
//   ↳ d
//   ↳ e
//   ↳ f
// -------------------------

'use strict';

var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    walk = require('../walk.js'),
    validPath = path.resolve(__dirname, 'foo');

/**
 * A function that always returns true.
 * @return {Boolean} TRUE
 */
function truthy() {
    return true;
}

describe('walk', function () {

    it('should be a function', function () {
        assert.strictEqual('function', typeof walk);
    });


    it('should throw when called with no arguments', function () {
        assert.throws(walk);
    });

    it('should throw when called with invalid arguments', function () {
        assert.throws(function () {
            walk(undefined, 'not-a-function', 'not-a-function');
        });
    });

    it('should not throw when called with valid path and worker but invalid ' +
        'callback', function () {
            assert.doesNotThrow(function () {
                walk(validPath, truthy, 'not-a-function');
            });
        });

    it('should callback with TypeError if path is not a String', function () {
        function callback(error) {
            assert(error && error instanceof TypeError);
        }

        [undefined, null, true, 42, NaN, {}, [], /o/].forEach(function (value) {
            walk(value, truthy, callback);
        });
    });

    it('should not run worker if path is invalid', function (done) {
        var workerHasRun = false;

        function worker() {
            workerHasRun = true;
        }

        function callback() {
            assert.strictEqual(false, workerHasRun);
            done();
        }

        walk('skjhfalsd', worker, callback);
    });

    it('should walk all except seed if worker returns true', function (done) {
        var visited = [],
            valid = 'abcdefghijklmnopqrstuvwxyz';

        function worker(item) {
            visited.push(path.basename(item));
            return true;
        }

        function callback() {
            assert.strictEqual(valid, visited.sort().join(''));
            done();
        }

        walk(validPath, worker, callback);
    });

    it('should pass valid and existing path to worker', function (done) {
        function worker(item) {
            assert.strictEqual('string', typeof item);
            assert(fs.existsSync(item));
            return true;
        }

        walk(validPath, worker, done);
    });

    it('should pass valid stats to worker', function (done) {
        function worker(item, stats) {
            assert(stats instanceof fs.Stats);
            return true;
        }

        walk(validPath, worker, done);
    });

    it('should walk one dir level if worker returns false', function (done) {
        var visited = [],
            valid = 'abcdef';

        function worker(item) {
            visited.push(path.basename(item));
            return false;
        }

        function callback() {
            // The order is not guaranteed, hence sort:
            assert.strictEqual(valid, visited.sort().join(''));
            done();
        }

        walk(validPath, worker, callback);
    });

    it('should not read folders where worker returns false', function (done) {
        var visited = [],
            valid = 'abcdefmnopqr';

        function worker(item, stats) {
            item = path.basename(item);
            visited.push(item);
            // only descend into b/
            if (stats.isDirectory() && item === 'b') {
                return true;
            }
        }

        function callback() {
            // The order is not guaranteed, hence sort:
            assert.strictEqual(valid, visited.sort().join(''));
            done();
        }

        walk(validPath, worker, callback);
    });

});