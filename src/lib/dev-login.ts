/*
 * Development convenience: stay signed in while building the project.
 * Set NEXT_PUBLIC_DEV_AUTO_LOGIN=<employee number> in .env.local (never committed) and, on the
 * development server only, the staff portal signs that employee in automatically and treats
 * them as a system administrator, and the admin panels open without the sign-in form.
 * Production builds ignore the variable: NODE_ENV is "production" there, so this is always ''.
 */
export const DEV_LOGIN = process.env.NODE_ENV === 'development' ? (process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN || '').trim() : '';
