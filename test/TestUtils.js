/**
 * @file A series of unit tests for the Utils class.
 */

import Utils from "../src/Utils.js";

import assert from "assert";
import path from "path";

const contentDirectory = path.resolve( "test/artefacts/content" );

const testPhotoDescriptionTags =
  "Mistakes were made, and many lessons learned. I made these shelves myself. #diy #proud";
const testPhotoDescriptionNoTags =
  "Mistakes were made, and many lessons learned. I made these shelves myself.";
const expectedTags = [
  "diy",
  "proud"
];
const expectedHashTags = [
  "#diy",
  "#proud"
];

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

  describe( "#getTags", function() {
    it( "should throw an error if the first parameter is not supplied", function() {
      assert.throws( function() {
        Utils.getTags();
      }, TypeError );
    } );

    it( "should throw an error if the first parameter is not a string", function() {

      assert.throws( function() {
        Utils.getTags( new Object() );
      }, TypeError );
    } );

    it( "should throw an error if the second parameter is not supplied", function() {

      assert.throws( function() {
        Utils.getTags( "" );
      }, TypeError );
    } );

    it( "should throw an error if the second parameter is not a boolean", function() {

      assert.throws( function() {
        Utils.getTags( testPhotoDescriptionTags, new Object() );
      }, TypeError );
    } );

    it( "should return an array with the right number of elements", function() {

      const tags = Utils.getTags( testPhotoDescriptionTags );
      assert.ok( Array.isArray( tags ) );
      assert.strictEqual( tags.length, expectedTags.length );
    } );

    it( "should return an array of tags without hashes", function() {

      let tags = Utils.getTags( testPhotoDescriptionTags );
      assert.ok( Array.isArray( tags ) );
      assert.strictEqual( tags.length, expectedTags.length );
      assert.deepStrictEqual( tags, expectedTags );

      tags = Utils.getTags( testPhotoDescriptionTags, true );
      assert.ok( Array.isArray( tags ) );
      assert.strictEqual( tags.length, expectedTags.length );
      assert.deepStrictEqual( tags, expectedTags );
    } );

    it( "should return an array of tags with hashes", function() {

      let tags = Utils.getTags( testPhotoDescriptionTags, false );
      assert.ok( Array.isArray( tags ) );
      assert.strictEqual( tags.length, expectedTags.length );
      assert.deepStrictEqual( tags, expectedHashTags );
    } );

    it( "should return an empty array if no tags are found", function() {

      let tags = Utils.getTags( testPhotoDescriptionNoTags, true );
      assert.ok( Array.isArray( tags ) );
      assert.strictEqual( tags.length, 0 );

      tags = Utils.getTags( testPhotoDescriptionNoTags, false );
      assert.ok( Array.isArray( tags ) );
      assert.strictEqual( tags.length, 0 );

    } );
  } );
} );
