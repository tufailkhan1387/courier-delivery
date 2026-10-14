// Static demo directory: branches, customers, riders and staff.
// All names, phone numbers and emails are fictional.
import type { Branch, City, Customer, Driver, Staff, StaffRole } from '@/types'
import { CITY_INFO } from './cities'

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const phone = (n: number) => `+92 3${String(n % 50).padStart(2, '0')} 555 ${String(1000 + ((n * 37) % 9000))}`
const slug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, '.')

type BranchSeed = [code: string, name: string, type: Branch['type'], city: City, address: string, manager: string, capacity: number]

const BRANCH_SEEDS: BranchSeed[] = [
  ['KHI-HUB', 'Karachi Central Hub', 'hub', 'Karachi', 'Plot 14, SITE Industrial Area, Karachi', 'Farhan Siddiqui', 4200],
  ['LHE-HUB', 'Lahore Central Hub', 'hub', 'Lahore', '22-B Kot Lakhpat Industrial Estate, Lahore', 'Usman Tariq', 3800],
  ['ISB-HUB', 'Islamabad Hub', 'hub', 'Islamabad', 'Plot 9, Sector I-9/3, Islamabad', 'Hamza Qureshi', 2600],
  ['RWP-01', 'Rawalpindi Saddar Branch', 'branch', 'Rawalpindi', '41 Bank Road, Saddar, Rawalpindi', 'Bilal Ashraf', 1200],
  ['FSD-01', 'Faisalabad Branch', 'branch', 'Faisalabad', '7 Susan Road, Madina Town, Faisalabad', 'Imran Chaudhry', 1400],
  ['MUX-01', 'Multan Branch', 'branch', 'Multan', '18 Bosan Road, Gulgasht Colony, Multan', 'Kashif Gillani', 1100],
  ['PEW-01', 'Peshawar Branch', 'branch', 'Peshawar', '5 University Road, University Town, Peshawar', 'Adnan Afridi', 1000],
  ['KHI-02', 'Karachi Clifton Express Centre', 'branch', 'Karachi', 'Shop 3, Block 5, Clifton, Karachi', 'Sana Mirza', 600],
  ['LHE-02', 'Lahore Gulberg Express Centre', 'branch', 'Lahore', '112 MM Alam Road, Gulberg III, Lahore', 'Maryam Sheikh', 650],
  ['ISB-02', 'Blue Area Express Centre', 'branch', 'Islamabad', 'Office 4, Jinnah Avenue, Blue Area, Islamabad', 'Zainab Raza', 500],
]

export const SEED_BRANCHES: Branch[] = BRANCH_SEEDS.map(([code, name, type, city, address, managerName, dailyCapacity], i) => ({
  id: `br_${code.toLowerCase().replace('-', '_')}`,
  code,
  name,
  type,
  city,
  address,
  phone: `+92 ${CITY_INFO[city].code === 'KHI' ? '21' : CITY_INFO[city].code === 'LHE' ? '42' : '51'} 555 ${1200 + i * 11}`,
  managerName,
  status: 'active',
  dailyCapacity,
  openedAt: daysAgo(2400 - i * 190),
}))

/** Primary facility for a city — first branch listed for it. */
export function mainBranchFor(city: City, branches: Branch[] = SEED_BRANCHES): Branch {
  return branches.find((b) => b.city === city) ?? branches[0]
}

type CustomerSeed = [name: string, city: City, company?: string]

