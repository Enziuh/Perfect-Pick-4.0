#!/usr/bin/env python3
"""Local-only continuity package. No network, deployment, or application execution."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[2]
MEMORY = ['AGENTS.md', 'START_HERE.md', 'PROJECT_HISTORY.md', 'EVIDENCE_INDEX.md',
          'RESEARCH_STATUS.md', 'AGENT_HANDOFFS.md', 'CHANGELOG.md', 'SYNC_STATE.json']
EXTRA = ['docs/memory/RESTART_WORKFLOW.md', 'tools/memory/checkpoint.py']

def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args], text=True).strip()

def digest(data):
    return hashlib.sha256(data).hexdigest()

def validate():
    state = json.loads((ROOT / 'SYNC_STATE.json').read_text())
    assert state['schemaVersion'] == 1 and isinstance(state.get('phase2Authorized'), bool)
    git('rev-parse', '--verify', state['baselineCommit'] + '^{commit}')
    text = '\n'.join((ROOT / p).read_text() for p in MEMORY)
    for commit in set(re.findall(r'\b[0-9a-f]{7,40}\b', text)):
        # Decimal workflow/job IDs are metadata; full 40-character hashes still verify.
        if commit.isdecimal() and len(commit) < 40:
            continue
        git('rev-parse', '--verify', commit + '^{commit}')
    for p in MEMORY + EXTRA:
        for target in re.findall(r'\]\(([^)]+)\)', (ROOT / p).read_text()):
            if '://' in target or target.startswith('#'):
                continue
            assert ((ROOT / p).parent / target.split('#')[0]).exists(), (p, target)
    print('PASS: JSON, commit references, memory/workflow document links')

def build(output):
    validate()
    assert not git('status', '--porcelain'), 'Commit intended changes first; preserve unrelated changes.'
    assert not output.exists(), 'Refusing to overwrite package'
    assert not output.resolve().is_relative_to(ROOT / '.git')
    tracked = git('ls-files').splitlines()
    # Supporting records only; never sweep working directories or Git history.
    paths = sorted(set(MEMORY + EXTRA + [p for p in tracked if p.startswith('docs/') and p.endswith('.md')]
                       + ['.github/workflows/pages.yml']
                       + [p for p in ['docs/memory/release/ARTIFACT_MANIFEST.json'] if p in tracked]))
    data = {}
    for p in paths:
        assert not (ROOT / p).is_symlink(), 'Symlink excluded'
        data[p] = (ROOT / p).read_bytes()
    manifest = {'schemaVersion': 1, 'checkpointCommit': git('rev-parse', 'HEAD'),
                'branch': git('branch', '--show-current'),
                'scope': 'Continuity records, supporting Markdown documentation, reviewed release hash manifest, workflow reference and memory tool only; not a source checkout or deployment payload.',
                'files': {p: digest(b) for p, b in data.items()}}
    data['MANIFEST.json'] = (json.dumps(manifest, indent=2) + '\n').encode()
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'x', zipfile.ZIP_DEFLATED) as z:
        for p, b in data.items():
            z.writestr(p, b)
    receipt = {'package': output.name, 'sha256': digest(output.read_bytes()),
               'checkpointCommit': manifest['checkpointCommit'], 'fileCount': len(data)}
    receipt_path = output.with_suffix('.receipt.json')
    assert not receipt_path.exists(), 'Receipt already exists'
    receipt_path.write_text(json.dumps(receipt, indent=2) + '\n')
    verify(output)
    print(json.dumps(receipt))

def verify(package):
    receipt = json.loads(package.with_suffix('.receipt.json').read_text())
    assert digest(package.read_bytes()) == receipt['sha256'], 'Archive hash mismatch'
    with zipfile.ZipFile(package) as z:
        names = z.namelist()
        assert len(names) == len(set(names)), 'Duplicate archive paths'
        manifest = json.loads(z.read('MANIFEST.json'))
        assert manifest['checkpointCommit'] == receipt['checkpointCommit']
        assert len(names) == receipt['fileCount']
        assert set(names) == set(manifest['files']) | {'MANIFEST.json'}, 'Inventory mismatch'
        with tempfile.TemporaryDirectory(prefix='pp-memory-restore-') as tmp:
            for p in names:
                path = Path(p)
                assert not path.is_absolute() and '..' not in path.parts, 'Unsafe path'
                assert not p.endswith('/'), 'Unexpected directory entry'
                target = Path(tmp) / p
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(z.read(p))
            for p, expected in manifest['files'].items():
                assert digest((Path(tmp) / p).read_bytes()) == expected, 'Restored hash mismatch'
            json.loads((Path(tmp) / 'SYNC_STATE.json').read_text())
    print('PASS: archive receipt, exact inventory, safe temporary restoration, all restored SHA-256 hashes')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['validate', 'build', 'verify'])
    parser.add_argument('package', nargs='?', type=Path)
    args = parser.parse_args()
    if args.action == 'validate':
        validate()
    else:
        assert args.package, 'Supply package path'
        (build if args.action == 'build' else verify)(args.package)
