#/bin/bash

mkdir -p tmp/geojson
mkdir topojson
mkdir tmp/prettytopojson/
mkdir tmp/summarytopojson/

for file in `ls tmp/earthquake/HazusSHP/*.shp`; do
	fieldname="`basename $file`"
	# generate GeoJSON, converting the coordinate system
	ogr2ogr -f GeoJSON tmp/geojson/$fieldname.json $file  -t_srs "+proj=longlat +ellps=WGS84 +no_defs +towgs84=0,0,0"
	# generate TopoJson
	topojson -p -o topojson/$fieldname.json tmp/geojson/$fieldname.json
	# make it pretty
	cat topojson/$fieldname.json | python -mjson.tool > tmp/prettytopojson/
done
# extract json schemas
python data_summary.py -i topojson/ -o tmp/summarytopojson/
