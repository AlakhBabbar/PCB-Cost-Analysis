// One plain sentence for any failed request.
export const errorText = (e) =>
  !e?.status ? 'We could not reach the server. Check your connection and try again.'
    : e.status === 429 ? 'Too many requests. Please wait a minute and try again.'
      : e.message