const CUSTOMER_SEEDS: CustomerSeed[] = [
  ['Ayesha Khan', 'Lahore'],
  ['Zarposh Textiles', 'Faisalabad', 'Zarposh Textiles (Pvt) Ltd'],
  ['Indus Gadgets', 'Karachi', 'Indus Gadgets'],
  ['Hassan Raza', 'Islamabad'],
  ['Noor Organics', 'Lahore', 'Noor Organics'],
  ['Fatima Malik', 'Karachi'],
  ['Margalla Books', 'Islamabad', 'Margalla Books & Stationers'],
  ['Omar Farooq', 'Rawalpindi'],
  ['Chenab Crafts', 'Multan', 'Chenab Handicrafts'],
  ['Sara Ahmed', 'Lahore'],
  ['Bolan Electronics', 'Karachi', 'Bolan Electronics Trading'],
  ['Ali Hamdani', 'Peshawar'],
  ['Sitara Home Store', 'Faisalabad', 'Sitara Home Store'],
  ['Hira Baig', 'Karachi'],
  ['Karakoram Outfitters', 'Islamabad', 'Karakoram Outfitters'],
  ['Danish Iqbal', 'Multan'],
  ['Mehwish Aslam', 'Rawalpindi'],
  ['Khyber Dry Fruits', 'Peshawar', 'Khyber Dry Fruits Co.'],
  ['Taimoor Javed', 'Lahore'],
  ['Rabia Yousaf', 'Faisalabad'],
  ['Ravi Sports', 'Lahore', 'Ravi Sports Goods'],
  ['Nida Hussain', 'Karachi'],
  ['Shahzad Anwar', 'Islamabad'],
  ['Mehran Pharma Supplies', 'Karachi', 'Mehran Pharma Supplies'],
]

export const SEED_CUSTOMERS: Customer[] = CUSTOMER_SEEDS.map(([name, city, company], i) => {
  const areas = CITY_INFO[city].areas
  return {
    id: `cus_${String(i + 1).padStart(3, '0')}`,
    name,
    email: `${slug(name)}@example.com`,
    phone: phone(i + 3),
    city,
    address: `House ${12 + i * 3}, Street ${4 + (i % 9)}, ${areas[i % areas.length]}`,
    accountType: company ? 'business' : 'individual',
    company,
    status: i === 15 ? 'suspended' : 'active',
    joinedAt: daysAgo(40 + i * 31),
  }
})

type DriverSeed = [name: string, branchCode: string, vehicle: Driver['vehicleType'], availability: Driver['availability']]

const DRIVER_SEEDS: DriverSeed[] = [
  ['Imran Ali', 'LHE-HUB', 'bike', 'on_route'],
  ['Waqas Butt', 'LHE-HUB', 'bike', 'on_route'],
  ['Naveed Akhtar', 'LHE-HUB', 'van', 'available'],
  ['Shoaib Mehmood', 'LHE-02', 'bike', 'available'],
  ['Rashid Mehmood', 'KHI-HUB', 'bike', 'on_route'],
  ['Asif Baloch', 'KHI-HUB', 'van', 'on_route'],
  ['Junaid Memon', 'KHI-HUB', 'truck', 'available'],
  ['Kamran Shah', 'KHI-02', 'bike', 'off_duty'],
  ['Tariq Abbasi', 'ISB-HUB', 'bike', 'on_route'],
  ['Faisal Kiani', 'ISB-HUB', 'van', 'available'],
  ['Zubair Satti', 'RWP-01', 'bike', 'on_route'],
  ['Sajid Gujjar', 'FSD-01', 'bike', 'on_route'],
  ['Arshad Nadeem', 'FSD-01', 'van', 'off_duty'],
  ['Mudassir Khosa', 'MUX-01', 'bike', 'on_route'],
  ['Gul Zaman', 'PEW-01', 'bike', 'on_route'],
  ['Irfan Yousafzai', 'PEW-01', 'van', 'available'],
]

const branchIdByCode = (code: string) => SEED_BRANCHES.find((b) => b.code === code)!.id

export const SEED_DRIVERS: Driver[] = DRIVER_SEEDS.map(([name, branchCode, vehicleType, availability], i) => {
  const cityCode = branchCode.slice(0, 3)
  return {
    id: `drv_${String(i + 1).padStart(3, '0')}`,
    name,
    phone: phone(i + 41),
    email: `${slug(name)}@courierpro.example`,
    branchId: branchIdByCode(branchCode),
    vehicleType,
    vehiclePlate: `${cityCode === 'KHI' ? 'KHI' : cityCode === 'ISB' ? 'ICT' : cityCode}-${2100 + i * 173}`,
    availability,
    rating: Math.round((4.2 + ((i * 7) % 8) / 10) * 10) / 10,
    joinedAt: daysAgo(120 + i * 67),
  }
})

