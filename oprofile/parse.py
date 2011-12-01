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
        count = int(binary.find('count').text)
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
    myid = module_id_map.get(name, idd)
    instance = Module(myid, name, count, count)
    if myid == idd:
        modules.append(instance)
        idd += 1
    module_id_map[name] = myid
    for submodule in module.findall('module'):
        child = process_module(submodule)
        instance.addConnection(child)
    return instance

for binary in data.xpath('/profile/binary[position()<40]'):
    b = process_module(binary)
    modules[b.index] = b
    # count = try_get_count(binary)
    # aid = module_id_map.get(binary.attrib['name'], idd)
    # m = Module(aid, binary.attrib['name'], count, count)
    # if aid == idd:
    #     idd += 1
    #     modules.append(m)

    # # Now, parse all of the modules inside the binary
    # for module in binary.findall('module'):
    #     new_id = module_id_map.get(module.attrib['name'], idd)
    #     count = try_get_count(module)
    #     mm = Module(new_id, module.attrib['name'], count, count)
    #     m.addConnection(mm)
    #     if new_id == idd:
    #         idd += 1
    #         modules.append(mm)
    #     module_id_map[module.attrib['name']] = new_id

    #print json.dumps(m, cls=ModuleEncoder)  

print json.dumps(modules, cls=ModuleEncoder, indent=4)

#for element in data.iter():
#    print element
