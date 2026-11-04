'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {TEAMS,TEAM_FILES,validateLogo}=require('../tools/security/team-assets.cjs');
const {TEAM_NAMES}=require('../tools/presentation/contract-dashboard.cjs');
test('all32 original local NFL logos have exact canonical API/team mappings and safe relative paths',()=>{
 assert.deepEqual([...TEAMS].sort(),Object.keys(TEAM_NAMES).sort());assert.equal(new Set(TEAM_FILES).size,32);
 for(const f of TEAM_FILES){assert.equal(validateLogo(fs.readFileSync(path.join(__dirname,'../website',f),'utf8')),true);assert.equal(new URL(f,'https://example.invalid/Perfect-Pick-4.0/').pathname,'/Perfect-Pick-4.0/'+f);}
 assert(TEAM_FILES.includes('assets/teams/was.svg')&&TEAM_FILES.includes('assets/teams/jax.svg')&&TEAM_FILES.includes('assets/teams/lac.svg')&&TEAM_FILES.includes('assets/teams/sf.svg'));
});
test('SVG allowlist denies active, external, entity, unknown and malformed content',()=>{
 const good=fs.readFileSync(path.join(__dirname,'../website/assets/teams/sf.svg'),'utf8');
 for(const bad of ['<script/>','<image href="https://example.invalid/x"/>','<foreignObject/>','<path onload="alert(1)"/>','<path fill="url(https://example.invalid/x)"/>','<path fill="url(#missing)"/>','&xxe;','<!DOCTYPE svg>','<unknown/>','<g>'])assert.throws(()=>validateLogo(good.replace('</svg>',bad+'</svg>')));
});
