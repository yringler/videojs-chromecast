/*
 * Copyright (c) 2017 Jeremy Thomerson
 * Licensed under the MIT license.
 */
'use strict';

var path = require('path'),
    getCodeVersion = require('silvermine-serverless-utils/src/get-code-version'),
    join = path.join.bind(path),
    nodeSass = require('node-sass');

module.exports = function(grunt) {

   var DEBUG = false,
       config;

   config = {
      js: {
         all: [ 'Gruntfile.js', 'src/**/*.js', 'tests/**/*.js' ],
         browserMainFile: join('src', 'js', 'standalone.js'),
      },

      sass: {
         all: [ '**/*.scss', '!**/node_modules/**/*' ],
         main: join('src', 'scss', 'videojs-chromecast.scss'),
      },

      images: {
         base: join('src', 'images'),
      },

      dist: {
         base: join(__dirname, 'dist'),
      },
   };

   config.dist.js = {
      bundle: join(config.dist.base, 'silvermine-videojs-chromecast.js'),
      minified: join(config.dist.base, 'silvermine-videojs-chromecast.min.js'),
   };

   config.dist.css = {
      base: config.dist.base,
      main: join(config.dist.base, 'silvermine-videojs-chromecast.css'),
   };

   config.dist.images = join(config.dist.base, 'images');

   grunt.initConfig({

      pkg: grunt.file.readJSON('package.json'),
      versionInfo: getCodeVersion.both(),
      config: config,

      clean: {
         build: [ config.dist.base ],
      },

      copy: {
         images: {
            files: [
               {
                  expand: true,
                  cwd: config.images.base,
                  src: '**/*',
                  dest: config.dist.images,
               },
            ],
         },
      },

      eslint: {
         target: config.js.all,
      },

      browserify: {
         main: {
            src: config.js.browserMainFile,
            dest: config.dist.js.bundle,
         },
      },

      uglify: {
         main: {
            files: {
               '<%= config.dist.js.minified %>': config.dist.js.bundle,
            },
            options: {
               banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> <%= versionInfo %> */\n',
               sourceMap: false,
               sourceMapIncludeSources: false,
               mangle: true,
               compress: true,
               beautify: false,
            },
         },
      },

      sasslint: {
         options: {
            configFile: join(__dirname, 'node_modules', '@silvermine/sass-lint-config', 'sass-lint.yml'),
         },
         target: config.sass.all,
      },

      sass: {
         main: {
            files: [
               {
                  src: config.sass.main,
                  dest: config.dist.css.main,
                  ext: '.css',
                  extDot: 'first',
               },
            ],
         },
         options: {
            implementation: nodeSass,
            sourceMap: DEBUG,
            indentWidth: 3,
            outputStyle: DEBUG ? 'expanded' : 'compressed',
            sourceComments: DEBUG,
         },
      },

      postcss: {
         options: {
            map: DEBUG,
            processors: [
               require('autoprefixer')({ browsers: '> .05%' }), // eslint-disable-line global-require
            ],
         },
         styles: {
            src: config.dist.css.main,
         },
      },

      watch: {
         grunt: {
            files: [ 'Gruntfile.js' ],
            tasks: [ 'build' ],
         },

         js: {
            files: [ 'src/**/*.js' ],
            tasks: [ 'build-js' ],
         },

         css: {
            files: [ 'src/**/*.scss' ],
            tasks: [ 'build-css' ],
         },
      },

   });

   grunt.loadNpmTasks('grunt-contrib-clean');
   grunt.loadNpmTasks('grunt-contrib-uglify');
   grunt.loadNpmTasks('grunt-browserify');
   grunt.loadNpmTasks('grunt-contrib-copy');
   grunt.loadNpmTasks('grunt-contrib-watch');
   grunt.loadNpmTasks('grunt-eslint');
   grunt.loadNpmTasks('grunt-sass');
   grunt.loadNpmTasks('grunt-postcss');
   grunt.loadNpmTasks('grunt-sass-lint');

   grunt.registerTask('standards', [ 'eslint', 'sasslint' ]);
   grunt.registerTask('build-js', [ 'browserify', 'uglify' ]);
   grunt.registerTask('build-css', [ 'sass', 'postcss:styles' ]);
   grunt.registerTask('build', [ 'build-js', 'build-css', 'copy:images' ]);
   grunt.registerTask('develop', [ 'build', 'watch' ]);
   grunt.registerTask('default', [ 'standards' ]);

};
