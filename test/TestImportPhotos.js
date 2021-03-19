/**
 * @file A series of unit tests for the ImportPhotos command.
 */

import ImportPhotos from "../src/ImportPhotos.js";
import Utils from "../src/Utils.js";

import assert from "assert";
import { DateTime } from "luxon";
import Exifr from "exifr";
import { promises as fs } from "fs";
import path from "path";
import { exiftool } from "exiftool-vendored";

const contentDirectory = path.resolve( "test/artefacts/content" );
const importDirectory = path.resolve( "test/artefacts/instagram" );

const expectedMediaPhotos = 6;
const expectedFilteredPhotos = 3;
const filterPhotoDate = "2020-12-01";

const expectedPhotoKeys = [
  "uri",
  "creation_timestamp",
  "media_metadata",
  "title"
];

const expectedAlbums = 2;
const expectedAlbumObjectKeys = [
  "title",
  "date",
  "subtitle",
  "description",
  "hashtags",
  "indexPath",
  "albumPath",
  "albumKey"
];

const expectedImportListSize = 2;
const expectedAlbumImportListKeys = [
  "diy-projects",
  "nanoblock-models"
];
const expectedAlbumListImportSizes = [
  4,
  1
];

const expectedImportedPhotos = [
  "/albums/diy-projects/20201115-202456+1030-ig.jpg",
  "/albums/diy-projects/20201128-140735+1030-ig.jpg",
  "/albums/diy-projects/20201209-075942+1030-ig.jpg",
  "/albums/diy-projects/20210109-155154+1030-ig.jpg",
  "/albums/nanoblock-models/20201209-075942+1030-ig.jpg"
];

const expectedUpdatedPhotos = [
  "/media/posts/202011/20201115-202456+1030-ig.jpg",
  "/media/posts/202011/20201128-140735+1030-ig.jpg",
  "/media/posts/202012/20201209-075942+1030-ig.jpg",
  "/media/posts/202101/20210109-155154+1030-ig.jpg"
];

