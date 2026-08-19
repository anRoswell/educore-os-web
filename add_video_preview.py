import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

# 1. Add videoPreviewUrl and onUrlChange logic
logic = """  videoPreviewUrl = signal<any>(null);

  onUrlChange(url: string) {
    if (!url) {
      this.videoPreviewUrl.set(null);
      return;
    }
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch && ytMatch[1]) {
      this.videoPreviewUrl.set(this.getSafeUrl(`https://www.youtube.com/embed/${ytMatch[1]}`));
      return;
    }
    const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      this.videoPreviewUrl.set(this.getSafeUrl(`https://player.vimeo.com/video/${vimeoMatch[1]}`));
      return;
    }
    this.videoPreviewUrl.set(null);
  }"""

content = content.replace("  // Archivos Adjuntos", logic + "\n\n  // Archivos Adjuntos")

# 2. Add to HTML template
old_input = r'<input type="text" class="form-control-modern" placeholder="https://youtube.com/watch\?v=\.\.\." \[\(ngModel\)\]="nuevaPublicacion.url_adjunta">'
new_input = """<input type="text" class="form-control-modern" placeholder="https://youtube.com/watch?v=..." 
                           [(ngModel)]="nuevaPublicacion.url_adjunta" (ngModelChange)="onUrlChange($event)">
                    
                    @if (videoPreviewUrl()) {
                      <div class="mt-2 video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;">
                        <iframe [src]="videoPreviewUrl()" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe>
                      </div>
                    }"""

content = re.sub(old_input, new_input, content)

# 3. Clear preview on open
content = re.sub(r'(abrirModalPublicacion\(\) \{\n.*?editandoPublicacionId.set\(null\);)', r'\1\n    this.videoPreviewUrl.set(null);', content)

# 4. Trigger preview on edit if url exists
edit_post_logic = r'this\.editandoPublicacionId\.set\(post\.id\);\n\s*this\.nuevaPublicacion = \{ \.\.\.post \};\n\s*this\.modalPublicacion\.set\(true\);'
edit_post_logic_new = """this.editandoPublicacionId.set(post.id);
    this.nuevaPublicacion = { ...post };
    this.onUrlChange(post.url_adjunta || '');
    this.modalPublicacion.set(true);"""
content = re.sub(edit_post_logic, edit_post_logic_new, content)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
