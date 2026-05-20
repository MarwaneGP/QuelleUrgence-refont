import { NextResponse } from 'next/server';

interface AddressOption {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
  latitude: number;
  longitude: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query || query.length < 2) {
    return NextResponse.json(
      { predictions: [] },
      { status: 200 }
    );
  }

  try {
    // Use Photon API (free, open-source, based on OpenStreetMap)
    const url = `https://photon.komoot.io/api?q=${encodeURIComponent(query)}&lang=fr&limit=10`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'QuelleUrgence/1.0',
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Photon API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      });
      return NextResponse.json(
        { error: 'Failed to fetch address suggestions' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform Photon features to our format
    const predictions: AddressOption[] = (data.features || []).map((feature: any, index: number) => {
      const properties = feature.properties || {};
      const coordinates = feature.geometry?.coordinates || [0, 0];
      
      // Extract address components
      const name = properties.name || '';
      const street = properties.street || '';
      const city = properties.city || '';
      const postcode = properties.postcode || '';
      const country = properties.country || '';
      
      // Build mainText (street + number or name)
      const mainText = street ? `${street}` : name;
      
      // Build secondaryText (city, postcode)
      const secondaryText = [postcode, city].filter(Boolean).join(' ');
      
      // Build full description
      const description = [street || name, postcode, city].filter(Boolean).join(', ');
      
      return {
        placeId: `${coordinates.join(',')}_${index}`,
        mainText: mainText,
        secondaryText: secondaryText,
        description: description,
        longitude: coordinates[0],
        latitude: coordinates[1],
      };
    });

    return NextResponse.json(
      { predictions },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in address search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
