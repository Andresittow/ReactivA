import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, inject, effect, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { HelpRequestsService, HelpRequest } from '../core/services/help-requests.service';

@Component({
  selector: 'app-help', standalone: true, imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './help.html', styleUrl: './help.scss', changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpComponent implements OnDestroy {
  readonly auth = inject(AuthService);
  private readonly service = inject(HelpRequestsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private generation = 0;
  private destroyed = false;
  private loadedUserId: string | null = null;
  query = '';
  subject = '';
  message = '';
  sending = false;
  loading = false;
  error = '';
  sendError = '';
  toastMessage = '';
  requests: HelpRequest[] = [];
  get categories() {
    return this.auth.role() === 'docente' ? [
      { id: 'teacher', title: 'Panel docente', description: 'Consulta tu panel de enseñanza.', icon: 'ph ph-chalkboard-teacher', colorTheme: 'blue', linkRoute: '/teacher-dashboard' },
      { id: 'classrooms', title: 'Mis aulas', description: 'Crea aulas, comparte el PIN y asigna talleres.', icon: 'ph ph-users', colorTheme: 'purple', linkRoute: '/my-classrooms' },
      { id: 'settings', title: 'Configuración', description: 'Consulta las preferencias de tu cuenta.', icon: 'ph ph-gear', colorTheme: 'cyan', linkRoute: '/settings' }
    ] : [
      { id: 'virtual-lab', title: 'Laboratorio virtual', description: 'Explora equipos, registra experimentos y balancea ecuaciones.', icon: 'ph ph-test-tube', colorTheme: 'cyan', linkRoute: '/virtual-lab' },
      { id: 'periodic-table', title: 'Tabla periódica', description: 'Explora elementos y sus propiedades.', icon: 'ph ph-table', colorTheme: 'purple', linkRoute: '/periodic-table' },
      { id: 'organic-mission', title: 'Misión orgánica', description: 'Practica química orgánica.', icon: 'ph ph-tree-structure', colorTheme: 'amber', linkRoute: '/mision-organica' },
      { id: 'profile', title: 'Mi perfil', description: 'Revisa tu progreso, historial y aula. Guarda tu ficha como PDF.', icon: 'ph ph-user-circle', colorTheme: 'blue', linkRoute: '/profile' }
    ];
  }
  readonly guideSteps = [
    { stepBadge: 'Paso 1', title: 'Elige una actividad', subtitle: 'Aprende a tu ritmo', description: 'Abre un módulo desde el menú y revisa sus instrucciones.', tip: 'Si eres docente, crea tu primera aula en Mis aulas.', icon: 'ph ph-target', colorTheme: 'cyan' },
    { stepBadge: 'Paso 2', title: 'Practica y explora', subtitle: 'Aprendizaje interactivo', description: 'Ajusta coeficientes y utiliza los equipos del laboratorio.', tip: 'Puedes repetir las actividades; el laboratorio concede XP una sola vez por actividad.', icon: 'ph ph-toolbox', colorTheme: 'blue' },
    { stepBadge: 'Paso 3', title: 'Revisa tu progreso', subtitle: 'Datos de tu cuenta', description: 'Consulta XP, nivel, insignias e historial en tu perfil.', tip: 'Las calificaciones y rúbricas sin registros se muestran vacías.', icon: 'ph ph-certificate', colorTheme: 'purple' }
  ];
  faqs = [
    { id: 'balanceo', question: '¿Cómo balanceo una ecuación?', categoryLabel: 'Laboratorio', isOpen: true,
      answer: 'Ajusta los coeficientes hasta conservar el número de átomos de cada elemento a ambos lados. El primer balanceo de cada ejercicio concede 50 XP. Repetirlo no vuelve a sumar XP.' },
    { id: 'experimentos', question: '¿Cómo registro un experimento?', categoryLabel: 'Laboratorio', isOpen: false,
      answer: 'Balancea la ecuación del ejercicio, deja un recipiente y al menos un reactivo activos en la mesa y pulsa Registrar experimento. La primera vez por ejercicio concede 50 XP adicionales. Puedes volver a practicar sin duplicar puntos.' },
    { id: 'aula', question: '¿Cómo ingreso a mi aula con un PIN?', categoryLabel: 'Aulas', isOpen: false,
      answer: 'En Perfil, introduce el PIN que te da tu docente en Mi aula. Solo puedes pertenecer a un aula a la vez. Si el aula está llena o el PIN cambió, consulta con tu docente.' },
    { id: 'docente', question: '¿Cómo asigno un taller a mi aula?', categoryLabel: 'Docentes', isOpen: false,
      answer: 'Abre Mis aulas, elige Asignar taller y completa el título, las instrucciones y la fecha opcional. Solo el docente propietario puede asignar talleres.' },
    { id: 'perfil', question: '¿Por qué no veo notas o rúbricas?', categoryLabel: 'Perfil', isOpen: false,
      answer: 'El perfil muestra el progreso y los eventos registrados de tu cuenta. Las notas, rúbricas, horas y mediciones sin una fuente disponible aparecen vacías; XP no equivale a una nota académica.' },
    { id: 'pdf', question: '¿Cómo guardo mi ficha como PDF?', categoryLabel: 'Perfil', isOpen: false,
      answer: 'En Perfil, pulsa Descargar ficha (PDF). En el diálogo de impresión selecciona Guardar como PDF. La ficha incluye tus datos reales y hasta 100 eventos recientes.' },
    { id: 'soporte', question: '¿Qué hago si falta mi progreso?', categoryLabel: 'Soporte', isOpen: false,
      answer: 'Comprueba que estás en la cuenta correcta y que tienes conexión. Si el problema persiste, envía una solicitud abajo indicando el módulo y lo que ocurrió. No incluyas tu contraseña ni claves.' }
  ];
  constructor() {
    effect(() => {
      const id = this.auth.user()?.id ?? null;
      if (id === this.loadedUserId) return;
      this.loadedUserId = id;
      this.generation++; this.requests = []; this.subject = ''; this.message = '';
      this.toastMessage = ''; this.sendError = ''; this.error = '';
      if (id && this.browser) void this.load();
    });
  }
  ngOnDestroy(): void { this.destroyed = true; this.generation++; }
  private refresh(): void { if (!this.destroyed) this.cdr.markForCheck(); }
  private normalized(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  }
  get filteredFaqs() {
    const q = this.normalized(this.query.trim());
    return this.faqs.filter(f => this.normalized(f.question + ' ' + f.answer + ' ' + f.categoryLabel).includes(q));
  }
  toggleFaq(id: string): void { const faq = this.faqs.find(f => f.id === id); if (faq) faq.isOpen = !faq.isOpen; }
  statusLabel(status: HelpRequest['status']): string {
    return { pending: 'Pendiente', in_progress: 'En revisión', resolved: 'Resuelta' }[status];
  }
  async load(): Promise<void> {
    const generation = this.generation;
    this.loading = true; this.error = ''; this.refresh();
    try { const requests = await this.service.listMine(); if (generation === this.generation) this.requests = requests; }
    catch { if (generation === this.generation) this.error = 'No se pudieron cargar tus solicitudes.'; }
    finally { if (generation === this.generation) { this.loading = false; this.refresh(); } }
  }
  async send(): Promise<void> {
    if (this.sending) return;
    const generation = this.generation;
    if (this.subject.trim().length < 3 || this.subject.trim().length > 150 ||
        this.message.trim().length < 10 || this.message.trim().length > 4000) {
      this.sendError = 'Escribe un asunto de 3–150 caracteres y un mensaje de 10–4000.'; return;
    }
    this.sending = true; this.sendError = ''; this.toastMessage = ''; this.refresh();
    try {
      await this.service.send(this.subject, this.message);
      if (generation !== this.generation) return;
      this.subject = ''; this.message = ''; this.toastMessage = 'Solicitud enviada y guardada.';
      await this.load();
    } catch { if (generation === this.generation) this.sendError = 'No se pudo enviar la solicitud. Inténtalo nuevamente.'; }
    finally { this.sending = false; this.refresh(); }
  }
}
