import json
out = {}
for block in open('ABOUT').read().split('----'):
    title, body = block.strip().split('\n', 1)
    title = title.strip().lower()
    body = body.strip().replace('\n\n', 'XXXX').replace('\n', ' ').replace('XXXX', '\n');
    print title
    assert title not in out
    out[title] = body
print json.dumps(out)
