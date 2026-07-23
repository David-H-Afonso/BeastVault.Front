import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
	HOUSEHOLD_SCOPE_LABELS,
	parseHouseholdAuthorization,
} from '@/integrations/householdAuthorization'
import { submitHouseholdAuthorization } from '@/services/HouseholdIntegration'
import './HouseholdAuthorization.scss'

export default function HouseholdAuthorization() {
	const location = useLocation()
	const { user } = useAuth()
	const parsed = useMemo(() => parseHouseholdAuthorization(location.search), [location.search])
	const authorizationRequest = parsed.request
	const [submitting, setSubmitting] = useState<'approve' | 'deny' | null>(null)
	const [error, setError] = useState<string | null>(null)

	const submitDecision = async (approved: boolean) => {
		if (!authorizationRequest || submitting) return
		setSubmitting(approved ? 'approve' : 'deny')
		setError(null)

		try {
			const response = await submitHouseholdAuthorization({ ...authorizationRequest, approved })
			window.location.assign(response.redirectUri)
		} catch {
			setError('Beast Vault could not complete the authorization request. Please try again.')
			setSubmitting(null)
		}
	}

	return (
		<main className='household-consent'>
			<section className='household-consent__card' aria-labelledby='household-consent-title'>
				<div className='household-consent__eyebrow'>Account connection</div>
				<h1 id='household-consent-title'>Connect Beast Vault to Household?</h1>
				<p className='household-consent__intro'>
					Household is requesting access to the Beast Vault account{' '}
					<strong>{user?.username ?? 'currently signed in'}</strong>.
				</p>

				{parsed.error || !authorizationRequest ? (
					<div className='household-consent__error' role='alert'>
						{parsed.error} Do not continue from this page.
					</div>
				) : (
					<>
						<div className='household-consent__client'>
							<span className='household-consent__client-mark' aria-hidden='true'>
								H
							</span>
							<div>
								<span>Application</span>
								<strong>Household</strong>
							</div>
						</div>

						<h2>Household will be able to:</h2>
						<ul className='household-consent__scopes'>
							{authorizationRequest.scopes.map((scope) => (
								<li key={scope}>
									<span className='household-consent__check' aria-hidden='true'>✓</span>
									<div>
										<strong>{HOUSEHOLD_SCOPE_LABELS[scope].title}</strong>
										<span>{HOUSEHOLD_SCOPE_LABELS[scope].description}</span>
									</div>
								</li>
							))}
						</ul>

						<p className='household-consent__notice'>
							Household never receives your Beast Vault password. You can revoke this
							connection later, and Household cannot import, export, delete, scan, or manage
							your server.
						</p>

						{error && (
							<div className='household-consent__error' role='alert'>
								{error}
							</div>
						)}

						<div className='household-consent__actions'>
							<button
								type='button'
								className='household-consent__button household-consent__button--secondary'
								disabled={submitting !== null}
								onClick={() => void submitDecision(false)}
							>
								{submitting === 'deny' ? 'Denying…' : 'Deny'}
							</button>
							<button
								type='button'
								className='household-consent__button household-consent__button--primary'
								disabled={submitting !== null}
								onClick={() => void submitDecision(true)}
							>
								{submitting === 'approve' ? 'Connecting…' : 'Approve and connect'}
							</button>
						</div>
					</>
				)}
			</section>
		</main>
	)
}
