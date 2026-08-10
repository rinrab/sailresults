#!/usr/bin/env python3

import re
import subprocess
import sys
from pathlib import Path

subprocess.run(["svn", "switch", "^/sailresults/branches/production"]);
subprocess.run(["svn", "merge", "^/sailresults/trunk"]);

path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("src/version.ts")

revnum = subprocess.check_output(
    ["svnversion", "."],
    text=True,
).strip()

text = path.read_text()

text, count = re.subn(
    r'^(export const revnum\s*=\s*)"[^"]*"(;)$',
    rf'\1"{revnum}"\2',
    text,
    count=1,
    flags=re.MULTILINE,
)

if count != 1:
    raise RuntimeError("Could not find revnum declaration")

path.write_text(text)
