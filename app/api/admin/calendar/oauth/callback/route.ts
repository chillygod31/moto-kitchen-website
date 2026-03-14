import { NextRequest, NextResponse } from 'next/server'
import { getTokensFromCode } from '@/lib/google-calendar'

/**
 * GET /api/admin/calendar/oauth/callback
 * Handles the OAuth callback from Google, displays the refresh token
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto">
        <h2 style="color:#dc2626">Authorization Failed</h2>
        <p>Google returned an error: <strong>${error}</strong></p>
        <p><a href="/admin/calendar">Back to Calendar</a></p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  if (!code) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto">
        <h2 style="color:#dc2626">Missing Authorization Code</h2>
        <p>No code was returned from Google.</p>
        <p><a href="/admin/calendar">Back to Calendar</a></p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  try {
    const tokens = await getTokensFromCode(code)

    if (!tokens.refresh_token) {
      return new NextResponse(
        `<html><body style="font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto">
          <h2 style="color:#f59e0b">No Refresh Token</h2>
          <p>Google did not return a refresh token. This usually means you've already authorized this app before.</p>
          <p>Go to <a href="https://myaccount.google.com/permissions" target="_blank">Google Account Permissions</a>,
          remove "Moto Kitchen Calendar", then try connecting again.</p>
          <p><a href="/admin/calendar">Back to Calendar</a></p>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto">
        <h2 style="color:#16a34a">Google Calendar Connected!</h2>
        <p>Copy the refresh token below and add it to your <code>.env.local</code> file:</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;word-break:break-all">
          <code>GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</code>
        </div>
        <p>After adding it, <strong>restart your dev server</strong> and go back to the calendar.</p>
        <p><a href="/admin/calendar">Back to Calendar</a></p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  } catch (err: any) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto">
        <h2 style="color:#dc2626">Token Exchange Failed</h2>
        <p>${err.message}</p>
        <p><a href="/admin/calendar">Back to Calendar</a></p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
}
