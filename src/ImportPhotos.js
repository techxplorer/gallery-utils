/**
 * @file The main class for the import-photos command.
 */

import { promises as fs } from "fs";
import path from "path";

import { DateTime } from "luxon";
import { exiftool, ExifTool } from "exiftool-vendored";
import fg from "fast-glob";
import logSymbols from "log-symbols";
import toml from "@iarna/toml";

import Utils from "./Utils.js";

/**
 * A class that undertakes tasks necessary for the import-photos command.
 */
export default class ImportPhotos {

  /**
   * Construct a new PhotoPages command object.
   *
   * @param {string} inputPath The full path to the input directory.
   * @param {string} contentPath The full path to the content directory.
   * @throws {TypeError} When the path parameters are not a string that contains a path to a directory.
   * @since 1.0.0
   */
  constructor( inputPath, contentPath ) {
    if ( !inputPath || typeof inputPath !== "string" ) {
      throw new TypeError( "inputPath parameter is required and must be a string" );
    }

    if ( !contentPath || typeof contentPath !== "string" ) {
      throw new TypeError( "contentPath parameter is required and must be a string" );
    }

    this.inputPath = inputPath;
    this.contentPath = contentPath;
    this.exiftool = exiftool;
    this.importCache = new Map();

    // Basic validation of the input path.
    try {
      Utils.testDirPath( this.inputPath );
    } catch ( e ) {
      throw new TypeError( "inputPath parameter must be a directory" );
    }

    // Basic validation of the input path.
    try {
      Utils.testDirPath( this.contentPath );
    } catch ( e ) {
      throw new TypeError( "contentPath parameter must be a directory" );
    }

    // Ensure paths use '/' as path separators so that globbing etc works.
    this.inputPath = this.inputPath.split( path.sep ).join( path.posix.sep );
    this.contentPath = this.contentPath.split( path.sep ).join( path.posix.sep );

    // Remove trailing slash if present.
    this.inputPath = this.inputPath.replace( /\/+$/, "" );
    this.contentPath = this.contentPath.replace( /\/+$/, "" );

  }

  /**
   * Get the list of photos from the media.json file.
   *
   * @returns {Array} An array of object representing photos.
   * @throws {TypeError} If the media.json file cannot be found.
   */
  async getPhotoList() {
    const mediaJsonPath = path.join(
      this.inputPath,
      "./content/posts_1.json"
    );

    try {
      Utils.testFilePath( mediaJsonPath );
    } catch ( e ) {
      throw new TypeError( "/content/posts_1.json file not found in input directory" );
    }

    const mediaJSON = await fs.readFile( mediaJsonPath );

    const media = JSON.parse( mediaJSON );

    const photoList = new Array();

    for ( const element of media ) {
      if ( element.media[ 0 ] !== undefined ) {
        let photo = element.media[ 0 ];
        if ( photo.media_metadata !== undefined ) {
          if ( photo.media_metadata.photo_metadata !== undefined ) {
            if ( photo.media_metadata.photo_metadata.latitude !== undefined ) {
              if ( photo.media_metadata.photo_metadata.longitude !== undefined ) {
                photo.gps = {
                  latitude: photo.media_metadata.photo_metadata.latitude,
                  longitude: photo.media_metadata.photo_metadata.longitude
                };

                delete photo.media_metadata;
              }
            }
          }
        }
        photoList.push( photo );
      }
    }

    return photoList;
  }

