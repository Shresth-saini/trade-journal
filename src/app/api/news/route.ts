import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      next: { revalidate: 300 } // Cache for 5 mins
    });
    
    if (!res.ok) throw new Error('Failed to fetch from FF');
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
