import { isAxiosError } from 'axios';

const DEFAULT_ERROR_MESSAGE = 'Щось пішло не так. Спробуйте ще раз';
const INVALID_INPUT_MESSAGE = 'Перевірте правильність введених даних';
const NETWORK_ERROR_MESSAGE = 'Не вдалося звʼязатися з сервером. Перевірте, що API запущений';

// The server's own text for these statuses is not localized.
const MESSAGE_BY_STATUS: Readonly<Record<number, string>> = {
  413: 'Файл завеликий. Максимальний розмір — 2 МБ',
  429: 'Забагато спроб. Спробуйте за хвилину',
};

interface ApiErrorBody {
  message?: string | string[];
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

export function getApiErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_ERROR_MESSAGE,
): string {
  if (!isAxiosError<ApiErrorBody>(error)) {
    return fallback;
  }

  if (!error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const status = error.response.status;
  if (status !== undefined && MESSAGE_BY_STATUS[status]) {
    return MESSAGE_BY_STATUS[status];
  }

  const message = error.response?.data?.message;
  // Validation failures arrive as a list of English class-validator messages.
  return Array.isArray(message) ? INVALID_INPUT_MESSAGE : (message ?? fallback);
}
