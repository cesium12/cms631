import lxml.etree as etree

data = etree.parse(open('session.report.xml'))

for element in data.iter():
    print element
