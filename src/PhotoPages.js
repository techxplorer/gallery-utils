/**
 * @file The main class for the photo-pages command.
 */

import { promises as fs } from "fs";
import path from "path";

import Exifr from "exifr";
import fg from "fast-glob";
import logSymbols from "log-symbols";
import toml from "@iarna/toml";

import Utils from "./Utils.js";

/**
 * A class that undertakes tasks necessary for the photo-pages command.
 */
export default class PhotoPages {

  /**
   * Construct a new PhotoPages command object.
   *
   * @param {string} inputPath The full path to the input directory.
   * @throws {TypeError} When the inputPath is not a string that contains a path to the input directory.
   * @since 1.0.0
   */
  constructor( inputPath ) {
    if ( !inputPath || typeof inputPath !== "string" ) {
      throw new TypeError( "inputPath parameter is required and must be a string" );
    }

    this.inputPath = inputPath;

    // Basic validation of the input path.
    try {
      Utils.testDirPath( this.inputPath );
    } catch ( e ) {
      throw new TypeError( "inputPath parameter must be a directory" );
    }

    this.albumsPath = path.join( inputPath, "/albums/" );

    // Basic validation of the album path
    try {
      Utils.testDirPath( this.albumsPath );
    } catch ( e ) {
      throw new TypeError( "inputPath must contain an 'albums' subdirectory" );
    }

    this.photosPath = path.join( inputPath, "/photos/" );

    // Basic validation of the album path
    try {
      Utils.testDirPath( this.photosPath );
    } catch ( e ) {
      throw new TypeError( "inputPath must contain a 'photos' subdirectory" );
    }

    // Ensure paths use '/' as path seperators so that globbing etc works.
    this.albumsPath = this.albumsPath.split( path.sep ).join( path.posix.sep );
    this.photosPath  = this.photosPath.split( path.sep ).join( path.posix.sep );

  }

  /**
   * Get an array of all of the photos in the album directory.
   *
   * @returns {Array} An array of paths to photos in albums.
   */
  async getAlbumPhotos() {
    let albumPhotos = new Array();

    albumPhotos = await fg( this.albumsPath + "**/*.jpg" );

    return albumPhotos;
  }

  /**
   * Parse the photo file name and get the photo diretory name.
   *
   * @param {string} photoFileName The raw photo file name.
   * @returns {string} A properly formatted directed name.
   * @throws {TypeError} If the parameter is missing or is not a string.
   */
  getPhotoName( photoFileName ) {
    if ( !photoFileName || typeof photoFileName !== "string" ) {
      throw new TypeError( "photoFileName parameter is required and must be a string" );
    }

    const regExp = /\d{8}-\d{6}/;

    const fileName = path.basename( photoFileName, ".jpg" );
    const match = regExp.exec( fileName );

    if ( !Array.isArray( match ) || match.length !== 1 ) {
      return null;
    } else {
      return match[ 0 ];
    }
  }

  /**
   * Build a map, indexed by photo name, of each photo in an album.
   *
   * @param {Array} albumPhotos An array of paths to photos in albums.
   * @returns {Map} A map of each photo in an album.
   * @throws {TypeError} If the parameter is missing or is not an array.
   */
  buildAlbumMap( albumPhotos ) {
    if ( !albumPhotos || Array.isArray( albumPhotos ) === false ) {
      throw new TypeError( "albumPhotos parameter is required and must be an array" );
    }

    let albumMap = new Map();

    albumPhotos.forEach( element => {
      let key = this.getPhotoName( element );
      albumMap.set( key, element );
    } );

    return albumMap;
  }

  /**
   * Gets a list of photos at the gallery level.
   *
   * @returns {Array} An array of gallery photo directories.
   */
  async getGalleryPhotos() {

    let galleryPhotos = await fs.readdir( this.photosPath, { withFileTypes: true } );
    galleryPhotos = galleryPhotos.filter( dirent => dirent.isDirectory() );
    galleryPhotos = galleryPhotos.map( dirent => dirent.name );

    return galleryPhotos;
  }

  /**
   * Filter the list of album photos to those not in the top level gallery.
   *
   * @param {Map} albumPhotoMap A map of all of the album photos.
   * @param {Array} galleryPhotos An arry of all of the existing gallery photos.
   * @returns {Map} A map of all of the album photos not in the top level gallery.
   * @throws {TypeError} If the albumPhotoMap parameter is empty or not a map.
   * @throws {TypeError} If the galleryPhotos parameter is empty or not an array.
   */
  filterAlbumPhotos( albumPhotoMap, galleryPhotos ) {
    if ( !albumPhotoMap || albumPhotoMap instanceof Map !== true ) {
      throw new TypeError( "albumPhotoMap parameter is required and must be a Map" );
    }

    if ( !galleryPhotos || Array.isArray( galleryPhotos ) === false ) {
      throw new TypeError( "galleryPhotos parameter is required and must be an array" );
    }

    galleryPhotos.forEach( element => {
      albumPhotoMap.delete( element );
    } );

    return albumPhotoMap;
  }

