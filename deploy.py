#!/usr/bin/env python3

import re
import subprocess
from pathlib import Path

subprocess.run(["svn", "switch", "^/sailresults/branches/production"]);
subprocess.run(["svn", "merge", "^/sailresults/trunk"]);

path = Path("src/version.ts")

revnum = subprocess.check_output(
    ["svnversion", "."],
    text=True,
).strip().replace("M", "")

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

svn_commit = Path("svn-commit.tmp")
svn_commit.write_text(f"[deploy.py] publish r{revnum}")
