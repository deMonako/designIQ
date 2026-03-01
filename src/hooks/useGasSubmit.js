import { useState, useCallback } from 'react';
import { logger } from '../logger';

/**
 * Hook do wysyłania danych do Google Apps Script z mechanizmem retry.
 * Obsługuje CORS przez URLSearchParams, exponential backoff (3 próby).
 *
 * @param {string} gasEndpoint - URL wdrożenia Google Apps Script
 * @returns {{ isSubmitting, errorMessage, setErrorMessage, submit }}
 */
export function useGasSubmit(gasEndpoint) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const submit = useCallback(async (payload, { onSuccess, onError } = {}) => {
    setErrorMessage(null);
    setIsSubmitting(true);

    const urlEncodedData = new URLSearchParams(payload).toString();
    const maxRetries = 3;
    let success = false;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(gasEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: urlEncodedData,
        });

        const result = await response.json();

        if (response.ok && result.status === 'SUCCESS') {
          success = true;
          break;
        } else {
          logger.error(`GAS Error (próba ${i + 1}): ${result.status} - ${result.message || response.statusText}`);
        }
      } catch (err) {
        logger.error(`Błąd sieci (próba ${i + 1}):`, err);
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
  }, [gasEndpoint]);

  return { isSubmitting, errorMessage, setErrorMessage, submit };
}
