#!/bin/bash
#
# Builds a pyinstaller-based Windows exe for pynetworktables2js
#

cd $(dirname $0)
docker run --rm -v "$(pwd):/src:Z" -e PYTHONPATH=/src cdrx/pyinstaller-windows:python2
