import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

export type SettingsTab = 
  | 'account' 
  | 'appearance' 
  | 'notifications' 
  | 'privacy' 
  | 'learning' 
  | 'accessibility';

export interface UserAccountData {
  avatarUrl: string;
  fullName: string;
  email: string;
  username: string;
  role: string;
  joinDate: string;
}

export interface UserPreferences {
  // Apariencia
  theme: 'light' | 'dark' | 'system';
  fontSize: 'sm' | 'md' | 'lg';
  reduceMotion: boolean;

  // Notificaciones
  notifChallenges: boolean;
  notifReminders: boolean;
  notifUpdates: boolean;
  notifAchievements: boolean;
  notifLearningTips: boolean;

  // Privacidad & Seguridad
  profileVisibility: 'public' | 'institutional' | 'private';
  showProgressPublicly: boolean;
  allowPeerMessages: boolean;
  twoFactorAuth: boolean;

  // Preferencias de Aprendizaje
  favoriteBranch: string;
  preferredDifficulty: 'basico' | 'intermedio' | 'avanzado';
  studyRemindersFrequency: 'daily' | 'weekdays' | 'none';
  audioFeedback: boolean;
  autoStepSolutions: boolean;

  // Accesibilidad
  highContrast: boolean;
  dyslexicFont: boolean;
  screenReaderOptimized: boolean;
  largeInteractiveTargets: boolean;
}

const SETTINGS_STORAGE_KEY = 'reactiva_settings_preferences';
const USER_STORAGE_KEY = 'reactiva_user_account_data';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  fontSize: 'md',
  reduceMotion: false,

  notifChallenges: true,
  notifReminders: true,
  notifUpdates: false,
  notifAchievements: true,
  notifLearningTips: true,

  profileVisibility: 'institutional',
  showProgressPublicly: true,
  allowPeerMessages: true,
  twoFactorAuth: false,

  favoriteBranch: 'Química Orgánica & Hidrocarburos',
  preferredDifficulty: 'intermedio',
  studyRemindersFrequency: 'daily',
  audioFeedback: true,
  autoStepSolutions: false,

  highContrast: false,
  dyslexicFont: false,
  screenReaderOptimized: false,
  largeInteractiveTargets: false
};

