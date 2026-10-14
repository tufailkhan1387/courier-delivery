import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CITIES, CITY_INFO } from '@/data/cities'
import { ZONE_LABEL } from '@/features/shipments/meta'
import type { PricingZone } from '@/types'
import { cn } from '@/utils/cn'
import { getZone } from './calc'

const ZONE_CELL: Record<PricingZone, string> = {
  within_city: 'bg-emerald-50 text-emerald-700',
  same_zone: 'bg-brand-50 text-brand-700',
  different_zone: 'bg-purple-50 text-purple-700',
}

const ZONE_HELP: Record<PricingZone, string> = {
  within_city: 'Origin and destination are the same city',
  same_zone: 'Different cities in the same region',
  different_zone: 'Cities in different regions',
}

/** Which pricing zone applies between every pair of serviced cities. */
export function ZoneMatrix() {
  return (
    <Card>
      <CardHeader title="City / zone matrix" description="The zone decides which rate card prices a shipment. Zones follow each city’s region." />
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <caption className="sr-only">Pricing zone between each origin city (rows) and destination city (columns)</caption>
            <thead>
              <tr className="bg-gray-50">
                <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  From / To
                </th>
                {CITIES.map((city) => (
                  <th key={city} scope="col" className="px-2 py-2.5 text-center text-xs font-semibold text-gray-700">
                    {city}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CITIES.map((origin) => (
                <tr key={origin} className="border-t border-gray-200">
                  <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-medium text-gray-900">
                    {origin}
                    <span className="ml-1.5 text-xs font-normal text-gray-500">{CITY_INFO[origin].region}</span>
                  </th>
                  {CITIES.map((destination) => {
                    const zone = getZone(origin, destination)
                    return (
                      <td key={destination} className="p-1 text-center">
                        <span className={cn('block whitespace-nowrap rounded-md px-1.5 py-1.5 text-xs font-medium', ZONE_CELL[zone])}>{ZONE_LABEL[zone]}</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
          {(Object.keys(ZONE_LABEL) as PricingZone[]).map((zone) => (
            <li key={zone} className="flex items-center gap-2 text-xs text-gray-600">
              <span className={cn('rounded px-1.5 py-0.5 font-medium', ZONE_CELL[zone])}>{ZONE_LABEL[zone]}</span>
              {ZONE_HELP[zone]}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
