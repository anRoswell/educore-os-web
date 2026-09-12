import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfigRequirement {
  id: string;
  title: string;
  description: string;
  actionText: string;
  actionTab: string;
  completed: boolean;
}

@Component({
  selector: 'app-config-guide',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-center" data-testid="config-guide">
      <div class="mb-5 flex justify-center">
        <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
          <span class="text-3xl">⚠️</span>
        </div>
      </div>
      
      <h2 class="text-xl font-bold text-slate-800 mb-2">{{ title() }}</h2>
      <p class="text-slate-500 mb-6 max-w-lg mx-auto">{{ description() }}</p>
      
      <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left max-w-2xl mx-auto">
        <h3 class="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <span>⚙️</span> Requisitos Previos:
        </h3>
        
        <div class="space-y-3">
          @for (req of requirements(); track req.id) {
            <div class="flex items-center justify-between p-3 rounded-lg border transition-colors"
                 [class.bg-white]="!req.completed"
                 [class.border-slate-200]="!req.completed"
                 [class.bg-emerald-50]="req.completed"
                 [class.border-emerald-200]="req.completed">
              
              <div class="flex items-start gap-3">
                <div class="mt-0.5">
                  @if (req.completed) {
                    <span class="text-emerald-500 text-lg">✅</span>
                  } @else {
                    <span class="text-amber-500 text-lg">⏳</span>
                  }
                </div>
                <div>
                  <h4 class="font-bold text-sm" [class.text-slate-800]="!req.completed" [class.text-emerald-800]="req.completed">
                    {{ req.title }}
                  </h4>
                  <p class="text-xs text-slate-500 mt-0.5">{{ req.description }}</p>
                </div>
              </div>
              
              @if (!req.completed) {
                <button type="button" 
                        class="btn-primary btn-sm shrink-0 shadow-sm"
                        (click)="onActionClick(req.actionTab)">
                  {{ req.actionText }}
                </button>
              } @else {
                <span class="badge-mini bg-emerald-100 text-emerald-800 border-emerald-200 font-bold px-2 py-1 text-[10px]">
                  Configurado
                </span>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-primary {
      background-color: #4f46e5;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 600;
      transition: background-color 0.2s;
      cursor: pointer;
    }
    .btn-primary:hover {
      background-color: #4338ca;
    }
    .btn-sm {
      font-size: 0.875rem;
      padding: 0.375rem 0.75rem;
    }
    .badge-mini {
      display: inline-block;
      border-radius: 0.375rem;
      border: 1px solid transparent;
    }
  `]
})
export class ConfigGuideComponent {
  title = input<string>('Configuración Incompleta');
  description = input<string>('Para poder usar esta vista, el sistema necesita que configures algunos parámetros previos. Por favor completa los requisitos faltantes a continuación:');
  requirements = input.required<ConfigRequirement[]>();
  
  onNavigate = output<string>();

  onActionClick(tab: string): void {
    this.onNavigate.emit(tab);
  }
}
