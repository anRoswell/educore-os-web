import re

with open('src/styles.scss', 'r') as f:
    content = f.read()

replacement = '''
.search-input {
  border: none !important;
  background: transparent !important;
  padding-left: 0.5rem !important;
  font-size: 0.85rem !important;
  width: 100% !important;
  box-shadow: none !important;
  outline: none !important;
}

.search-input:focus {
  outline: none !important;
  box-shadow: none !important;
}
'''

# We need to replace the existing .search-input block.
content = re.sub(
    r'\.search-input \{[\s\S]*?outline: none;\n\}',
    replacement.strip(),
    content
)

with open('src/styles.scss', 'w') as f:
    f.write(content)
