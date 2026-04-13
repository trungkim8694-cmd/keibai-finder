'use server';

export interface PropertyData {
  sale_unit_id: string;
  court_name: string;
  property_type: string;
  address: string;
  lat: number;
  lng: number;
  starting_price: number;
  status: string;
  estimatedMarketValue: number;
  roiPercent: number;
}

// Fake API yielding properties in a given bounding box
export async function getPropertiesInBounds(): Promise<PropertyData[]> {
  // Simulating network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Generating fake data centering around Tokyo [35.6895, 139.6917]
  return [
    {
      sale_unit_id: "tokyo-1",
      court_name: "Tokyo District Court",
      property_type: "Condominium",
      address: "1-1-1 Shibuya, Shibuya-ku, Tokyo",
      lat: 35.6580,
      lng: 139.7016,
      starting_price: 25000000, // 25M JPY
      status: "ACTIVE",
      estimatedMarketValue: 35000000, // 35M JPY
      roiPercent: 40 // (35-25)/25 * 100
    },
    {
      sale_unit_id: "tokyo-2",
      court_name: "Tokyo District Court",
      property_type: "Single Family",
      address: "2-5 Shinjuku, Shinjuku-ku, Tokyo",
      lat: 35.6894,
      lng: 139.7000,
      starting_price: 45000000,
      status: "ACTIVE",
      estimatedMarketValue: 60000000,
      roiPercent: 33.3
    },
    {
      sale_unit_id: "chiba-1",
      court_name: "Chiba District Court",
      property_type: "Land",
      address: "1-1 Chuo, Chiba",
      lat: 35.6073,
      lng: 140.1063,
      starting_price: 12000000,
      status: "ACTIVE",
      estimatedMarketValue: 18000000,
      roiPercent: 50
    },
  ];
}