  /**
   * Copy a series of album photos the main gallery.
   *
   * @param {Map} albumPhotoMap A map of photos to copy.
   * @throws {TypeError} If the albumPhotoMap parameter fails validation.
   */
  async copyAlbumPhotos( albumPhotoMap ) {
    if ( !albumPhotoMap || albumPhotoMap instanceof Map !== true ) {
      throw new TypeError( "albumPhotoMap parameter is required and must be a Map" );
    }

    for ( const [ key, value ] of albumPhotoMap ) {
      const newDirPath = path.join( this.photosPath, key );
      await fs.mkdir( newDirPath );

      const newFilePath = path.join( newDirPath, path.basename( value ) );
      await fs.copyFile( value, newFilePath );

      const tagMap = await this.getExifData( value );
      const frontMatter = this.buildTomlFrontMatter( tagMap );
      const indexFilePath = path.join( newDirPath, "index.md" );
      await fs.writeFile( indexFilePath, frontMatter );
    }
  }

  /**
   * Retrieve the required EXIF data from the photo. Includes a limited number
   * of tags not in the EXIF header, but make sense to include here.
   *
   * @param {string} photoFilePath The full path to the photo.
   * @returns {Map} A map containing the required EXIF data.
   * @throws {TypeError} If the photoFilePath parameter is invalid.
   * @throws {Error} If the parsing of the EXIF data fails.
   */
  async getExifData( photoFilePath ) {
    if ( !photoFilePath || typeof photoFilePath !== "string" ) {
      throw new TypeError( "photoFilePath parameter is required and must be a string" );
    }

    const tagMap = new Map();
    tagMap.set( "title", "" );
    tagMap.set( "date", "" );
    tagMap.set( "albumname", "" );

    const fileData = await fs.readFile( photoFilePath );

    try {
      const tags = await Exifr.parse( fileData );

      if ( tags.ImageDescription !== undefined ) {
        tagMap.set(
          "title",
          tags.ImageDescription
        );

        tagMap.set(
          "tags",
          this.getTags( tags.ImageDescription )
        );
      }

      if ( tags.CreateDate !== undefined ) {
        tagMap.set(
          "date",
          tags.CreateDate
            .toISOString()
            .substring( 0, 10 )
            .replace( /:/g, "-" )
        );
      }

      tagMap.set(
        "albumname",
        path.basename( path.dirname( photoFilePath ) )
      );

    } catch ( error ) {
      throw new Error( `No Exif data found in: ${photoFilePath}` );
    }

    return tagMap;

  }

  /**
   * Build the TOML front matter from EXIF tags.
   *
   * @param {Map} tagMap The list of EXIF tags.
   * @returns {string} The tag map as a TOML object.
   * @throws {TypeError} If the tagMap paramter does not pass validation.
   */
  buildTomlFrontMatter( tagMap ) {
    if ( !tagMap || tagMap instanceof Map !== true ) {
      throw new TypeError( "tagMap parameter is required and must be a Map" );
    }

    const tagObject = Object.fromEntries(
      tagMap.entries()
    );

    const tomlString = toml.stringify( tagObject );

    return `+++\n${tomlString}+++\n`;

  }

  /**
   * Get a list of tags from a photo description.
   *
   * @param {string} photoDescription The description of the photo.
   * @param {boolean} stripHash A boolean flag to strip the hashes from tags or not.
   *
   * @returns {Array} An array of tags found in the description.
   *
   * @throws {TypeError} If the parameters do not pass validation.
   */
  getTags( photoDescription, stripHash = true ) {
    return Utils.getTags( photoDescription, stripHash );
  }

  /* Ignore the run function as it only used by CLI script and uses
   * all of the other functions which are tested
   */
  /* c8 ignore start */
  /**
   * Run the command by undertaking all of the required steps.
   */
  async run() {
    let albumPhotos = await this.getAlbumPhotos();

    console.log(
      `${logSymbols.info} Found ${albumPhotos.length} photos in albums`
    );

    let albumPhotoMap = this.buildAlbumMap( albumPhotos );

    let galleryPhotos = await this.getGalleryPhotos();

    console.log(
      `${logSymbols.info} Found ${galleryPhotos.length} photos in the gallery`
    );

    let newGalleryPhotos = this.filterAlbumPhotos( albumPhotoMap, galleryPhotos );

    console.log(
      `${logSymbols.info} Need to copy ${newGalleryPhotos.size} photos into the gallery`
    );

    await this.copyAlbumPhotos( newGalleryPhotos );

    console.log(
      `${logSymbols.success} Photos successfully copied into the gallery`
    );
  }

  /* c8 ignore end */
}
