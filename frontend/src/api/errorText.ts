// Turns anything thrown (usually an ApiError) into a message fit to show the user.
export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}
