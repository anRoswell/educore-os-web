import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

# Replace innerHTML with quill-view
old_html = r'<div class="post-content mb-3" \[innerHTML\]="post\.contenido" style="color: #334155;"></div>'
new_html = r'<quill-view [content]="post.contenido" format="html" theme="snow" class="custom-quill-view"></quill-view>'

content = re.sub(old_html, new_html, content)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)

# We need to add a bit of CSS to fix quill-view styling since Tailwind resets it
css = """
/* Quill Viewer Custom Fixes */
.custom-quill-view .ql-editor {
  padding: 0;
  font-family: inherit;
  font-size: 1rem;
  color: #334155;
  white-space: pre-wrap;
}
.custom-quill-view .ql-editor p {
  margin-bottom: 0.75rem;
}
.custom-quill-view .ql-editor ul, .custom-quill-view .ql-editor ol {
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
}
.custom-quill-view .ql-editor ul {
  list-style-type: disc;
}
.custom-quill-view .ql-editor ol {
  list-style-type: decimal;
}
.custom-quill-view .ql-editor h1, 
.custom-quill-view .ql-editor h2, 
.custom-quill-view .ql-editor h3 {
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}
"""

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content2 = f.read()
    
content2 = content2.replace("styles: [`", "styles: [`" + css)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content2)

