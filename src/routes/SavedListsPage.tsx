import { PageHeading } from '../ui/PageHeading'
import { SavedListManager } from '../components/SavedListManager'

export function SavedListsPage() {
  return <div className="space-y-4"><PageHeading>Saved lists</PageHeading><SavedListManager /></div>
}
