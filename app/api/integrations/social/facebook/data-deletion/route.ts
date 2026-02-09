import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Facebook sends a signed request when a user wants their data deleted
// https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const signedRequest = formData.get('signed_request') as string;

    if (!signedRequest) {
      return NextResponse.json({ error: 'Missing signed_request' }, { status: 400 });
    }

    const data = parseSignedRequest(signedRequest);
    if (!data) {
      return NextResponse.json({ error: 'Invalid signed_request' }, { status: 400 });
    }

    const facebookUserId = data.user_id;

    // Delete the social connection for this Facebook user
    const supabase = createServiceClient();
    await supabase
      .from('social_media_connections')
      .delete()
      .eq('platform', 'facebook')
      .eq('platform_user_id', facebookUserId);

    // Generate a confirmation code for the user
    const confirmationCode = crypto.randomUUID();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Facebook expects this response format
    return NextResponse.json({
      url: `${baseUrl}/api/integrations/social/facebook/data-deletion/status?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error('Facebook data deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Status check endpoint — Facebook may direct users here to check deletion status
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing confirmation code' }, { status: 400 });
  }

  return NextResponse.json({
    status: 'complete',
    message: 'Your Facebook data has been deleted from SkaleFlow.',
  });
}

function parseSignedRequest(signedRequest: string): { user_id: string } | null {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) return null;

  const [encodedSig, payload] = signedRequest.split('.');
  if (!encodedSig || !payload) return null;

  // Decode the signature
  const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

  // Verify the signature
  const expectedSig = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest();

  if (!crypto.timingSafeEqual(sig, expectedSig)) {
    console.error('Facebook data deletion: signature mismatch');
    return null;
  }

  // Decode the payload
  const decoded = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  return JSON.parse(decoded);
}
