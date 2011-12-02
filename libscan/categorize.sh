#!/bin/bash

#for i in $(find /lib /lib64 /usr/lib /usr/lib64 -name "*.so*");
#for i in $(find /bin /sbin/ /usr/bin /usr/sbin -perm /+x);
for i in $(find /usr/libexec);
do
    PACKAGE=$(rpm -q --whatprovides $i)
    CATEGORY=$(rpm -q $PACKAGE --info | grep "^Group" | cut -d: -f2)
    echo "$i: $CATEGORY"
done