  /**
   * Filter the list of photos to those taken after the specified date.
   *
   * @param {Array} photoList A list of photo objects from the media.json file.
   * @param {string} afterDate Photos must be taken on or after this date.
   *
   * @returns {Array} An array of photo objects for photos taken on or after the afterDate.
   *
   * @throws {TypeError} If the photoList parameter is not an array.
   * @throws {TypeError} If the afterDate parameter is no a string.
   * @throws {TypeError} If the afterDate parameter cannot be parsed as a date.
   */
  filterPhotoList( photoList, afterDate ) {
    if ( !photoList || !Array.isArray( photoList ) ) {
      throw new TypeError( "photoList parameter is required and must be an Array" );
    }

    if ( !afterDate || typeof afterDate !== "string" ) {
      throw new TypeError( "afterDate parameter is required and must be a string" );
    }

    const filterDateTime = DateTime.fromISO( afterDate );

    if ( !filterDateTime.isValid ) {
      throw new TypeError( "afterDate parameter must represent a date in yyyy-mm-dd format" );
    }

    const filteredList = new Array();

    for ( const photo of photoList ) {
      const takenDateTime = DateTime.fromSeconds(
        photo.creation_timestamp
      );

      if ( takenDateTime >= filterDateTime ) {
        filteredList.push( photo );
      }
    }

    return filteredList;
  }

  /**
   * Get the details of the albums in the content directory by parsing the
   * front matter in the index.md files.
   *
   * @returns {Array} An array of album objects.
   */
  async getAlbumDetails() {

    const albumIndexes = await fg( this.contentPath + "/**/index.md" );

    const regex = /\+\+\+([\s\S]*)\+\+\+/g;

    const albums = new Array();

    for ( const albumIndex of albumIndexes ) {
      const content = await fs.readFile( albumIndex, "utf8" );
      const result = content.match( regex );

      if ( result !== null ) {

        const tomlObject = toml.parse(
          result[ 0 ].replace( /\+\+\+/g, "" )
        );

        if ( tomlObject.hashtags !== undefined ) {

          tomlObject.indexPath = albumIndex;
          tomlObject.albumPath = path.dirname( albumIndex );
          tomlObject.albumKey = path.basename( tomlObject.albumPath );

          albums.push( tomlObject );
        }
      }
    }

    return albums;
  }

  /**
   * Update the date of the album to the latest photo date.
   *
   * @param {Array} albumList A list of albums and their metadata.
   * @param {Map} importList A list of photos for potential import.
   *
   * @returns {Array} A list of albums and their metadata.
   *
   * @throws {TypeError} If the parameters do not pass validation.
   */
  updateAlbumDetails( albumList, importList ) {
    if ( !albumList || !Array.isArray( albumList ) ) {
      throw new TypeError( "albumList parameter is required and must be an Array" );
    }

    if ( !importList || ( importList instanceof Map ) === false ) {
      throw new TypeError( "importList parameter is required and must be an Array" );
    }

    for ( const album of albumList ) {
      if ( importList.has( album.albumKey ) ) {
        let albumDate = DateTime.fromISO( album.date );

        for ( const photo of importList.get( album.albumKey ).values() ) {
          const photoDate = DateTime.fromSeconds( photo.creation_timestamp );

          if ( photoDate > albumDate ) {
            albumDate = photoDate;
          }
        }

        album.date = albumDate.toISODate();
        album.updated = true;
      }
    }

    return albumList;
  }

  /**
   * Update the index files of the albums.
   *
   * @param {Array} albumList A list of albums and their metadata.
   *
   * @throws {TypeError} If the parameters do not pass validation.
   */
  async updateIndexFiles( albumList ) {

    if ( !albumList || !Array.isArray( albumList ) ) {
      throw new TypeError( "albumList parameter is required and must be an Array" );
    }

    for ( const album of albumList ) {
      if ( album.updated !== undefined ) {
        const newMetadata = {
          title: album.title,
          date: album.date,
          subtitle: album.subtitle,
          description: album.description,
          hashtags: album.hashtags
        };

        const newFrontMatter =
        `+++\n${toml.stringify( newMetadata )}+++\n`;

        await fs.copyFile(
          album.indexPath,
          album.indexPath + ".old"
        );

        await fs.writeFile(
          album.indexPath,
          newFrontMatter
        );
      }
    }

  }

