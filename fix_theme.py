import os

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace hardcoded white/black colors with semantic Tailwind classes
    
    # text-white -> text-foreground
    content = content.replace('text-white', 'text-foreground')
    
    # borders
    content = content.replace('border-white/5', 'border-foreground/5')
    content = content.replace('border-white/10', 'border-foreground/10')
    content = content.replace('border-white/20', 'border-foreground/20')
    content = content.replace('border-white/30', 'border-foreground/30')
    
    # backgrounds (white)
    content = content.replace('bg-white/5', 'bg-foreground/5')
    content = content.replace('bg-white/10', 'bg-foreground/10')
    content = content.replace('bg-white/20', 'bg-foreground/20')
    
    # backgrounds (black) - we want them dark in both maybe? Or inverted?
    # If a glass card was bg-black/40 in dark mode, in light mode it should be bg-white/40 maybe?
    # Actually, we can use bg-foreground/5 or bg-background for glass.
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk('apps/frontend/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            replace_in_file(os.path.join(root, file))
