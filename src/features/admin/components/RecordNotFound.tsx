import { SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/** Not-found state for `:id` detail routes. */
export function RecordNotFound({ entity, backTo, backLabel }: { entity: string; backTo: string; backLabel: string }) {
  return (
    <Card>
      <EmptyState
        icon={SearchX}
        title={`${entity} not found`}
        description={`This ${entity.toLowerCase()} doesn’t exist in the demo data or the link is out of date.`}
        action={
          <Button asChild>
            <Link to={backTo}>{backLabel}</Link>
          </Button>
        }
      />
    </Card>
  )
}
