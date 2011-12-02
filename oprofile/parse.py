import lxml.etree as etree
import json
import collections
# Desired output file format

# List of lists, each sub element is of the form 7-tuple [index in
# list, module name, null, null, total time spent in, time in self,
# map of index to 6-tuple rep of other]


class Module:
    def __init__(self, index, name, timeIn, timeSelf):
        self.index = index
        self.name = name
        self.timeIn = timeIn
        self.timeSelf = timeSelf
        self.connectedTo = {}

    def addConnection(self, other):
        self.connectedTo[other.index] = other

class ModuleEncoder(json.JSONEncoder):
    def moduleToList(self, obj):
        return [obj.index, obj.name, None, None, obj.timeIn, obj.timeSelf]
    def default(self, obj):
        # print obj, isinstance(obj, Module), type(obj)
        if isinstance(obj, Module):
            new_map = {}
            for (k, v) in obj.connectedTo.iteritems():
                new_map[k] = self.moduleToList(v)
            return self.moduleToList(obj) + [new_map]
        return json.JSONEncoder.default(self, obj)

#m = Module(0, 'test', 643, 234)
#m.addConnection(Module(1, 'test2', 500, 0))
#print json.dumps(m, cls=ModuleEncoder)

def extractSymbol(tree, id_num):
    return tree.xpath("/profile/symboltable/symboldata[@id='%d']" % id_num)

def try_get_count(element):
    count = 1
    try:
        count = int(element.find('count').text)
    except Exception:
        pass
    return count


data = etree.parse(open('session.callgraph.xml'))

modules = []
idd = 0
module_id_map = {}

def process_module(module):
    global idd
    count = try_get_count(module)
    name = module.attrib['name']
    if 'range:' in name:
        return None
    myid = module_id_map.get(name, idd)
    instance = Module(myid, name, count, count)
    if myid == idd:
        modules.append(instance)
        idd += 1
    module_id_map[name] = myid
    for submodule in module.findall('module'):
        child = process_module(submodule)
        if child != None:
            instance.addConnection(child)
    return instance

def extract_subtree(root):
    sublist = []
    stack = [root]
    while len(stack) > 0:
        element = stack[0]
        sublist.append(element)
        stack = stack[1:]
        for (k, v) in element.connectedTo.iteritems():
            stack.append(v)
    return sublist
        
binary_list = []
for binary in data.xpath('/profile/binary'):
    b = process_module(binary)
    if b != None:
        modules[b.index] = b
    binary_list.append(b)

alldump = open('grind.json', 'w')
json.dump(modules, alldump, cls=ModuleEncoder, indent=4)
alldump.close()

for binary in binary_list:
    outname = binary.name.replace('/', '_') + '.json'
    outfile = open(outname, 'w')
    json.dump(extract_subtree(binary), outfile, cls=ModuleEncoder,
              indent=4)
    outfile.close()

    
#for element in data.iter():
#    print element
