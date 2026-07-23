import { environment } from '@/environments'
import type {
	HouseholdAuthorizationApiRequest,
	HouseholdAuthorizationResponse,
} from '@/integrations/householdAuthorization'
import { customFetch } from '@/utils'

export function submitHouseholdAuthorization(
	request: HouseholdAuthorizationApiRequest
): Promise<HouseholdAuthorizationResponse> {
	return customFetch<HouseholdAuthorizationResponse>(
		`${environment.baseUrl}/api/integrations/household/v1/authorize`,
		{
			method: 'POST',
			body: request,
		}
	)
}
