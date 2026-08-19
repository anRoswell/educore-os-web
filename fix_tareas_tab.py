import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

# 1. Remove <div style="display:none;">
content = content.replace("      <!-- Header Original Oculto -->\n      <div style=\"display:none;\">\n", "")

# 2. Fix the end of the template
# We have:
#       }
#     </div>
#       }
#   `,
# We will change it to:
#       }
#       }
#     </div>
#   `,
content = content.replace("      }\n    </div>\n      }\n  `,", "      }\n      }\n    </div>\n  `,")

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
