#!/usr/bin/env python

from os import listdir
from os.path import isfile, join
import sys, getopt
import json
import pandas as pd

def extractProperties(result, properties):
    for key in properties.keys():
        result[key] = properties[key];
    return result;

def extractGeometry(geometry):
    result = {};
    for key in geometry.keys():
        if (key != 'properties'):
            result[key] = geometry[key];
        else:
            extractProperties(result, geometry[key]);
    return result;

def extractDataframe(inputfile):
    df = pd.DataFrame();
    with open(inputfile, "r") as f:
        data = json.loads(f.read())
        objects = data['objects'];
        for key in objects.keys():
        	if 'geometries' in objects[key]:
	            for geometry in objects[key]['geometries']:
	                row = pd.DataFrame([extractGeometry(geometry)]);
	                df = df.append(row);
	        else:
	        	print(f.name + ' does not have geometries');
    return df;

def extractToCSV(inputDir, outputDir, cols):
	output = None;
	for f in listdir(inputDir):
		fullFile = join(inputDir,f);
		if isfile(fullFile) and not isfile(join(outputDir,f)):
			print('Extracting data from "' + f + '" ...');
			df = extractDataframe(fullFile);
			if len(cols) > 0:
				if all(x in df for x in cols):
					df.to_csv(join(outputDir,f), cols=cols, index=False);
				else:
					print('Columns '+ str(cols) + ' were not found in "' + f + '" ...');
			else:
				df.to_csv(join(outputDir,f), index=False);
		else:
			print('Skipping "' + f + '" ...');

def main(argv):
   usage = 'extract_points.py -i <inputDir> -o <outputDir> [-d] <column_1> <column_2> ... <column_n>';
   inputDir = '';
   outputDir = '';
   cols = None;
   try:
      opts, args = getopt.getopt(argv,"dhi:o:",["inputDir=","outputDir="]);
   except getopt.GetoptError:
      print(usage);
      sys.exit(2);
   for opt, arg in opts:
      if opt == '-h':
         print(usage);
         sys.exit();
      elif opt in ("-i", "--inputDir"):
         inputDir = arg;
      elif opt in ("-o", "--outputDir"):
         outputDir = arg;
      elif opt in ("-d", "--default"):
         cols = ['Latitude','Longitude','FunctDay1'];	
   extractToCSV(inputDir, outputDir, args);

if __name__ == "__main__":
   main(sys.argv[1:])
