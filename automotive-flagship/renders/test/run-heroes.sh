#!/usr/bin/env bash
# Stage 3 hero stills (Founder review): 1920x1080 x 128 spp, each run hard-capped at 15 min (timeout 900).
cd "$(dirname "$0")/../../.." || exit 1
B="/c/Program Files/Blender Foundation/Blender 5.2/blender.exe"; R="$(pwd -W)"
run() { local name=$1; shift; echo "== $name $(date +%T)"; timeout 900 "$B" -b --factory-startup --python automotive-flagship/blender/build_scene.py -- --root "$R" --mode hero --res 1920x1080 --spp 128 --glare 0.45 --vignette 0.22 --out automotive-flagship/renders/test/$name --label stage3-$name "$@" 2>&1 | grep -E "\[build\] (render|comp)|Traceback|Error:"; echo "exit $? $(date +%T)"; }
run H1-pearl-front34   --pose 0    --variant pearl
run H2-carmine-front34 --pose 0    --variant carmine
run H3-pearl-rear34    --pose 0.75 --variant pearl
run H4-pearl-shoulder  --pose 0    --variant pearl --cam '{"pos":[4.3,0.72,5.75],"target":[0.9,0.52,0.95],"mm":85,"fstop":3.2,"focus":[1.15,0.6,1.02]}'
