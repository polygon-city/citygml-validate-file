var _ = require("lodash");
var async = require("async");
var fs = require("fs-extra");
var path = require("path");
var sax = require("sax");
var saxpath = require("saxpath");
var DOMParser = require("xmldom").DOMParser;
var strict = true;

// CityGML helpers
var citygmlPolygons = require("citygml-polygons");
var citygmlBoundaries = require("citygml-boundaries");
var citygmlPoints = require("citygml-points");
var citygmlValidateRing = require("citygml-validate-ring");
var citygmlValidatePolygon = require("citygml-validate-polygon");
var citygmlValidateShell = require("citygml-validate-shell");

var domParser = new DOMParser();

// TODO: Run tests in series and return results when done
var citygmlValidateFile = function(citygmlPath, elementName, callback) {
  elementName = (elementName) ? elementName : "bldg:Building";

  // This surely can't be the best way to sync building order with the repair
  // script
  var buildingIndex = 0;
  var testResults = {};

  var saxParser = sax.createStream(strict, {
    xmlns: true
  });

  var streamErrorHandler = function (e) {
    // console.error("Error:", e);

    // Clear the error
    // TODO: Check this is how sax-js recommends error handling
    this._parser.error = null;
    this._parser.resume();
  };

  saxParser.on("error", streamErrorHandler);

  var saxStream = new saxpath.SaXPath(saxParser, "//" + elementName);

  saxStream.on("match", function(xml) {
    var tasks = [];

    var xmlDOM = domParser.parseFromString(xml);
    var polygons = citygmlPolygons(xml);

    var bIndex = buildingIndex++;

    _.each(polygons, function(polygon) {
      // Get exterior and interior boundaries for polygon (outer and holes)
      var boundaries = citygmlBoundaries(polygon);

      // Validate exterior ring
      tasks.push(validateRing(boundaries.exterior[0]));

      // Validate interior rings
      _.each(boundaries.interior, function(interior) {
        tasks.push(validateRing(interior));
      });

      // Validate polygon as a whole
      tasks.push(validatePolygon(polygon));
    });

    // Validate shell as a whole
    tasks.push(validateShell(polygons));

    // Validation errors will be in the results not the err object
    async.series(tasks, function(err, results) {
      if (err) {
        console.error(err);
        return;
      }

      testResults[bIndex] = results;
    });
  });

  // Finished reading the file
  saxStream.on("end", function() {
    callback(null, testResults);
  });

  var readStream = fs.createReadStream(citygmlPath);
  readStream.pipe(saxParser);
};

var validateRing = function(ring, callback) {
  return function(callback) {
    citygmlValidateRing(ring, function(err, results) {
      callback(err, results);
    });
  };
};

var validatePolygon = function(polygon, callback) {
  return function(callback) {
    citygmlValidatePolygon(polygon, function(err, results) {
      callback(err, results);
    });
  };
};

var validateShell = function(polygons, callback) {
  return function(callback) {
    citygmlValidateShell(polygons, function(err, results) {
      callback(err, results);
    });
  };
};

module.exports = citygmlValidateFile;
