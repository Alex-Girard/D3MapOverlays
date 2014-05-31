#/bin/bash

for i in *.json; do   
	echo "latitude,longitude,pointValue" > $i.csv
	tail -n+2 $i >> $i.csv
	rm $i
done

echo "latitude,longitude,pointValue" > all.csv
for i in *.csv; do 
	tail -n +2 $i  >> all.csv
done

