"""
Markdown to HTML rendering utility.
"""
import re
from typing import Optional


def markdown_to_html(markdown_content: str) -> str:
    """
    Convert Markdown to HTML.
    
    Uses a simple markdown parser. For production, consider using:
    - markdown2 (pip install markdown2)
    - mistune (pip install mistune)
    - markdown (pip install markdown)
    
    This is a basic implementation. For full markdown support, use a library.
    """
    html = markdown_content
    
    # Headers
    html = re.sub(r'^# (.+)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.+)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.+)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^#### (.+)$', r'<h4>\1</h4>', html, flags=re.MULTILINE)
    
    # Bold
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'__(.+?)__', r'<strong>\1</strong>', html)
    
    # Italic
    html = re.sub(r'\*(.+?)\*', r'<em>\1</em>', html)
    html = re.sub(r'_(.+?)_', r'<em>\1</em>', html)
    
    # Links
    html = re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2">\1</a>', html)
    
    # Lists (basic)
    lines = html.split('\n')
    in_list = False
    result = []
    
    for line in lines:
        if line.strip().startswith('- ') or line.strip().startswith('* '):
            if not in_list:
                result.append('<ul>')
                in_list = True
            item = line.strip()[2:]
            result.append(f'<li>{item}</li>')
        elif line.strip().startswith(('1. ', '2. ', '3. ', '4. ', '5. ')):
            if not in_list:
                result.append('<ol>')
                in_list = True
            item = re.sub(r'^\d+\.\s+', '', line.strip())
            result.append(f'<li>{item}</li>')
        else:
            if in_list:
                result.append('</ul>' if '<ul>' in '\n'.join(result) else '</ol>')
                in_list = False
            if line.strip():
                result.append(f'<p>{line}</p>')
            else:
                result.append('')
    
    if in_list:
        result.append('</ul>')
    
    html = '\n'.join(result)
    
    # Code blocks (basic)
    html = re.sub(r'`(.+?)`', r'<code>\1</code>', html)
    
    # Line breaks
    html = html.replace('\n\n', '</p><p>')
    
    return html


def markdown_to_html_with_library(markdown_content: str, library: str = "markdown2") -> str:
    """
    Convert Markdown to HTML using an external library.
    
    Args:
        markdown_content: Markdown text
        library: Library to use ("markdown2", "mistune", or "markdown")
    
    Returns:
        HTML string
    """
    try:
        if library == "markdown2":
            import markdown2
            return markdown2.markdown(markdown_content, extras=['fenced-code-blocks', 'tables'])
        elif library == "mistune":
            import mistune
            renderer = mistune.create_markdown(renderer=mistune.HTMLRenderer())
            return renderer(markdown_content)
        elif library == "markdown":
            import markdown
            return markdown.markdown(markdown_content, extensions=['fenced_code', 'tables'])
        else:
            # Fallback to basic renderer
            return markdown_to_html(markdown_content)
    except ImportError:
        # Fallback to basic renderer if library not installed
        return markdown_to_html(markdown_content)

