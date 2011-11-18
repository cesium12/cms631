#!/bin/bash

#for i in $(find /lib -name "*.so");
for i in $(find /usr/sbin -perm /+x);
do
    PACKAGE=$(rpm -q --whatprovides $i)
    CATEGORY=$(rpm -q $PACKAGE --info | grep "^Group" | cut -d: -f2)
    echo "$i: $CATEGORY"
done