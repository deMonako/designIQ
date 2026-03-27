import { useState, useCallback } from 'react';
import { GAS_CONFIG } from '../admin/api/gasConfig';
import { logger } from '../logger';

/**
 * Hook do wysyłania danych do Google Apps Script.
 * Wysyła JSON jako text/plain (brak nagłówka Content-Type) – obejście CORS preflight.
 * GAS czyta body przez e.postData.contents i zwraca { ok: true, data } lub { ok: false, error }.
 *
 * @param {string} [gasEndpoint] - URL GAS (domyślnie GAS_CONFIG.scriptUrl)
 * @returns {{ isSubmitting, errorMessage, setErrorMessage, submit }}
 */
export function useGasSubmit(gasEndpoint) {
  const endpoint = gasEndpoint || GAS_CONFIG.scriptUrl;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const submit = useCallback(async (payload, { onSuccess, onError } = {}) => {
    setErrorMessage(null);
    setIsSubmitting(true);

    const maxRetries = 3;
    let success = false;

    for (let i = 0; i < maxRetries; i++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      try {
        // Wysyłamy JSON jako zwykły string bez Content-Type – "simple request" CORS
        const response = await fetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        const result = await response.json();

        if (result.ok === true) {
          success = true;
          break;
        } else {
          logger.error(`GAS Error (próba ${i + 1}): ${result.error || response.statusText}`);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          logger.error(`Timeout żądania (próba ${i + 1})`);
        } else {
          logger.error(`Błąd sieci (próba ${i + 1}):`, err);
        }
      } finally {
        clearTimeout(timeoutId);
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }

    setIsSubmitting(false);

    if (success) {
      onSuccess?.();
    } else {
      const msg = 'Niestety, wystąpił błąd podczas wysyłania. Spróbuj ponownie lub skontaktuj się bezpośrednio.';
      setErrorMessage(msg);
      onError?.(msg);
    }
  }, [endpoint]);

  return { isSubmitting, errorMessage, setErrorMessage, submit };
}
