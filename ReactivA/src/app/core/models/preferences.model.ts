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
