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

}
