/**
 * @file A series of unit tests for the PhotoPages command.
 */

import PhotoPages from "../src/PhotoPages.js";

import assert from "assert";
import fs from "fs";
import path from "path";

import rimraf from "rimraf";


const contentDirectory = path.resolve( "test/artefacts/content" );

const expectedAlbumPhotos = 5;
const expectedGalleryPhotos = 1;
const expectedFilteredAlbumPhotos = expectedAlbumPhotos - expectedGalleryPhotos;
const expectedFilteredAlbumKeys = [
  "20200830-021808",
  "20200927-225622",
  "20201018-020403",
  "20201018-020926"
];
const expectedGalleryPhotoFiles = [
  "20200830-021808+0000-ig.jpg",
  "20200927-225622+0000-ig.jpg",
  "20201018-020403+0000-ig.jpg",
  "20201018-020926+0000-ig.jpg"
];
const testPhotoPath = path.join(
  contentDirectory,
  "./albums/diy-projects/20200830-021808+0000-ig.jpg"
);

describe( "PhotoPages", function() {

  describe( "#constructor", function() {
    it( "should throw an error if the parameter is not supplied", function() {
      assert.throws( function() {
        new PhotoPages();
      }, TypeError );
    } );

    it( "should throw an error if the parameter is not a string", function() {
      assert.throws( function() {
        new PhotoPages( new Object );
      }, TypeError );
    } );

    it( "should throw an error if the parameter is not a path to a directory", function() {
      assert.throws( function() {
        new PhotoPages( "./TestPhotoPages.js" );
      }, TypeError );
    } );

    it( "should return an object when the parameter passes validation", function() {
      const command = new PhotoPages( contentDirectory );
      assert.strictEqual( typeof( command ), "object" );
    } );

  } );

  describe( "#getAlbumPhotos", function() {
    it( "should return an array", async function() {
      const command = new PhotoPages( contentDirectory );

      let photos = await command.getAlbumPhotos();
      assert.ok( Array.isArray( photos ) );
    } );

    it( "should return an array with the right number of elements", async function() {
      const command = new PhotoPages( contentDirectory );

      let photos = await command.getAlbumPhotos();
      assert.strictEqual( photos.length, expectedAlbumPhotos );
    } );

  } );

  describe( "#getPhotoName", function() {
    it( "should throw an error if the parameter is not supplied", function() {
      const command = new PhotoPages( contentDirectory );
      assert.throws( function() {
        command.getPhotoName();
      }, TypeError );
    } );

    it( "should throw an error if the parameter is not a string", function() {
      const command = new PhotoPages( contentDirectory );
      assert.throws( function() {
        command.getPhotoName( new Object() );
      }, TypeError );
    } );

    it( "should return a properly formatted photo file name", function() {
      const command = new PhotoPages( contentDirectory );
      const input = "/content/albums/nanoblock-models/20200628-005017+0000-ig.jpg";
      const expected = "20200628-005017";
      const output = command.getPhotoName( input );
      assert.strictEqual( output, expected );
    } );

    it( "should return null if the photo file name is unexpected", function() {
      const command = new PhotoPages( contentDirectory );
      const input = "/content/albums/nanoblock-models/2020062a-005017+0000-ig.jpg";
      const expected = null;
      const output = command.getPhotoName( input );
      assert.strictEqual( output, expected );
    } );
  } );

  describe( "#buildAlbumMap", function() {
    it( "should throw an error if the parameter is not supplied", function() {
      const command = new PhotoPages( contentDirectory );
      assert.throws( function() {
        command.buildAlbumMap();
      }, TypeError );
    } );

    it( "should throw an error if the parameter is not an array", function() {
      const command = new PhotoPages( contentDirectory );
      assert.throws( function() {
        command.buildAlbumMap( new Object() );
      }, TypeError );
    } );

    it( "should return a map with the expected number of elements", async function() {
      const command = new PhotoPages( contentDirectory );
      let photos = await command.getAlbumPhotos();
      let photoMap = command.buildAlbumMap( photos );
      assert.ok( photoMap instanceof Map );
      assert.strictEqual( photoMap.size, expectedAlbumPhotos );
    } );
  } );

  describe( "#getGalleryPhotos", function() {
    it( "should return an array", async function() {
      const command = new PhotoPages( contentDirectory );
      let photos = await command.getGalleryPhotos();
      assert.ok( Array.isArray( photos ) );
    } );

    it( "should return an array with the expected number of elements", async function() {
      const command = new PhotoPages( contentDirectory );
      let photos = await command.getGalleryPhotos();
      assert.ok( Array.isArray( photos ) );
      assert.strictEqual( photos.length, expectedGalleryPhotos );
    } );
  } );

  describe( "#filterAlbumPhotos", function() {
    it( "should throw an error if the first parameter is not supplied", function() {
      const command = new PhotoPages( contentDirectory );
      assert.throws( function() {
        command.filterAlbumPhotos();
      }, TypeError );
    } );

    it( "should throw an error if the first parameter is not a map", function() {
      const command = new PhotoPages( contentDirectory );
      assert.throws( function() {
        command.filterAlbumPhotos( new Object() );
      }, TypeError );
    } );

    it( "should throw an error if the second parameter is not supplied", function() {
      const command = new PhotoPages( contentDirectory );
      assert.throws( function() {
        command.filterAlbumPhotos( new Map() );
      }, TypeError );
    } );

    it( "should throw an error if the first parameter is not an array ", function() {
      const command = new PhotoPages( contentDirectory );
      assert.throws( function() {
        command.filterAlbumPhotos( new Map(), new Object() );
      }, TypeError );
    } );

    it( "should return a map with the right number of elements", async function() {
      const command = new PhotoPages( contentDirectory );
      let albumPhotos = await command.getAlbumPhotos();
      let albumPhotoMap = command.buildAlbumMap( albumPhotos );
      let galleryPhotos = await command.getGalleryPhotos();
      let newGalleryPhotos = command.filterAlbumPhotos( albumPhotoMap, galleryPhotos );
      assert.ok( newGalleryPhotos instanceof Map );
      assert.strictEqual( newGalleryPhotos.size, expectedFilteredAlbumPhotos );
    } );

    it( "should return a map with the right elements", async function() {
      const command = new PhotoPages( contentDirectory );
      let albumPhotos = await command.getAlbumPhotos();
      let albumPhotoMap = command.buildAlbumMap( albumPhotos );
      let galleryPhotos = await command.getGalleryPhotos();
      let newGalleryPhotos = command.filterAlbumPhotos( albumPhotoMap, galleryPhotos );
      assert.ok( newGalleryPhotos instanceof Map );

      expectedFilteredAlbumKeys.forEach( element => {
        assert.ok( newGalleryPhotos.has( element ) );
      } );
    } );
  } );

  describe( "#copyAlbumPhotos", function() {

    before( "cleanup photos directory", resetPhotosDirectory );

    after( "cleanup photos directory", resetPhotosDirectory );

    it( "should throw an error if the parameter is not supplied", async function() {
      const command = new PhotoPages( contentDirectory );
      assert.rejects( async function() {
        command.copyAlbumPhotos();
      }, TypeError );
    } );

    it( "should throw an error if the parameter is not a map", async function() {
      const command = new PhotoPages( contentDirectory );
      assert.rejects( async function() {
        command.copyAlbumPhotos( new Object() );
      }, TypeError );
    } );

    this.slow( 1000 );

    it( "should create the new gallery photo directories and copy the photos", async function() {
      const command = new PhotoPages( contentDirectory );
      let albumPhotos = await command.getAlbumPhotos();
      let albumPhotoMap = command.buildAlbumMap( albumPhotos );
      let galleryPhotos = await command.getGalleryPhotos();
      let newGalleryPhotos = command.filterAlbumPhotos( albumPhotoMap, galleryPhotos );
      await command.copyAlbumPhotos( newGalleryPhotos );

      expectedFilteredAlbumKeys.forEach( function( element, index ) {
        let dirPath = path.join( contentDirectory, "photos", element );
        assert.ok( fs.lstatSync( dirPath ).isDirectory() );
        let filePath = path.join( dirPath, expectedGalleryPhotoFiles[ index ] );
        assert.ok( fs.lstatSync( filePath ).isFile() );
        filePath = path.join( dirPath, "index.md" );
        assert.ok( fs.lstatSync( filePath ).isFile() );
      } );
    } );
  } );

  describe( "#getExifData", function() {
    it( "should throw an error if the parameter is not supplied", async function() {
      const command = new PhotoPages( contentDirectory );
      assert.rejects( async function() {
        command.getExifData();
      }, TypeError );
    } );

    it( "should throw an error if the parameter is not a string", async function() {
      const command = new PhotoPages( contentDirectory );
      assert.rejects( async function() {
        command.getExifData( new Object() );
      }, TypeError );
    } );

    it( "should return the required EXIF data in a map", async function() {
      const command = new PhotoPages( contentDirectory );
      // eslint-disable-next-line max-len
      const expectedKeys = [
        "title",
        "date",
        "albumname"
      ];
      const expectedTitle =
        "Mistakes were made, and many lessons learned. I made these shelves myself. #diy #proud";
      const expectedDate = "2020-08-30";
      const expectedAlbumName = "diy-projects";

      const tagMap = await command.getExifData( testPhotoPath );

      assert.ok( tagMap instanceof Map );

      assert.strictEqual( tagMap.size, expectedKeys.length );

      expectedKeys.forEach( element => {
        assert.ok( tagMap.has( element ) );
      } );

      assert.strictEqual( tagMap.get( "title" ), expectedTitle );
      assert.strictEqual( tagMap.get( "date" ), expectedDate );
      assert.strictEqual( tagMap.get( "albumname" ), expectedAlbumName );
    } );
  } );

  describe( "#buildTomlFrontMatter", function() {
    it( "should throw an error if the first parameter is not supplied", function() {
      const command = new PhotoPages( contentDirectory );
      assert.throws( function() {
        command.buildTomlFrontMatter();
      }, TypeError );
    } );

    it( "should throw an error if the first parameter is not a map", function() {
      const command = new PhotoPages( contentDirectory );
      assert.throws( function() {
        command.buildTomlFrontMatter( new Object() );
      }, TypeError );
    } );

    it( "should return the expected TOML front matter", async function() {
      const command = new PhotoPages( contentDirectory );
      const tagMap = await command.getExifData( testPhotoPath );

      const expectedFrontMatter = `+++
title = "Mistakes were made, and many lessons learned. I made these shelves myself. #diy #proud"
date = "2020-08-30"
albumname = "diy-projects"
+++\n`;

      const frontMatter = command.buildTomlFrontMatter( tagMap );
      assert.strictEqual( frontMatter, expectedFrontMatter );
    } );
  } );
} );

/**
 * Reset the photos directory by deleting content created by tests.
 */
async function resetPhotosDirectory() {
  for ( const key of expectedFilteredAlbumKeys ) {
    const fullPath = path.join( contentDirectory, "photos", key );
    await rimraf( fullPath, error => {
      if ( error ) {
        throw error;
      }
    } );
  }
}
