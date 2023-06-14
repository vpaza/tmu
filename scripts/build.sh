#!/bin/bash
#
# Copyright Daniel Hawton
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -ex

OUTDIR="${OUTDIR:-out}"

if [[ -d "${OUTDIR}" ]]; then
    rm -rf "${OUTDIR}"
fi

mkdir -p "${OUTDIR}"
npx --yes uglify-js --mangle --compress -o out/script.js -- script.js
npx --yes uglify-js --mangle --compress -o out/tools.js -- tools.js
npx --yes minify index.html > out/index.html
cp -Rp img out
cp -Rp geojson out