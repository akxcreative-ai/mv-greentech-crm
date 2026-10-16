export interface CountryData {
  code: string;
  name: string;
  phoneCode: string;
  currency: string;
  states: {
    code: string;
    name: string;
    cities: string[];
  }[];
}

export const LOCATION_DATA: CountryData[] = [
  {
    code: 'IN',
    name: 'India',
    phoneCode: '+91',
    currency: 'INR',
    states: [
      {
        code: 'MH',
        name: 'Maharashtra',
        cities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad (Chhatrapati Sambhajinagar)', 'Solapur', 'Kolhapur', 'Amravati', 'Nanded', 'Navi Mumbai'],
      },
      {
        code: 'DL',
        name: 'Delhi (NCT)',
        cities: ['New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Dwarka', 'Rohini'],
      },
      {
        code: 'GJ',
        name: 'Gujarat',
        cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Bharuch', 'Vapi', 'Morbi'],
      },
      {
        code: 'KA',
        name: 'Karnataka',
        cities: ['Bengaluru (Bangalore)', 'Mysuru (Mysore)', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Davanagere', 'Ballari', 'Shivamogga', 'Tumakuru'],
      },
      {
        code: 'TN',
        name: 'Tamil Nadu',
        cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi', 'Hosur'],
      },
      {
        code: 'UP',
        name: 'Uttar Pradesh',
        cities: ['Noida', 'Greater Noida', 'Ghaziabad', 'Kanpur', 'Lucknow', 'Varanasi', 'Agra', 'Prayagraj (Allahabad)', 'Meerut', 'Aligarh', 'Bareilly', 'Moradabad'],
      },
      {
        code: 'HR',
        name: 'Haryana',
        cities: ['Gurugram (Gurgaon)', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Manesar'],
      },
      {
        code: 'TG',
        name: 'Telangana',
        cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Secunderabad'],
      },
      {
        code: 'RJ',
        name: 'Rajasthan',
        cities: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bhiwadi'],
      },
      {
        code: 'WB',
        name: 'West Bengal',
        cities: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Kharagpur', 'Haldia'],
      },
      {
        code: 'MP',
        name: 'Madhya Pradesh',
        cities: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Pithampur'],
      },
      {
        code: 'AP',
        name: 'Andhra Pradesh',
        cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry', 'Kakinada'],
      },
      {
        code: 'PB',
        name: 'Punjab',
        cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali (SAS Nagar)', 'Pathankot'],
      },
      {
        code: 'CH',
        name: 'Chandigarh',
        cities: ['Chandigarh'],
      },
      {
        code: 'KL',
        name: 'Kerala',
        cities: ['Kochi (Cochin)', 'Thiruvananthapuram', 'Kozhikode (Calicut)', 'Thrissur', 'Kollam', 'Palakkad', 'Kannur', 'Alappuzha'],
      },
      {
        code: 'OR',
        name: 'Odisha',
        cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore'],
      },
      {
        code: 'JH',
        name: 'Jharkhand',
        cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh'],
      },
      {
        code: 'CT',
        name: 'Chhattisgarh',
        cities: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon'],
      },
      {
        code: 'BR',
        name: 'Bihar',
        cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif'],
      },
      {
        code: 'UT',
        name: 'Uttarakhand',
        cities: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Rishikesh', 'Pantnagar'],
      },
      {
        code: 'HP',
        name: 'Himachal Pradesh',
        cities: ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Baddi', 'Kullu', 'Una'],
      },
      {
        code: 'GA',
        name: 'Goa',
        cities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
      },
      {
        code: 'AS',
        name: 'Assam',
        cities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia'],
      },
      {
        code: 'JK',
        name: 'Jammu and Kashmir',
        cities: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur'],
      },
      {
        code: 'LA',
        name: 'Ladakh',
        cities: ['Leh', 'Kargil'],
      },
      {
        code: 'PY',
        name: 'Puducherry',
        cities: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
      },
      {
        code: 'TR',
        name: 'Tripura',
        cities: ['Agartala', 'Udaipur', 'Dharmanagar'],
      },
      {
        code: 'ML',
        name: 'Meghalaya',
        cities: ['Shillong', 'Tura', 'Jowai'],
      },
      {
        code: 'MN',
        name: 'Manipur',
        cities: ['Imphal', 'Churachandpur', 'Thoubal'],
      },
      {
        code: 'NL',
        name: 'Nagaland',
        cities: ['Kohima', 'Dimapur', 'Mokokchung'],
      },
      {
        code: 'MZ',
        name: 'Mizoram',
        cities: ['Aizawl', 'Lunglei', 'Champhai'],
      },
      {
        code: 'AR',
        name: 'Arunachal Pradesh',
        cities: ['Itanagar', 'Naharlagun', 'Pasighat'],
      },
      {
        code: 'SK',
        name: 'Sikkim',
        cities: ['Gangtok', 'Namchi', 'Geyzing'],
      },
      {
        code: 'AN',
        name: 'Andaman and Nicobar Islands',
        cities: ['Port Blair'],
      },
      {
        code: 'DN',
        name: 'Dadra and Nagar Haveli and Daman and Diu',
        cities: ['Daman', 'Diu', 'Silvassa'],
      },
      {
        code: 'LD',
        name: 'Lakshadweep',
        cities: ['Kavaratti'],
      },
    ],
  },
  {
    code: 'US',
    name: 'United States',
    phoneCode: '+1',
    currency: 'USD',
    states: [
      { code: 'CA', name: 'California', cities: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento', 'Irvine'] },
      { code: 'TX', name: 'Texas', cities: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso'] },
      { code: 'NY', name: 'New York', cities: ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse'] },
      { code: 'IL', name: 'Illinois', cities: ['Chicago', 'Aurora', 'Naperville', 'Rockford', 'Joliet'] },
      { code: 'FL', name: 'Florida', cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'] },
      { code: 'WA', name: 'Washington', cities: ['Seattle', 'Spokane', 'Tacoma', 'Bellevue', 'Redmond'] },
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    phoneCode: '+49',
    currency: 'EUR',
    states: [
      { code: 'BY', name: 'Bavaria', cities: ['Munich', 'Nuremberg', 'Augsburg', 'Regensburg'] },
      { code: 'BW', name: 'Baden-Württemberg', cities: ['Stuttgart', 'Mannheim', 'Karlsruhe', 'Freiburg', 'Heidelberg'] },
      { code: 'NW', name: 'North Rhine-Westphalia', cities: ['Cologne', 'Düsseldorf', 'Dortmund', 'Essen'] },
      { code: 'HE', name: 'Hesse', cities: ['Frankfurt am Main', 'Wiesbaden', 'Kassel', 'Darmstadt'] },
      { code: 'BE', name: 'Berlin', cities: ['Berlin'] },
    ],
  },
  {
    code: 'CN',
    name: 'China',
    phoneCode: '+86',
    currency: 'CNY',
    states: [
      { code: 'GD', name: 'Guangdong', cities: ['Guangzhou', 'Shenzhen', 'Dongguan', 'Foshan', 'Zhongshan'] },
      { code: 'ZJ', name: 'Zhejiang', cities: ['Hangzhou', 'Ningbo', 'Wenzhou', 'Yiwu'] },
      { code: 'JS', name: 'Jiangsu', cities: ['Nanjing', 'Suzhou', 'Wuxi', 'Changzhou'] },
      { code: 'SH', name: 'Shanghai', cities: ['Shanghai'] },
      { code: 'BJ', name: 'Beijing', cities: ['Beijing'] },
      { code: 'SD', name: 'Shandong', cities: ['Qingdao', 'Jinan', 'Yantai', 'Weihai'] },
    ],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    phoneCode: '+971',
    currency: 'AED',
    states: [
      { code: 'DXB', name: 'Dubai', cities: ['Dubai City', 'Jebel Ali', 'Deira'] },
      { code: 'AUH', name: 'Abu Dhabi', cities: ['Abu Dhabi', 'Al Ain'] },
      { code: 'SHJ', name: 'Sharjah', cities: ['Sharjah'] },
      { code: 'AJM', name: 'Ajman', cities: ['Ajman'] },
      { code: 'RAK', name: 'Ras Al Khaimah', cities: ['Ras Al Khaimah'] },
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    phoneCode: '+44',
    currency: 'GBP',
    states: [
      { code: 'ENG', name: 'England', cities: ['London', 'Birmingham', 'Manchester', 'Leeds', 'Bristol', 'Sheffield'] },
      { code: 'SCT', name: 'Scotland', cities: ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee'] },
      { code: 'WLS', name: 'Wales', cities: ['Cardiff', 'Swansea', 'Newport'] },
      { code: 'NIR', name: 'Northern Ireland', cities: ['Belfast', 'Derry'] },
    ],
  },
  {
    code: 'JP',
    name: 'Japan',
    phoneCode: '+81',
    currency: 'JPY',
    states: [
      { code: '13', name: 'Tokyo', cities: ['Tokyo', 'Shinjuku', 'Chiyoda', 'Minato'] },
      { code: '27', name: 'Osaka', cities: ['Osaka', 'Sakai', 'Higashiosaka'] },
      { code: '23', name: 'Aichi', cities: ['Nagoya', 'Toyota', 'Okazaki'] },
      { code: '14', name: 'Kanagawa', cities: ['Yokohama', 'Kawasaki', 'Sagamihara'] },
    ],
  },
  {
    code: 'SG',
    name: 'Singapore',
    phoneCode: '+65',
    currency: 'SGD',
    states: [
      { code: 'SG', name: 'Singapore', cities: ['Singapore', 'Jurong', 'Changi', 'Woodlands'] },
    ],
  },
  {
    code: 'AU',
    name: 'Australia',
    phoneCode: '+61',
    currency: 'AUD',
    states: [
      { code: 'NSW', name: 'New South Wales', cities: ['Sydney', 'Newcastle', 'Wollongong'] },
      { code: 'VIC', name: 'Victoria', cities: ['Melbourne', 'Geelong', 'Ballarat'] },
      { code: 'QLD', name: 'Queensland', cities: ['Brisbane', 'Gold Coast', 'Cairns'] },
      { code: 'WA', name: 'Western Australia', cities: ['Perth', 'Fremantle'] },
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    phoneCode: '+1',
    currency: 'CAD',
    states: [
      { code: 'ON', name: 'Ontario', cities: ['Toronto', 'Ottawa', 'Mississauga', 'Hamilton'] },
      { code: 'QC', name: 'Quebec', cities: ['Montreal', 'Quebec City', 'Laval'] },
      { code: 'BC', name: 'British Columbia', cities: ['Vancouver', 'Victoria', 'Surrey', 'Burnaby'] },
      { code: 'AB', name: 'Alberta', cities: ['Calgary', 'Edmonton', 'Red Deer'] },
    ],
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    phoneCode: '+966',
    currency: 'SAR',
    states: [
      { code: 'RIY', name: 'Riyadh Province', cities: ['Riyadh', 'Al Kharj'] },
      { code: 'MAK', name: 'Makkah Province', cities: ['Jeddah', 'Mecca', 'Taif'] },
      { code: 'EST', name: 'Eastern Province', cities: ['Dammam', 'Khobar', 'Jubail'] },
    ],
  },
];
