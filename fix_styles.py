with open('src/styles.scss', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.strip() == '`]':
        break
    new_lines.append(line)

with open('src/styles.scss', 'w') as f:
    f.writelines(new_lines)
