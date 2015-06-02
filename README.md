# CityGML Validate File

Run a full geometry validation suite on a CityGML file. By default, this will run on all `bldg:Building` elements.

## Usage

```javascript
var _ = require("lodash");
var citygmlValidateFile = require("citygml-validate-file");
var results = citygmlValidateFile("some/file/path.gml", "bldg:Building", function(err, results){
  _.each(results, function(buildingResults, buildingIndex) {
    console.log("Building:", buildingIndex);

    _.each(buildingResults, function(result) {
      _.each(result, function(vError) {
        // Should always be an error, but check anyway
        if (!vError || !vError[0]) {
          return;
        }

        // Output validation error name
        console.log(vError[0].message);
      });
    });
  })
});
```
