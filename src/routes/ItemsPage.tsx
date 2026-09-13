import { PageHeading } from '../ui/PageHeading'
import { FavouritesPanel } from '../components/FavouritesPanel'

export function ItemsPage() {
  return (
    <div className="space-y-4">
      <PageHeading>Items</PageHeading>
      <FavouritesPanel />
    </div>
  )
}
