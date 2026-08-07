from PIL import Image, ImageDraw

def create_icon(size, filename):
    img = Image.new('RGB', (size, size), color = (102, 126, 234))
    d = ImageDraw.Draw(img)
    # Just a simple rectangle or something
    d.rectangle([(size*0.2, size*0.2), (size*0.8, size*0.8)], fill=(118, 75, 162))
    img.save(filename)

create_icon(192, 'icon-192.png')
create_icon(512, 'icon-512.png')
