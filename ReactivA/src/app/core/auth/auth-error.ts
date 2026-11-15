export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_taken'
  | 'weak_password'
  | 'invalid_teacher_code'
  | 'email_not_confirmed'
  | 'role_mismatch'
  | 'network'
  | 'unknown';

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export function mapSupabaseError(error: any): AuthError {
  if (!error) {
    return new AuthError('unknown', 'Ocurrió un error inesperado. Inténtalo nuevamente.');
  }

  const message: string = (error.message || '').toLowerCase();
  const code: string = (error.code || '').toLowerCase();

  if (message.includes('invalid login credentials') || message.includes('invalid credential')) {
    return new AuthError('invalid_credentials', 'Credenciales incorrectas. Verifica tu correo y contraseña.');
  }

  if (message.includes('user already registered') || message.includes('already registered')) {
    return new AuthError('email_taken', 'Este correo electrónico ya está registrado.');
  }

  if (message.includes('password should be at least') || message.includes('weak password') || code === 'weak_password') {
    return new AuthError('weak_password', 'La contraseña debe tener al menos 6 caracteres.');
  }

  if (message.includes('invite code') || message.includes('código de invitación') || message.includes('teacher_invite_codes')) {
    return new AuthError('invalid_teacher_code', 'El código de invitación docente no es válido o ya fue utilizado.');
  }

  if (message.includes('email not confirmed') || message.includes('unconfirmed')) {
    return new AuthError('email_not_confirmed', 'Debes confirmar tu correo electrónico antes de iniciar sesión.');
  }

  if (message.includes('network') || message.includes('failed to fetch') || code === 'fetch_error') {
    return new AuthError('network', 'Error de conexión. Verifica tu conexión a internet.');
  }

  return new AuthError('unknown', error.message || 'Error de autenticación. Inténtalo más tarde.');
}
