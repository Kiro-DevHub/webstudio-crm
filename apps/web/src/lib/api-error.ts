import axios from 'axios';

/**
 * The API answers in English ("Invalid credentials", class-validator output), but the UI is
 * Russian, so the status code — not the server's prose — decides what the user reads.
 */
const MESSAGE_BY_STATUS: Record<number, string> = {
  400: 'Проверьте правильность заполнения полей.',
  401: 'Неверный email или пароль.',
  403: 'Недостаточно прав для этого действия.',
  404: 'Запись не найдена. Возможно, её уже удалили.',
  409: 'Такая запись уже существует.',
  422: 'Проверьте правильность заполнения полей.',
  429: 'Слишком много попыток. Подождите немного и повторите.',
};

/** Turns anything thrown by the API into one Russian sentence fit for the UI. */
export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'Не удалось выполнить запрос. Попробуйте ещё раз.';
  }
  if (error.response === undefined) {
    return 'Сервер не отвечает. Проверьте подключение и попробуйте ещё раз.';
  }

  const { status } = error.response;
  const known = MESSAGE_BY_STATUS[status];
  if (known !== undefined) return known;
  if (status >= 500) return 'Ошибка на сервере. Мы уже знаем о ней, попробуйте позже.';

  return 'Не удалось выполнить запрос. Попробуйте ещё раз.';
}
