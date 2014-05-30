#/bin/bash

for file in `ls tmp/earthquake/HazusSHP/*.shp`; do
	fieldname="`basename $file`"
	ogr2ogr -f GeoJSON tmp/geojson/$fieldname.json $file  -t_srs "+proj=longlat +ellps=WGS84 +no_defs +towgs84=0,0,0"
	topojson -p -o topojson/$fieldname.json tmp/geojson/$fieldname.json
done