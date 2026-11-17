import { AuthError } from '../core/auth/auth-error';

export function accessError(error: unknown, registration = false): string {
  const fallback = 'No se pudo completar la solicitud. Inténtalo nuevamente.';
  if (!(error instanceof AuthError)) return fallback;
  switch (error.code) {
    case 'invalid_credentials': return 'Correo o contraseña incorrectos.';
    case 'email_not_confirmed': return 'Confirma tu correo antes de iniciar sesión.';
    case 'role_mismatch': return 'El rol seleccionado no coincide con tu cuenta. Cambia el selector de perfil.';
    case 'network': return 'Error de conexión. Verifica tu conexión a internet.';
    case 'email_taken': return registration ? 'Este correo electrónico ya está registrado.' : 'Correo o contraseña incorrectos.';
    case 'weak_password': return 'La contraseña debe tener al menos 8 caracteres e incluir letras y números.';
    case 'invalid_teacher_code': return 'El código de invitación docente no es válido o ya fue utilizado.';
    default: return fallback;
  }
}

export function pendingPin(value?: string | null): string {
  try {
    if (value === undefined) return sessionStorage.getItem('pendingClassPin') || '';
    if (value === null) sessionStorage.removeItem('pendingClassPin');
    else sessionStorage.setItem('pendingClassPin', value);
  } catch { /* El acceso no depende de que el navegador permita almacenamiento. */ }
  return '';
}