export const ROLE_META: Record<StaffRole, { label: string; permissions: string[] }> = {
  branch_manager: {
    label: 'Branch Manager',
    permissions: ['shipments.view', 'shipments.update', 'manifests.manage', 'staff.view', 'reports.view', 'cod.reconcile'],
  },
  operations: { label: 'Operations Officer', permissions: ['shipments.view', 'shipments.update', 'manifests.manage', 'reports.view'] },
  scanner: { label: 'Parcel Scanner', permissions: ['shipments.view', 'shipments.scan'] },
  dispatcher: { label: 'Dispatcher', permissions: ['shipments.view', 'manifests.manage', 'drivers.assign'] },
  finance: { label: 'Finance Officer', permissions: ['cod.view', 'cod.reconcile', 'reports.view'] },
  support: { label: 'Customer Support', permissions: ['shipments.view', 'customers.view', 'tickets.manage'] },
}

export const ALL_PERMISSIONS = [
  'shipments.view',
  'shipments.update',
  'shipments.scan',
  'manifests.manage',
  'drivers.assign',
  'customers.view',
  'tickets.manage',
  'staff.view',
  'cod.view',
  'cod.reconcile',
  'reports.view',
]

type StaffSeed = [name: string, role: StaffRole, branchCode: string]

const STAFF_SEEDS: StaffSeed[] = [
  ['Usman Tariq', 'branch_manager', 'LHE-HUB'],
  ['Sadia Rehman', 'operations', 'LHE-HUB'],
  ['Adeel Nawaz', 'scanner', 'LHE-HUB'],
  ['Komal Zafar', 'dispatcher', 'LHE-HUB'],
  ['Farhan Siddiqui', 'branch_manager', 'KHI-HUB'],
  ['Mahnoor Ansari', 'operations', 'KHI-HUB'],
  ['Yasir Soomro', 'scanner', 'KHI-HUB'],
  ['Rehan Qazi', 'finance', 'KHI-HUB'],
  ['Hamza Qureshi', 'branch_manager', 'ISB-HUB'],
  ['Iqra Naseem', 'support', 'ISB-HUB'],
  ['Saad Mirza', 'dispatcher', 'ISB-HUB'],
  ['Bilal Ashraf', 'branch_manager', 'RWP-01'],
  ['Amna Tahir', 'scanner', 'RWP-01'],
  ['Imran Chaudhry', 'branch_manager', 'FSD-01'],
  ['Nabeel Arif', 'operations', 'FSD-01'],
  ['Kashif Gillani', 'branch_manager', 'MUX-01'],
  ['Uzma Bukhari', 'finance', 'MUX-01'],
  ['Adnan Afridi', 'branch_manager', 'PEW-01'],
  ['Sana Mirza', 'branch_manager', 'KHI-02'],
  ['Maryam Sheikh', 'branch_manager', 'LHE-02'],
  ['Zainab Raza', 'branch_manager', 'ISB-02'],
  ['Hina Altaf', 'support', 'LHE-HUB'],
]

export const SEED_STAFF: Staff[] = STAFF_SEEDS.map(([name, role, branchCode], i) => ({
  id: `stf_${String(i + 1).padStart(3, '0')}`,
  name,
  email: `${slug(name)}@courierpro.example`,
  phone: phone(i + 71),
  role,
  branchId: branchIdByCode(branchCode),
  status: i === 6 ? 'on_leave' : i === 16 ? 'inactive' : 'active',
  joinedAt: daysAgo(90 + i * 83),
  permissions: ROLE_META[role].permissions,
}))