  /**
   * Map a list of potential photos to the albums and identify those for
   * import that match the hashtags defined in the album metadata.
   *
   * @param {Array} photoList A list of photos for potential import.
   * @param {Array} albumList A list of albums and their metadata.
   *
   * @returns {Map} A map containing the photos for import mapped to albums.
   *
   * @throws {TypeError} If the parameters do not pass validation.
   */
  buildImportList( photoList, albumList ) {
    if ( !photoList || !Array.isArray( photoList ) ) {
      throw new TypeError( "photoList parameter is required and must be an Array" );
    }

    if ( !albumList || !Array.isArray( albumList ) ) {
      throw new TypeError( "albumList parameter is required and must be an Array" );
    }

    const importList = new Map();

    for ( const album of albumList ) {
      for ( const tag of album.hashtags ) {
        for ( const photo of photoList ) {
          if ( photo.title.includes( tag ) === true ) {
            if ( importList.has( album.albumKey ) === false ) {
              importList.set( album.albumKey, new Map() );
            }
            const importAlbum = importList.get( album.albumKey );
            if ( importAlbum.has( photo.uri ) === false ) {
              importAlbum.set( photo.uri, photo );
            }
          }
        }
      }
    }
    return importList;
  }

  /**
   * Update a photo by adding EXIF tags based on the information extracted from media.json.
   *
   * @param {object} photo An object describing a photo.
   * @returns {object} The photo object with the full path to the updated file.
   *
   * @throws {TypeError} If the photo parameter does not pass validation.
   */
  async updateExifTags( photo ) {
    if ( !photo || typeof photo !== "object" ) {
      throw new TypeError( "photo parameter is required and must be an object" );
    }

    // Check to make sure Exiftool is up and running.
    if ( this.exiftool.ended ) {

      // Exiftool has ended (probably during a test) need to restart it.
      this.exiftool = new ExifTool();
    }

    const fileExt = path.extname( photo.uri );
    const takenAt = DateTime.fromSeconds( photo.creation_timestamp );
    let newFileName = takenAt.toFormat( "yyyyMMdd-HHmmssZZZ" );

    newFileName = `${newFileName}-ig${fileExt}`;

    const dateOnly = takenAt.toFormat( "yyyyMMdd" );

    let subjectTags = [];

    subjectTags.push( dateOnly );
    subjectTags.push( ... [
      "Instagram",
      "igphotos"
    ] );

    // Add any hashtags in the photo description to the subject field.
    const hashTags = Utils.getTags( photo.title );

    if ( hashTags.length > 0 ) {
      subjectTags.push( ... hashTags );
    }

    const imageDescription = this.decodeFacebookString( photo.title );

    const newTags = {
      AllDates: takenAt.toISO(),
      "XMP-dc:Description": imageDescription,
      "XMP-dc:Subject": subjectTags,
      "ImageDescription": imageDescription
    };

    if ( photo.gps !== undefined ) {
      newTags.GPSLatitude = photo.gps.latitude;
      newTags.GPSLatitudeRef = photo.gps.latitude;
      newTags.GPSLongitude = photo.gps.longitude;
      newTags.GPSLongitudeRef = photo.gps.longitude;
    }

    const photoPath = path.join(
      this.inputPath,
      photo.uri
    );

    // Write the new EXIF tags to the photo.
    await this.exiftool.write(
      photoPath,
      newTags
    );

    // Rename the new photo to the file name we want.
    const newPhotoPath = path.join(
      path.dirname( photoPath ),
      newFileName
    );

    await fs.rename(
      photoPath,
      newPhotoPath
    );

    // Rename the original photo back to the old name.
    await fs.rename(
      photoPath + "_original",
      photoPath
    );

    photo.newPath = newPhotoPath;

    return photo;
  }

