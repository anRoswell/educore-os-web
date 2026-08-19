import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

edit_method = """  editarPublicacion(post: any) {
    this.editandoPublicacionId.set(post.id);
    this.nuevaPublicacion = { ...post };
    
    if (post.videoEmbedUrl) {
      if (post.videoEmbedUrl.includes('youtube.com/embed/')) {
        const id = post.videoEmbedUrl.split('youtube.com/embed/')[1];
        this.nuevaPublicacion.url_adjunta = `https://youtube.com/watch?v=${id}`;
      } else if (post.videoEmbedUrl.includes('player.vimeo.com/video/')) {
        const id = post.videoEmbedUrl.split('player.vimeo.com/video/')[1];
        this.nuevaPublicacion.url_adjunta = `https://vimeo.com/${id}`;
      }
    } else {
      this.nuevaPublicacion.url_adjunta = '';
    }
    
    this.onUrlChange(this.nuevaPublicacion.url_adjunta);
    this.modalPublicacion.set(true);
  }"""

content = re.sub(r'  editarPublicacion\(post: any\) \{[\s\S]*?\n  \}', edit_method, content)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
