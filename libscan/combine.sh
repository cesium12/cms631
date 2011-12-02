#!/bin/bash
sed "s/^\(.*\)\.ko$/\/\1:  Kernel/" kernel-modules | cat *.txt - | grep -v "^ " | sort > all-the-things
python -c "import json; print json.dumps(dict( map(str.strip, line.split(':')) for line in open('all-the-things') ))" > things.json