const DEFAULT_ACCOUNT: UserAccountData = {
  avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
  fullName: 'Alex Morales',
  email: 'alex.morales@reactiva-lab.edu',
  username: 'alex_morales_lab',
  role: 'Estudiante (10° Grado)',
  joinDate: 'Septiembre 2024'
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class SettingsComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  // Tab activo
  activeTab: SettingsTab = 'account';

  // Configuración de pestañas con sus íconos y títulos
  readonly tabs: { id: SettingsTab; label: string; icon: string; description: string }[] = [
    { id: 'account', label: 'Mi Cuenta', icon: 'ph-user-circle', description: 'Información personal y perfil escolar' },
    { id: 'appearance', label: 'Apariencia', icon: 'ph-palette', description: 'Temas visuales, tipografía y estilo' },
    { id: 'notifications', label: 'Notificaciones', icon: 'ph-bell', description: 'Alertas, avisos de tareas e insignias' },
    { id: 'privacy', label: 'Privacidad y Seguridad', icon: 'ph-shield-check', description: 'Control de perfil, accesos y credenciales' },
    { id: 'learning', label: 'Preferencias de Aprendizaje', icon: 'ph-student', description: 'Nivel curricular, química favorita y metas' },
    { id: 'accessibility', label: 'Accesibilidad', icon: 'ph-person-arms-spread', description: 'Contraste, legibilidad y apoyos interactivos' }
  ];

  // Datos de usuario y preferencias
  userData: UserAccountData = { ...DEFAULT_ACCOUNT };
  preferences: UserPreferences = { ...DEFAULT_PREFERENCES };

  // Estados visuales y edición
  isEditingAccount = false;
  toastMessage: string | null = null;
  toastType: 'success' | 'info' | 'warning' = 'success';
  showConfirmReset = false;
  showPasswordModal = false;
  showDeleteConfirmModal = false;
  showAvatarModal = false;

  // Formulario reactivo para la cuenta
  accountForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    role: ['', [Validators.required]]
  });

  // Formulario reactivo para cambio de contraseña (simulado)
  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required, Validators.minLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmNewPassword: ['', [Validators.required]]
  });

  // Avatares predefinidos seleccionables
  presetAvatars: string[] = [
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80'
  ];

  ngOnInit(): void {
    this.loadFromStorage();
    this.initAccountForm();
  }

  // -------------------------------------------------------------
  // Persistencia Local (LocalStorage)
  // -------------------------------------------------------------
  private loadFromStorage(): void {
    try {
      const savedPrefs = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedPrefs) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(savedPrefs) };
      }

      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        this.userData = { ...DEFAULT_ACCOUNT, ...JSON.parse(savedUser) };
      }
    } catch (e) {
      console.warn('Error cargando preferencias de Settings desde localStorage', e);
    }
  }

  savePreferences(): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.preferences));
      this.showToast('Preferencias guardadas correctamente', 'success');
    } catch (e) {
      console.error('Error guardando preferencias', e);
      this.showToast('No se pudieron guardar las preferencias', 'warning');
    }
  }

  resetToDefaults(): void {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.savePreferences();
    this.showConfirmReset = false;
    this.showToast('Configuraciones restauradas a los valores por defecto', 'info');
  }

  // -------------------------------------------------------------
  // Gestión de Mi Cuenta
  // -------------------------------------------------------------
  initAccountForm(): void {
    this.accountForm.setValue({
      fullName: this.userData.fullName,
      email: this.userData.email,
      username: this.userData.username,
      role: this.userData.role
    });
  }

  startEditingAccount(): void {
    this.initAccountForm();
    this.isEditingAccount = true;
  }

  cancelEditingAccount(): void {
    this.initAccountForm();
    this.isEditingAccount = false;
  }

  saveAccountChanges(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      this.showToast('Verifica los campos obligatorios del perfil', 'warning');
      return;
    }

    const formVal = this.accountForm.value;
    this.userData = {
      ...this.userData,
      fullName: formVal.fullName,
      email: formVal.email,
      username: formVal.username,
      role: formVal.role
    };

    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.userData));
    } catch (e) {
      console.warn('Error persistiendo datos de usuario', e);
    }

    this.isEditingAccount = false;
    this.showToast('Información de cuenta actualizada', 'success');
  }

  selectPresetAvatar(url: string): void {
    this.userData.avatarUrl = url;
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.userData));
    } catch (e) {
      console.warn('Error persistiendo avatar', e);
    }
    this.showAvatarModal = false;
    this.showToast('Fotografía de perfil actualizada', 'success');
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = DEFAULT_ACCOUNT.avatarUrl;
  }

  // -------------------------------------------------------------
  // Interacción de Toggles y Preferencias
  // -------------------------------------------------------------
  togglePreference(key: keyof UserPreferences): void {
    if (typeof this.preferences[key] === 'boolean') {
      (this.preferences[key] as boolean) = !(this.preferences[key] as boolean);
      this.savePreferences();
    }
  }

  setTheme(theme: 'light' | 'dark' | 'system'): void {
    this.preferences.theme = theme;
    this.savePreferences();
  }

  setFontSize(size: 'sm' | 'md' | 'lg'): void {
    this.preferences.fontSize = size;
    this.savePreferences();
  }

  setDifficulty(diff: 'basico' | 'intermedio' | 'avanzado'): void {
    this.preferences.preferredDifficulty = diff;
    this.savePreferences();
  }

  // -------------------------------------------------------------
  // Seguridad y Modales
  // -------------------------------------------------------------
  openPasswordModal(): void {
    this.passwordForm.reset();
    this.showPasswordModal = true;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordForm.reset();
  }

  submitPasswordChange(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const val = this.passwordForm.value;
    if (val.newPassword !== val.confirmNewPassword) {
      this.showToast('Las contraseñas nuevas no coinciden', 'warning');
      return;
    }

    // Nota de demostración técnica: en frontend no se ejecuta cambio en BD real
    this.closePasswordModal();
    this.showToast('Contraseña actualizada correctamente (Modo Simulación)', 'success');
  }

  closeOtherSessions(): void {
    this.showToast('Se han cerrado las sesiones activas en otros dispositivos', 'info');
  }

  confirmDeleteAccount(): void {
    this.showDeleteConfirmModal = false;
    this.showToast('Acción segura: La eliminación de cuenta requiere confirmación de la institución escolar.', 'warning');
  }

  // -------------------------------------------------------------
  // Feedback visual (Toast)
  // -------------------------------------------------------------
  showToast(message: string, type: 'success' | 'info' | 'warning' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.cdr.markForCheck();

    setTimeout(() => {
      this.toastMessage = null;
      this.cdr.markForCheck();
    }, 3800);
  }
}