  /**
   * Decode the weird Facebook encoding for UTF-8 based data.
   *
   * @param {string} input String to be decoded.
   *
   * @returns {string} A decoded string.
   *
   * @throws {TypeError} When the input parameter is not a string.
   *
   * @see {@link https://stackoverflow.com/a/54072481} for further information.
   */
  decodeFacebookString( input ) {

    if ( !input || typeof input !== "string" ) {
      throw new TypeError( "input parameter is required and must be a string" );
    }

    let arr = [];
    for ( var i = 0; i < input.length; i++ ) {
      arr.push( input.charCodeAt( i ) );
    }
    return Buffer.from( arr ).toString( "utf8" );
  }

  /**
   * Import a photo from the input directory to the album.
   *
   * @param {string} album The name of the album directory.
   * @param {object} photo An object representing a photo.
   *
   * @throws {TypeError} If the parameters do not pass validation.
   */
  async importPhoto( album, photo ) {

    if ( !album || typeof album !== "string" ) {
      throw new TypeError( "albumDir parameter is required and must be a string" );
    }

    if ( !photo || typeof photo !== "object" ) {
      throw new TypeError( "photo parameter is required and must be an object" );
    }

    const albumDir = path.join(
      this.contentPath,
      "/albums/",
      album
    );

    await Utils.testDirPath( albumDir );

    await fs.copyFile(
      photo.newPath,
      path.join(
        albumDir,
        path.basename( photo.newPath )
      )
    );
  }

  /**
   * Import all of the photos in the import list from the import directory to the album.
   *
   * @param {Map} importList A list of albums with photos to import.
   * @throws {TypeError} If the importList parameter does not pass validation.
   */
  async importPhotos( importList ) {

    if ( !importList || ( importList instanceof Map ) === false ) {
      throw new TypeError( "importList parameter is required and must be a Map" );
    }

    const albumKeys = importList.keys();
    let importPhoto;
    let cached = false;

    for ( const albumKey of albumKeys ) {
      for ( const [ key, photo ] of importList.get( albumKey ) ) {
        if ( this.importCache.has( key ) === true ) {
          importPhoto = this.importCache.get( key );
          cached = true;
        } else {
          importPhoto = await this.updateExifTags( photo );
          cached = false;
        }

        await this.importPhoto( albumKey, importPhoto );

        if ( cached === false ) {
          this.importCache.set( importPhoto.uri, importPhoto );
        }
      }
    }

    this.tidyUp();

  }

  /**
   * Tidy up the exiftool singleton by ending its process.
   */
  async tidyUp() {
    await this.exiftool.end();
  }

  /* Ignore the run function as it only used by CLI script and uses
   * all of the other functions which are tested
   */
  /* c8 ignore start */
  /**
   * Run the command by undertaking all of the required steps.
   *
   * @param {string} filterDate Photos must be taken on or after this date.
   */
  async run( filterDate ) {

    let photoList = await this.getPhotoList();

    console.log(
      `${logSymbols.info} Found ${photoList.length} photos in import directory`
    );

    if ( filterDate !== undefined ) {
      photoList = this.filterPhotoList( photoList, filterDate );

      console.log(
        `${logSymbols.info} Found ${photoList.length} photos in taken after ${filterDate}`
      );
    }

    if ( photoList.length === 0 ) {
      console.log(
        `${logSymbols.info} No photos found to import`
      );

      return;
    }

    let albumDetails = await this.getAlbumDetails();

    console.log(
      `${logSymbols.info} Found ${albumDetails.length} albums in content directory`
    );

    const importList = this.buildImportList( photoList, albumDetails );

    if ( importList.size === 0 ) {
      console.log(
        `${logSymbols.info} No albums found to update`
      );

      return;
    }

    console.log(
      `${logSymbols.info} Found ${importList.size} albums to update`
    );

    console.log( `${logSymbols.info} Importing photos...` );

    await this.importPhotos( importList );

    albumDetails = this.updateAlbumDetails( albumDetails, importList );
    await this.updateIndexFiles( albumDetails );

    await this.tidyUp();

    console.log(
      `${logSymbols.success} Photos successfully imported into albums in the gallery`
    );
  }

  /* c8 ignore stop */

}
