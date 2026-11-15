import { Button } from '../../../../components/ui'
import { EmptyRequests } from '../../../../components/art'
import AuthLayout from './AuthLayout'

export default function PendingPage() {
  return (
    <AuthLayout
      art={<EmptyRequests size={136} />}
      title="Your request is being reviewed"
      description="The owner has to approve your account first. Sign in again later to check. Once approved you go straight to the panel. If the request is declined your details are deleted."
    >
      <div className="flex flex-col gap-2">
        <Button to="/admin/login" size="lg" className="w-full md:h-10 md:text-sm">Sign in</Button>
        <Button to="/" variant="secondary" size="lg" className="w-full md:h-10 md:text-sm">Back to the quote page</Button>
      </div>
    </AuthLayout>
  )
}
