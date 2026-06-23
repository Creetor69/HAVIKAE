export const getDeliveryEstimate = (stateRaw: string, cityRaw: string = ''): string => {
  const state = (stateRaw || '').trim().toLowerCase();
  const city = (cityRaw || '').trim().toLowerCase();

  if (!state) {
    return '2 - 7 business days';
  }

  // Local Bangalore
  if (
    city.includes('bangalore') || 
    city.includes('bengaluru') || 
    (state.includes('karnataka') && (city.includes('bangalore') || city.includes('bengaluru')))
  ) {
    return '1 - 2 business days';
  }

  // Karnataka state
  if (state.includes('karnataka')) {
    return '2 - 3 business days';
  }

  // South India (Tamil Nadu, Kerala, Andhra Pradesh, Telangana, Maharashtra, Goa, Puducherry/Pondicherry)
  const southNeighbours = [
    'tamil nadu', 'tamilnadu', 'kerala', 'andhra pradesh', 'andhrapradesh', 
    'telangana', 'maharashtra', 'goa', 'puducherry', 'pondicherry'
  ];
  if (southNeighbours.some(s => state.includes(s))) {
    return '3 - 4 business days';
  }

  // Central / Western / Eastern India (Gujarat, Rajasthan, MP, Chhattisgarh, Odisha, West Bengal, Union Territories)
  const centralWestEast = [
    'gujarat', 'rajasthan', 'madhya pradesh', 'madhyapradesh', 'chhattisgarh', 
    'odisha', 'orissa', 'west bengal', 'westbengal', 'daman', 'diu', 'dadra'
  ];
  if (centralWestEast.some(s => state.includes(s))) {
    return '4 - 5 business days';
  }

  // Far North / Northeast / Remote UTs
  const remoteFar = [
    'assam', 'meghalaya', 'tripura', 'mizoram', 'manipur', 'nagaland', 
    'arunachal', 'sikkim', 'jammu', 'kashmir', 'ladakh', 'andaman', 
    'nicobar', 'lakshadweep'
  ];
  if (remoteFar.some(s => state.includes(s))) {
    return '5 - 8 business days';
  }

  // Northern India / Rest of India (Delhi, UP, Bihar, Punjab, Haryana, Uttarakhand, Himachal)
  return '5 - 7 business days';
};