describe( "ImportPhotos", function() {

  /*
   * Setup the timezone for the running Node process to ensure consistent tests.
   */
  before( function() {
    process.env.TZ = "Australia/Adelaide";
  } );

  describe( "#constructor", function() {
    it( "should throw an error if the parameters are not supplied", function() {
      assert.throws( function() {
        new ImportPhotos();
      }, TypeError );
    } );

    it( "should throw an error if the inputPath parameter is not a string", function() {
      assert.throws( function() {
        new ImportPhotos( new Object );
      }, TypeError );
    } );

    it( "should throw an error if the inputPath parameter is not a directory", function() {
      assert.throws( function() {
        new ImportPhotos( "./TestImportPhotos.js", contentDirectory );
      }, TypeError );
    } );

    it( "should throw an error if the contentPath parameter is not a string", function() {
      assert.throws( function() {
        new ImportPhotos( importDirectory, new Object() );
      }, TypeError );
    } );

    it( "should throw an error if the contentPath parameter is not a directory", function() {
      assert.throws( function() {
        new ImportPhotos( importDirectory, "./TestImportPhotos.js" );
      }, TypeError );
    } );

    it( "should throw an error if the importPath parameter is an empty strings", function() {
      assert.throws( function() {
        new ImportPhotos( "", contentDirectory );
      }, TypeError );
    } );

    it( "should throw an error if the contentPath parameter is an empty strings", function() {
      assert.throws( function() {
        new ImportPhotos( importDirectory, "" );
      }, TypeError );
    } );

    it( "should return an object when the parameters pass validation", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.strictEqual( typeof( command ), "object" );
    } );

  } );

  describe( "#getPhotoList", function() {
    it( "should throw an error if the media json file cannot be found", async function() {
      const command = new ImportPhotos( contentDirectory, contentDirectory );
      assert.rejects( async function() {
        command.getPhotoList();
      }, TypeError );
    } );

    it( "should return an array with the right number of elements", async function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      const photoList = await command.getPhotoList();

      assert.ok( Array.isArray( photoList ) );
      assert.strictEqual( expectedMediaPhotos, photoList.length );
    } );

    it( "should return an array of objects with the right keys", async function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      const photoList = await command.getPhotoList();

      assert.ok( Array.isArray( photoList ) );

      for ( const photo of photoList ) {
        assert.ok( typeof photo === "object" );
        for ( const photoKey of expectedPhotoKeys ) {
          assert.ok( Object.prototype.hasOwnProperty.call( photo, photoKey ) );
        }
      }
    } );

  } );

  describe( "#filterPhotoList", function() {
    it( "should throw an error if the photoList parameter is not supplied", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.throws( function() {
        command.filterPhotoList();
      }, TypeError );
    } );

    it( "should throw an error if the photoList parameter is not an array", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.throws( function() {
        command.filterPhotoList( new Object() );
      }, TypeError );
    } );

    it( "should throw an error if the afterDate parameter is not supplied", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.throws( function() {
        command.filterPhotoList( [] );
      }, TypeError );
    } );

    it( "should throw an error if the afterDate parameter is not a string", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.throws( function() {
        command.filterPhotoList( [], new Object() );
      }, TypeError );
    } );

    it( "should throw an error if the afterDate parameter is not a date", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.throws( function() {
        command.filterPhotoList( [], "2021-abc-123" );
      }, TypeError );
    } );

    it( "should return an array with the right number of elements", async function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );

      const photoList = await command.getPhotoList();
      const filteredList = command.filterPhotoList(
        photoList,
        filterPhotoDate
      );

      assert.ok( Array.isArray( filteredList ) );
      assert.strictEqual( expectedFilteredPhotos, filteredList.length );

    } );

  } );

  describe( "#getAlbumDetails", function() {
    it( "should return an array with the right number of elements", async function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      const albumDetails = await command.getAlbumDetails();
      assert.ok( Array.isArray( albumDetails ) );
      assert.strictEqual( expectedAlbums, albumDetails.length );
    } );

    it( "should return an array objects with the right properties", async function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      const albumDetails = await command.getAlbumDetails();

      for ( const album of albumDetails ) {
        for ( const albumKey of expectedAlbumObjectKeys ) {
          assert.ok( Object.prototype.hasOwnProperty.call( album, albumKey ) );
        }
      }
    } );

  } );

  describe( "#updateAlbumDetails", function() {
    it( "should throw an error if the albumDetails parameter is not supplied", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.throws( function() {
        command.updateAlbumDetails();
      }, TypeError );
    } );

    it( "should throw an error if the albumDetails parameter is not the right type", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.throws( function() {
        command.updateAlbumDetails( new Object() );
      }, TypeError );
    } );

    it( "should throw an error if the importList parameter is not supplied", async function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      const albumDetails = await command.getAlbumDetails();

      assert.throws( function() {
        command.updateAlbumDetails( albumDetails );
      }, TypeError );
    } );

    it( "should throw error if the importList parameter is not the right type", async function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      const albumDetails = await command.getAlbumDetails();

      assert.throws( function() {
        command.updateAlbumDetails( albumDetails, new Object() );
      }, TypeError );
    } );

    it( "should return an array with the right number of elements", async function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );

      const photoList = await command.getPhotoList();
      let albumDetails = await command.getAlbumDetails();

      const oldDates = new Map();

      for ( const album of albumDetails ) {
        oldDates.set( album.albumKey, album.date );
      }

      const importList = command.buildImportList( photoList, albumDetails );
      albumDetails = command.updateAlbumDetails( albumDetails, importList );

      assert.strictEqual( expectedAlbums, albumDetails.length );

      for ( const album of albumDetails ) {
        const oldDate = oldDates.get( album.albumKey ).date;
        assert.ok( oldDate !== album.date );
      }
    } );

  } );

  describe( "#updateIndexFiles", function() {
    it( "should throw an error if the albumDetails parameter is not supplied", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.rejects( function() {
        command.updateIndexFiles();
      }, TypeError );
    } );

    it( "should throw an error if the albumDetails parameter is not the right type", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.rejects( function() {
        command.updateIndexFiles( new Object() );
      }, TypeError );
    } );

    it( "should update the album index files with new metadata", async function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );

      const photoList = await command.getPhotoList();
      let albumDetails = await command.getAlbumDetails();
      const importList = command.buildImportList( photoList, albumDetails );
      albumDetails = command.updateAlbumDetails( albumDetails, importList );
      await command.updateIndexFiles( albumDetails );

      for ( const album of albumDetails ) {
        assert.ok(
          await Utils.testFilePath(
            album.indexPath
          )
        );

        assert.ok(
          await Utils.testFilePath(
            album.indexPath + ".old"
          )
        );

        try {
          await fs.unlink(
            album.indexPath
          );

          await fs.rename(
            album.indexPath + ".old",
            album.indexPath
          );
        } catch ( error ) {

          // Ignore the error if the file is not found.
        }
      }

    } );
  } );

  describe( "#buildImportList", function() {
    it( "should throw an error if the photoList parameter is not supplied", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.throws( function() {
        command.buildImportList();
      }, TypeError );
    } );

    it( "should throw an error if the photoList parameter is not an array", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.throws( function() {
        command.buildImportList( new Object() );
      }, TypeError );
    } );

    it( "should throw an error if the albumList parameter is not supplied", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.throws( function() {
        command.buildImportList( [] );
      }, TypeError );
    } );

    it( "should throw an error if the albumList parameter is not an array", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.throws( function() {
        command.buildImportList( [], new Object() );
      }, TypeError );
    } );

    it( "should return a map with the right number of elements", async function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );

      const photoList = await command.getPhotoList();
      const albumDetails = await command.getAlbumDetails();

      const importList = command.buildImportList( photoList, albumDetails );

      assert.ok( importList instanceof Map );
      assert.strictEqual( importList.size, expectedImportListSize );
      for ( const albumKey of expectedAlbumImportListKeys ) {
        assert.ok( importList.has( albumKey ) );
      }
    } );

    it( "should return a map with the right elements", async function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );

      const photoList = await command.getPhotoList();
      const albumDetails = await command.getAlbumDetails();

      const importList = command.buildImportList( photoList, albumDetails );

      for ( const [ albumIndex, albumKey ] of expectedAlbumImportListKeys.entries() ) {
        assert.ok( importList.has( albumKey ) );
        assert.ok( importList.get( albumKey ) instanceof Map );
        assert.strictEqual(
          importList.get( albumKey ).size,
          expectedAlbumListImportSizes[ albumIndex ]
        );
      }
    } );

  } );

  describe( "#updateExifTags", function() {

    after( "cleanup resources", async function() {
      await exiftool.end();
      try {
        await fs.unlink(
          path.join(
            importDirectory,
            "photos/202101/20210109-052154+0000-ig.jpg"
          )
        );
      } catch ( error ) {

        // Ignore the error if the file is not found.
      }
    } );

    it( "should throw an error if the photo parameter is not supplied", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.rejects( async function() {
        command.updateExifTags();
      }, TypeError );
    } );

    it( "should throw an error if the photo parameter is not an object", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.rejects( async function() {
        command.updateExifTags( "string" );
      }, TypeError );
    } );

    // A lot of file system stuff happens in this test. Adjust the slow timeout accordingly.
    this.slow( 1500 );

    it( "should update a photo with the new EXIF tags", async function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      const photoList = await command.getPhotoList();
      const oldPhoto = photoList[ 0 ];
      const newPhoto = await command.updateExifTags( oldPhoto );

      for ( const photoKey of expectedPhotoKeys ) {
        assert.strictEqual( oldPhoto[ photoKey ], newPhoto[ photoKey ] );
      }

      assert.ok(
        newPhoto.newPath.endsWith( "20201128-140735+1030-ig.jpg" ),
        `Path does not end with expected value, it ends with ${path.basename( newPhoto.newPath )}`

      );
      assert.ok( Utils.testFilePath( newPhoto.newPath ) );

      const fileData = await fs.readFile( newPhoto.newPath );
      const tags = await Exifr.parse( fileData, { xmp: true } );

      assert.ok( tags.ImageDescription !== undefined );
      assert.ok( tags.CreateDate !== undefined );

      assert.strictEqual(
        tags.ImageDescription,
        oldPhoto.title
      );

      assert.strictEqual(
        tags.description.value,
        oldPhoto.title
      );

      const oldPhotoDate = DateTime.fromSeconds( oldPhoto.creation_timestamp );
      const newPhotoDate = DateTime.fromJSDate( tags.CreateDate );

      assert.ok(
        oldPhotoDate.equals( newPhotoDate )
      );
    } );

  } );

  describe( "#importPhoto", function() {

    after( "cleanup resources", async function() {
      await exiftool.end();

      try {
        await fs.unlink(
          path.join(
            importDirectory,
            "photos/202101/20201115-202456+1030-ig.jpg"
          )
        );
      } catch ( error ) {

        // Ignore the error if the file is not found.
      }

      try {
        await fs.unlink(
          path.join(
            contentDirectory,
            "albums/diy-projects",
            "20201115-202456+1030-ig.jpg"
          )
        );
      } catch ( error ) {

        // Ignore the error if the file is not found.
      }
    } );

    it( "should throw an error if the albumDir parameter is not supplied", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.rejects( async function() {
        command.importPhoto();
      }, TypeError );
    } );

    it( "should throw an error if the albumDir parameter is not a string", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.rejects( async function() {
        command.importPhoto( new Object() );
      }, TypeError );
    } );

    it( "should throw an error if the photo parameter is not supplied", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.rejects( async function() {
        command.importPhoto( "album" );
      }, TypeError );
    } );

    it( "should throw an error if the photo parameter is not an object", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.rejects( async function() {
        command.importPhoto( "album", "photo" );
      }, TypeError );
    } );

    // A lot of file system stuff happens in this test. Adjust the slow timeout accordingly.
    this.slow( 1500 );

    it( "should copy a photo from the input directory to an album", async function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );

      const photoList = await command.getPhotoList();
      const albumDetails = await command.getAlbumDetails();

      const importList = command.buildImportList( photoList, albumDetails );

      const albumName = "diy-projects";
      const album = importList.get( albumName );
      let photo = album.get(
        "media/posts/202101/136666019_120733959891465_6563206315612846459_n_17856779924435952.jpg"
      );

      photo = await command.updateExifTags( photo );

      await command.importPhoto( albumName, photo );

      assert.ok(
        await Utils.testFilePath(
          path.join(
            contentDirectory,
            "albums/diy-projects",
            "20210109-155154+1030-ig.jpg"
          )
        )
      );

      assert.ok(
        await Utils.testFilePath(
          path.join(
            importDirectory,
            "media/posts/202101/20210109-155154+1030-ig.jpg"
          )
        )
      );

      await command.tidyUp();

    } );

    // A lot of file system stuff happens in this test. Adjust the slow timeout accordingly.
    this.slow( 1500 );

    it( "should copy a photo correctly when paths have a trailing slash", async function() {
      const command = new ImportPhotos( importDirectory + "/", contentDirectory + "/" );

      const photoList = await command.getPhotoList();
      const albumDetails = await command.getAlbumDetails();

      const importList = command.buildImportList( photoList, albumDetails );

      const albumName = "diy-projects";
      const album = importList.get( albumName );
      let photo = album.get(
        "media/posts/202101/136666019_120733959891465_6563206315612846459_n_17856779924435952.jpg"
      );

      photo = await command.updateExifTags( photo );

      await command.importPhoto( albumName, photo );

      assert.ok(
        await Utils.testFilePath(
          path.join(
            contentDirectory,
            "albums/diy-projects",
            "20210109-155154+1030-ig.jpg"
          )
        )
      );

      assert.ok(
        await Utils.testFilePath(
          path.join(
            importDirectory,
            "media/posts/202101/20210109-155154+1030-ig.jpg"
          )
        )
      );

      await command.tidyUp();

    } );

  } );

  describe( "#importPhotos", function() {

    after( "cleanup resources", async function() {
      await exiftool.end();

      for ( const importedPhoto of expectedImportedPhotos ) {
        try {
          await fs.unlink(
            path.join(
              contentDirectory,
              importedPhoto
            )
          );
        } catch ( error ) {

          // Ignore the error if the file is not found.
        }
      }

      for ( const updatedPhoto of expectedUpdatedPhotos ) {
        try {
          await fs.unlink(
            path.join(
              importDirectory,
              updatedPhoto
            )
          );
        } catch ( error ) {

          // Ignore the error if the file is not found.
        }
      }

    } );

    it( "should throw an error if the importList parameter is not supplied", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.rejects( async function() {
        command.importPhotos();
      }, TypeError );
    } );

    it( "should throw an error if the importList parameter is not a map", function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );
      assert.rejects( async function() {
        command.importPhotos( new Object() );
      }, TypeError );
    } );

    // A lot of file system stuff happens in this test. Adjust the slow timeout accordingly.
    this.slow( 1500 );

    it( "should import all of the photos into the albums", async function() {
      const command = new ImportPhotos( importDirectory, contentDirectory );

      const photoList = await command.getPhotoList();
      const albumDetails = await command.getAlbumDetails();

      const importList = command.buildImportList( photoList, albumDetails );

      await command.importPhotos( importList );

      for ( const importedPhoto of expectedImportedPhotos ) {
        assert.ok(
          await Utils.testFilePath(
            path.join(
              contentDirectory,
              importedPhoto
            )
          )
        );
      }

      for ( const updatedPhoto of expectedUpdatedPhotos ) {
        assert.ok(
          await Utils.testFilePath(
            path.join(
              importDirectory,
              updatedPhoto
            )
          )
        );
      }
    } );

  } );

} );
