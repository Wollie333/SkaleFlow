import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAvailableSlots } from '@/lib/calls/calendar';

// GET — public endpoint for available slots
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const bookingPageId = url.searchParams.get('bookingPageId');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const duration = url.searchParams.get('duration');

  if (!bookingPageId || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get booking page org
  const { data: page } = await supabase
    .from('booking_pages')
    .select('organization_id')
    .eq('id', bookingPageId)
    .eq('is_active', true)
    .single();

  if (!page) return NextResponse.json({ error: 'Booking page not found' }, { status: 404 });

  const slots = await getAvailableSlots(
    page.organization_id,
    bookingPageId,
    new Date(startDate),
    new Date(endDate),
    parseInt(duration || '30', 10)
  );

  return NextResponse.json(slots);
}
