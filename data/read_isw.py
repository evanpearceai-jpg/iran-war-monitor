from html.parser import HTMLParser

class TextExtract(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.in_article = False
        self.skip = False
    def handle_starttag(self, tag, attrs):
        cls = dict(attrs).get('class','')
        if any(x in cls for x in ('field-items','field--name-body','entry-content','node__content')):
            self.in_article = True
        if tag in ('script','style','nav','header','footer'):
            self.skip = True
    def handle_endtag(self, tag):
        if tag in ('script','style','nav','header','footer'):
            self.skip = False
    def handle_data(self, data):
        if self.in_article and not self.skip:
            t = data.strip()
            if t:
                self.text.append(t)

with open('data/isw_report.html','r',encoding='utf-8',errors='ignore') as f:
    html = f.read()

p = TextExtract()
p.feed(html)
body = '\n'.join(p.text)
print(body[:12000])
