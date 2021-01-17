/**
 * @file A series of unit tests for the Utils class.
 */

import Utils from "../src/Utils.js";

import assert from "assert";
import path from "path";

const contentDirectory = path.resolve( "test/artefacts/content" );

describe( "Utils", function() {

  describe( "#testDirPath", function() {
    it( "should throw an error if the parameter is not supplied", function() {
      assert.throws(
        function() {
          Utils.testDirPath();
        },
        {
          name: "TypeError",
          message: /^dirPath parameter is required/
        }
      );
    } );

    it( "should throw an error if the parameter is not a string", function() {
      assert.throws(
        function() {
          Utils.testDirPath();
        },
        {
          name: "TypeError",
          message: /^dirPath parameter is required.*must be a string$/
        }
      );
    } );

    it( "should throw an error if the parameter is a path to a file", function() {
      assert.throws(
        function() {
          Utils.testDirPath( path.join( contentDirectory, "./photos/.gitinclude" ) );
        },
        {
          name: "TypeError",
          message: "specified path must be a directory"
        }
      );
    } );

    it( "should throw an error if the path cannot be found", function() {
      assert.throws(
        function() {
          Utils.testDirPath( path.join( contentDirectory, "./photos/not-found.txt" ) );
        },
        {
          name: "TypeError",
          message: "specified path not found"
        }
      );
    } );

    it( "should not throw an error if the path is a directory", function() {
      assert.doesNotThrow(
        function() {
          Utils.testDirPath( contentDirectory );
        }
      );
    } );

    it( "should return true if path is a directory", function() {
      assert.ok( Utils.testDirPath( contentDirectory ) );
    } );
  } );

  describe( "#testFilePath", function() {
    it( "should throw an error if the parameter is not supplied", function() {
      assert.throws(
        function() {
          Utils.testFilePath();
        },
        {
          name: "TypeError",
          message: /^filePath parameter is required/
        }
      );
    } );

    it( "should throw an error if the parameter is not a string", function() {
      assert.throws(
        function() {
          Utils.testFilePath();
        },
        {
          name: "TypeError",
          message: /^filePath parameter is required.*must be a string$/
        }
      );
    } );

    it( "should throw an error if the parameter is a path to a directory", function() {
      assert.throws(
        function() {
          Utils.testFilePath( path.join( contentDirectory, "./photos/" ) );
        },
        {
          name: "TypeError",
          message: "specified path must be a file"
        }
      );
    } );

    it( "should throw an error if the path cannot be found", function() {
      assert.throws(
        function() {
          Utils.testFilePath( path.join( contentDirectory, "./photos/not-found.txt" ) );
        },
        {
          name: "TypeError",
          message: "specified path not found"
        }
      );
    } );

    it( "should not throw an error if the path is a file", function() {
      assert.doesNotThrow(
        function() {
          Utils.testFilePath( path.join( contentDirectory, "./photos/.gitinclude" ) );
        }
      );
    } );

    it( "should return true if the path is a file", function() {
      assert.ok(
        Utils.testFilePath( path.join( contentDirectory, "./photos/.gitinclude" ) )
      );
    } );
  } );
} );
