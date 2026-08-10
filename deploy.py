#!/usr/bin/env python3

import re
import subprocess
import sys
from pathlib import Path

if (len(sys.argv) == 1):
    branch = "trunk";
elif (len(sys.argv) == 2):
    branch = f"branches/{sys.argv[1]}";
else:
    exit(1);

subprocess.run(["svn", "switch", "^/sailresults/branches/production"]);
subprocess.run(["svn", "merge", f"^/sailresults/{branch}"]);

path = Path("src/version.ts")

revnum = subprocess.check_output(
    ["svnversion", "."],
    text=True,
).strip().replace("M", "")

text = path.read_text()

text, count = re.subn(
    r'^(export const revnum\s*=\s*)"[^"]*"(;)$',
    rf'\1"r{revnum}"\2',
    text,
    count=1,
    flags=re.MULTILINE,
)

if count != 1:
    raise RuntimeError("Could not find revnum declaration")

path.write_text(text)

svn_commit = Path("svn-commit.tmp")
svn_commit.write_text(f"[deploy.py] publish r{revnum} from '{branch}'")
