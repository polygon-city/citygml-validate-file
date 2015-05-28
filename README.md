# CityGML Validate File

Run a full geometry validation suite on a CityGML file. By default, this will run on all `bldg:Building` elements.

## Usage

```javascript
var citygmlValidateFile = require("citygml-validate-file");
var results = citygmlValidateFile("some/file/path.gml");
```
