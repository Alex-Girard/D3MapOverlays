#!/usr/bin/env python

from os import listdir
from os.path import isfile, join
import sys, getopt
import json

def extractObject(keySet, obj):
	if type(obj) is list:
		result = {};
		for element in obj:
			val = extractObject(keySet, element);
			result = dict(result, **val)
		return result;
	elif type(obj) is dict:
		result = {}
		for key in obj.keys():
			if (key not in keySet):
				keySet[key] = 1;
				result[key] = extractObject(keySet, obj[key]);
		return result;
	else:
		return { 'type' : str(type(obj))};

def extractSummary(inputfile):
	summary = {};
	with open(inputfile, "r") as f:
		data = json.loads(f.read())
		for key in data['objects'].keys():
			summary['objectName'] = key;
			keySet = {};
			summary['object'] = extractObject(keySet, data['objects'][key]);
	return summary;

def describe(inputDir, outputDir):
	output = None;
	for f in listdir(inputDir):
		fullFile = join(inputDir,f);
		if isfile(fullFile):
			output = open(join(outputDir,f), 'w');
			output.write("[");
			jsonFile = {};
			jsonFile['Filename'] = f;
			jsonFile['Summary'] = extractSummary(fullFile);
			output.write(json.JSONEncoder(sort_keys=True, indent=4).encode(jsonFile));
			output.write("]\n");
			output.close();

def main(argv):
   inputDir = '';
   outputDir = '';
   try:
      opts, args = getopt.getopt(argv,"hi:o:",["inputDir=","outputDir="]);
   except getopt.GetoptError:
      print('data_summary.py -i <inputDir> -o <outputDir>');
      sys.exit(2);
   for opt, arg in opts:
      if opt == '-h':
         print('data_summary.py -i <inputDir> -o <outputDir>');
         sys.exit();
      elif opt in ("-i", "--inputDir"):
         inputDir = arg;
      elif opt in ("-o", "--outputDir"):
         outputDir = arg;
   describe(inputDir, outputDir);

if __name__ == "__main__":
   main(sys.argv[1:])

