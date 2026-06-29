import nh3

ALLOWED_TAGS = {"b", "i", "em", "strong", "p", "br", "ul", "ol", "li", "blockquote"}

def sanitize_html(text: str) -> str:
    if not text:
        return text
    return nh3.clean(text, tags=ALLOWED_TAGS)

def sanitize_plain(text: str) -> str:
    """Strip all HTML — for titles, names, etc."""
    if not text:
        return text
    return nh3.clean(text, tags=set())
