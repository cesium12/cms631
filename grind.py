#!/usr/bin/python
import sys
import re
import json
import collections

ob = fx = fn = cob = cfx = cfn = None
ids = collections.defaultdict(dict)
fns = {}
head = { 'positions' : [ 'line' ],
            'events' : None,
           'summary' : None }
total = 0
func = None
call = None

for line in open(sys.argv[1], 'r'):
    if not line.strip():
        continue
    match = re.match(r'(?P<k>[a-z]+): (?P<v>.+)$', line, re.I)
    if match:
        k, v = match.group('k', 'v')
        if k.strip() in head:
            head[k] = v.strip().split()
        continue
    match = re.match(r'(?P<k>[a-z]+)=(\((?P<idn>[0-9]+)\))?(?P<v>.+)?$', line, re.I)
    if match:
        k, idn, v = match.group('k', 'idn', 'v')
        k = k.strip()
        assert idn is not None or v is not None
        if idn is not None:
            if k.endswith('ob'):
                ik = 'ob'
            elif k.endswith('fn'):
                ik = 'fn'
            elif k[-2] == 'f':
                ik = 'fx'
            if v is not None:
                assert idn not in ids[ik]
                ids[ik][idn] = v
            else:
                v = ids[ik][idn]
        v = v.strip()
        if k == 'calls':
            call = [ cob, cfx, cfn, int(v.split()[0]), None ] # count, cost
            func[-1].append(call)
        elif k == 'cob':
            cob = v
        elif k == 'cfn':
            cfn = v
        elif k.startswith('cf'):
            cfx = v
        else:
            if k == 'ob':
                cob = ob = v
                func = None
                cfx = fx
            elif k == 'fn':
                cfn = fn = v
                func = fns[(ob, fn)] = [ ob, fx, fn, 0, 0, [] ] # total, self
                cob = ob
            elif k.startswith('f'):
                cfx = fx = v
            else:
                assert False
    else:
        cost = int(line.split(None, 1)[1])
        if call is not None:
            call[-1] = cost
            call = None
        else:
            total += cost
            func[4] += cost
        func[3] += cost

def functions():
    #print head['summary'][0]
    #print total
    top = list(enumerate(sorted(fns.values(), key=lambda f: f[4], reverse=True)[:1000]))
    topset = dict( (tuple(f[:3]), i) for i, f in top )
    out = []
    for i, f in top:
        line = [ i ] + f[:-1]
        cs = {}
        for c in f[-1]:
            if tuple(c[:3]) in topset:
                i = topset[tuple(c[:3])]
                if i in cs:
                    cs[i][-2] += c[-2]
                    cs[i][-1] += c[-1]
                else:
                    cs[i] = [ i ] + c
        line.append(cs)
        out.append(line)
    json.dump(out, sys.stdout)

def modules():
    ms = collections.defaultdict(lambda: [ None, None, None, None, 0, 0, collections.defaultdict(lambda: [ None, None, None, None, 0, 0 ]) ])
    indices = dict(map(reversed, enumerate(sorted(set( f[0] for f in fns.values() )))))
    for f in fns.values():
        if f[0] == '???':
            continue
        ms[f[0]][0] = indices[f[0]]
        ms[f[0]][1] = f[0]
        ms[f[0]][4] += f[3]
        ms[f[0]][5] += f[4]
        for c in f[5]:
            if c[0] == '???':
                continue
            ms[f[0]][6][indices[c[0]]][0] = indices[c[0]]
            ms[f[0]][6][indices[c[0]]][1] = c[0]
            ms[f[0]][6][indices[c[0]]][4] += c[3]
            ms[f[0]][6][indices[c[0]]][5] += c[4]
    #for k, v in ms.items():
        #print k, v
    json.dump(list(sorted(ms.values())), sys.stdout)
    #for k in ms.keys(): print k
modules()
