#!/usr/bin/env python
import pandas as pd
import numpy as np

def getViolationsScore():
	df = pd.read_csv('data/tmp/food/violations_plus.csv', encoding="windows-1252")
	df = df[['business_id','date','risk_category']].dropna()
	# drop invalid dates
	df = df[df['date'] < 20141231]
	latest = df['date'].max()
	oldest = df['date'].min()
	def computeViolationScore(row):
		if row['risk_category'] == 'Low Risk':
			risk = 1
		elif row['risk_category'] == 'Moderate Risk':
			risk = 2
		elif row['risk_category'] == 'High Risk':
			risk = 3
		else:
			return 0
		return risk * (row['date'] - oldest) * 100 / (3 * (latest - oldest))	
	df['violationScore'] = df.apply(computeViolationScore, axis=1)
	return df.groupby(['business_id'])['violationScore'].agg(np.mean)

def getLatestInspections():
	df = pd.read_csv('data/tmp/food/inspections.csv', encoding="windows-1252")
	df = df[['business_id','Score','date']].dropna()
	return df[df.groupby(['business_id'])['date'].transform(max) == df['date']]
	
def getBusinessData():
	df = pd.read_csv('data/tmp/food/businesses.csv', encoding="windows-1252")
	df = df[['business_id','name','latitude','longitude']].dropna()
	df = df[df.latitude > 36]
	df = df[df.longitude < -122.3]
	data = df.merge(getLatestInspections(), how='inner', on='business_id')
	data = data.join(getViolationsScore(), how='left', on='business_id')
	data['violationScore'].fillna(value=0, inplace=True)
	data['total'] = data['Score'] - data['violationScore']
#	data = data[data['total'] > 99] 
	return data

df = getBusinessData()
df.to_csv('data/tmp/food_inspection.csv', cols=['latitude','longitude','total'], index=False)
