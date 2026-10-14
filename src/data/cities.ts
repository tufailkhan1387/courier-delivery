import type { City } from '@/types'

export interface CityInfo {
  name: City
  code: string
  region: 'South' | 'Central' | 'North'
  /** Position on the stylised route map (0–100 viewBox). */
  map: { x: number; y: number }
  areas: string[]
  postalPrefix: string
}

export const CITY_INFO: Record<City, CityInfo> = {
  Karachi: {
    name: 'Karachi',
    code: 'KHI',
    region: 'South',
    map: { x: 30, y: 88 },
    areas: ['Clifton Block 5', 'Gulshan-e-Iqbal Block 13', 'DHA Phase 6', 'North Nazimabad Block H', 'PECHS Block 2', 'Saddar'],
    postalPrefix: '75',
  },
  Lahore: {
    name: 'Lahore',
    code: 'LHE',
    region: 'Central',
    map: { x: 74, y: 42 },
    areas: ['Gulberg III', 'DHA Phase 5', 'Johar Town Block G', 'Model Town Block C', 'Bahria Town Sector B', 'Garden Town'],
    postalPrefix: '54',
  },
  Islamabad: {
    name: 'Islamabad',
    code: 'ISB',
    region: 'North',
    map: { x: 65, y: 20 },
    areas: ['F-7 Markaz', 'G-11/3', 'Blue Area', 'E-11/2', 'I-8 Markaz', 'F-10/4'],
    postalPrefix: '44',
  },
  Rawalpindi: {
    name: 'Rawalpindi',
    code: 'RWP',
    region: 'North',
    map: { x: 62, y: 26 },
    areas: ['Saddar', 'Satellite Town Block B', 'Bahria Town Phase 4', 'Chaklala Scheme 3', 'Commercial Market'],
    postalPrefix: '46',
  },
  Faisalabad: {
    name: 'Faisalabad',
    code: 'FSD',
    region: 'Central',
    map: { x: 62, y: 46 },
    areas: ['D Ground', 'Peoples Colony No. 1', 'Madina Town', 'Susan Road', 'Jinnah Colony'],
    postalPrefix: '38',
  },
  Multan: {
    name: 'Multan',
    code: 'MUX',
    region: 'Central',
    map: { x: 52, y: 58 },
    areas: ['Gulgasht Colony', 'Cantt', 'Bosan Road', 'Shah Rukn-e-Alam Colony', 'Model Town'],
    postalPrefix: '60',
  },
  Peshawar: {
    name: 'Peshawar',
    code: 'PEW',
    region: 'North',
    map: { x: 50, y: 16 },
    areas: ['Hayatabad Phase 3', 'University Town', 'Saddar', 'Ring Road', 'Gulbahar'],
    postalPrefix: '25',
  },
}

export const CITIES: City[] = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar']
