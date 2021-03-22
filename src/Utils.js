/**
 * @file A class containing various utility functions.
 */
import { lstatSync } from "fs";

/**
 * A class that contains various utility functions.
 */
export default class Utils {

  /**
   * Test the given path to ensure it is a directory.
   *
   * @param {string} dirPath The path to a directory for testing.
   * @throws {TypeError} When the path cannot be found, read, or is not a directory.
   *
   * @returns {boolean} True if the path passed the test.
   */
  static testDirPath( dirPath ) {

    if ( !dirPath || typeof dirPath !== "string" ) {
      throw new TypeError( "dirPath parameter is required and must be a string" );
    }

    try {
      if ( !lstatSync( dirPath ).isDirectory() ) {
        throw new TypeError( "specified path must be a directory" );
      }
    } catch ( e ) {

      // Handle error.
      if ( e.code === "ENOENT" ) {
        throw new TypeError( "specified path not found" );
      } else {
        throw e;
      }
    }

    return true;
  }

  /**
   * Test the given path to ensure it is a file.
   *
   * @param {string} filePath The path to a directory for testing.
   * @throws {TypeError} When the path cannot be found, read, or is not a directory.
   *
   * @returns {boolean} True if the path passed the test.
   */
  static testFilePath( filePath ) {

    if ( !filePath || typeof filePath !== "string" ) {
      throw new TypeError( "filePath parameter is required and must be a string" );
    }

    try {
      if ( !lstatSync( filePath ).isFile() ) {
        throw new TypeError( "specified path must be a file" );
      }
    } catch ( e ) {

      // Handle error.
      if ( e.code === "ENOENT" ) {
        throw new TypeError( "specified path not found" );
      } else {
        throw e;
      }
    }

    return true;
  }

  /**
   * Get a list of tags from a peice of text.
   *
   * @param {string} text The text including the hash tags.
   * @param {boolean} stripHash A boolean flag to strip the hashes from tags or not.
   *
   * @returns {Array} An array of tags found in the description.
   *
   * @throws {TypeError} If the parameters do not pass validation.
   */
  static getTags( text, stripHash = true ) {
    if ( !text || typeof text !== "string" ) {
      throw new TypeError( "text parameter is required and must be a string" );
    }

    if ( typeof stripHash !== "boolean" ) {
      throw new TypeError( "stripHash parameter is required and must be a boolean" );
    }

    const tagsRegEx = new RegExp( "#+([a-zA-Z0-9_]+)", "g" );

    let matches = text.matchAll( tagsRegEx );

    let tags = new Array();

    if ( stripHash === true ) {
      for ( const match of matches ) {
        tags.push( match[ 1 ] );
      }
    } else {
      for ( const match of matches ) {
        tags.push( match[ 0 ] );
      }
    }

    return tags;
  }

}
