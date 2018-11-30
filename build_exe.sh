#!/bin/bash
#
# Builds a pyinstaller-based Windows exe for pynetworktables2js
#

cd $(dirname $0)
docker run --rm -v "$(pwd):/src:Z" -e PYTHONPATH=/src cdrx/pyinstaller-windows:python2
docker run --rm -v "$(pwd):/src:Z" --entrypoint /bin/bash cdrx/pyinstaller-windows:python2 -c "chown -R $(id -u $USERNAME) /src/dist"

zip dist/pynetworktables2js-$(git describe --tags).zip dist/windows/pynetworktables2js.exe
