import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Brand } from '@/components/layout/Brand';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuth } from '@/features/auth/useAuth';
import { useLogin } from '@/features/auth/useLogin';
import { loginSchema, type LoginFormValues } from '@/features/auth/login.schema';
import { getDemoCredentials } from '@/features/auth/demo-credentials';

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [passwordVisible, setPasswordVisible] = useState(false);

  const demo = getDemoCredentials();
  const redirectTo = (location.state as LocationState | null)?.from ?? '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  });

  const login = useLogin(() => {
    void navigate(redirectTo, { replace: true });
  });

  if (isLoading) return null;
  if (user !== null) return <Navigate to={redirectTo} replace />;

  const onSubmit = handleSubmit((values) => {
    login.mutate(values);
  });

  const loginAsDemo = () => {
    if (demo === null) return;
    // Fill the fields too, so the shortcut shows which account it used.
    setValue('email', demo.email);
    setValue('password', demo.password);
    login.mutate(demo);
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-background p-4">
      <div className="w-full max-w-sm">
        <Brand />

        <h1 className="mt-6 text-xl font-semibold tracking-tight">Вход в CRM</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Войдите рабочей почтой, чтобы продолжить.
        </p>

        {login.isError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
            <span>{getApiErrorMessage(login.error)}</span>
          </div>
        )}

        <form
          onSubmit={(event) => {
            void onSubmit(event);
          }}
          noValidate
          className="mt-5 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              spellCheck={false}
              autoFocus
              aria-invalid={errors.email !== undefined}
              aria-describedby={errors.email !== undefined ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Input
                id="password"
                type={passwordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                aria-invalid={errors.password !== undefined}
                aria-describedby={errors.password !== undefined ? 'password-error' : undefined}
                className="pr-8"
                {...register('password')}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                aria-label={passwordVisible ? 'Скрыть пароль' : 'Показать пароль'}
                onClick={() => {
                  setPasswordVisible((visible) => !visible);
                }}
              >
                {passwordVisible ? (
                  <EyeOff aria-hidden="true" strokeWidth={1.75} />
                ) : (
                  <Eye aria-hidden="true" strokeWidth={1.75} />
                )}
              </Button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" size="lg" disabled={login.isPending} className="w-full">
            {login.isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
            {login.isPending ? 'Входим…' : 'Войти'}
          </Button>
        </form>

        {demo !== null && (
          <>
            <div className="my-4 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">или</span>
              <Separator className="flex-1" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              disabled={login.isPending}
              onClick={loginAsDemo}
            >
              Войти как демо
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Демо-вход выполняется менеджером <span className="font-mono">{demo.email}</span>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
