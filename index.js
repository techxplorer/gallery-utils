/**
 * @file Main entry point for the Gallery Utils script.
 */

const startTime = process.hrtime.bigint();

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import chalk from "chalk";
import commander from "commander";
import logSymbols from "log-symbols";
import prettyMS from "pretty-ms";

import PhotoPages from "./src/PhotoPages.js";
import ImportPhotos from "./src/ImportPhotos.js";

/**
 * Main function declared as async to allow use of await etc.
 */
export default async function run() {

  // Read in the package.json file as a JSON object.
  // Cannot use __dirname here as this is an ES module.
  const appPackageJSON = await fs.readFile(
    path.resolve(
      path.dirname(
        fileURLToPath( import.meta.url )
      ),
      "./package.json"
    )
  );

  const appPackage = JSON.parse( appPackageJSON );

  console.log(
    chalk.bold( "Gallery Utils" ) + " Version: " + appPackage.version
  );

  const program = new commander.Command();

  // Define basic program metadata.
  program.version( appPackage.version, "-v, --version" )
    .description( "Utilities to manage my photo gallery" );

  program.command( "photo-pages <input-dir>" )
    .description( "Build the individual photo gallery pages" )
    .action( async function( input ) {

      // Run the command.
      try {
        console.log( chalk.greenBright( "Building photo gallery pages" ) );
        const photoPages = new PhotoPages( input );
        await photoPages.run();
      } catch ( e ) {
        console.log( logSymbols.error + " " + e.message );
      }
      return;
    } );

  program.command( "import-photos <input-dir> <content-dir> <filter-date>" )
    .description( "Import photos into gallery albums" )
    .action( async function( input, content, filter ) {

      // Run the command.
      try {
        console.log( chalk.greenBright( "Importing photos into albums" ) );
        const importPhotos = new ImportPhotos( input, content );
        await importPhotos.run( filter );
      } catch ( e ) {
        console.log( logSymbols.error + " " + e.message );
        console.log( e.stack );
      }
      return;
    } );

  // Extend help with custom message.
  program.on( "--help", () => {
    console.log( "\nMore info: " + appPackage.homepage );
  } );

  // Parse the command line parameters.
  await program.parseAsync( process.argv );

  const endTime = process.hrtime.bigint();
  const totalTime = Number( endTime - startTime ) * 1e-6;

  console.log( logSymbols.info + " Elapsed time:", prettyMS( totalTime ) );
}
