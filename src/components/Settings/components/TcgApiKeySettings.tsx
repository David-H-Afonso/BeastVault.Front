import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
	getTcgApiKeyStatus,
	updateTcgApiKey,
	type TcgApiKeyStatusDto,
} from '@/services/TcgCollection'

type Feedback = { type: 'success' | 'error'; text: string }

const formatUpdatedAt = (value: string | null) => {
	if (!value) return null
	const date = new Date(value)
	return Number.isNaN(date.getTime())
		? value
		: new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function TcgApiKeySettings() {
	const [status, setStatus] = useState<TcgApiKeyStatusDto | null>(null)
	const [apiKey, setApiKey] = useState('')
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [feedback, setFeedback] = useState<Feedback | null>(null)
	const insecureConnection = typeof window !== 'undefined' && !window.isSecureContext

	const loadStatus = useCallback(async () => {
		setLoading(true)
		setFeedback(null)
		try {
			setStatus(await getTcgApiKeyStatus())
		} catch (error) {
			setFeedback({
				type: 'error',
				text: error instanceof Error ? error.message : 'Could not read the TCG API key status.',
			})
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadStatus()
	}, [loadStatus])

	const save = async (event: FormEvent) => {
		event.preventDefault()
		const nextKey = apiKey.trim()
		if (!nextKey) {
			setFeedback({ type: 'error', text: 'Enter an API key before saving.' })
			return
		}
		setSaving(true)
		setFeedback(null)
		try {
			setStatus(await updateTcgApiKey(nextKey))
			setApiKey('')
			setFeedback({ type: 'success', text: 'TCG API key saved securely on the server.' })
		} catch (error) {
			setFeedback({
				type: 'error',
				text: error instanceof Error ? error.message : 'Could not save the TCG API key.',
			})
		} finally {
			setSaving(false)
		}
	}

	const remove = async () => {
		setSaving(true)
		setFeedback(null)
		try {
			setStatus(await updateTcgApiKey(null))
			setApiKey('')
			setFeedback({ type: 'success', text: 'TCG API key removed.' })
		} catch (error) {
			setFeedback({
				type: 'error',
				text: error instanceof Error ? error.message : 'Could not remove the TCG API key.',
			})
		} finally {
			setSaving(false)
		}
	}

	return (
		<section className='settings-section settings-tcg-key'>
			<h2 className='section-title'>
				<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
					<circle cx='8' cy='15' r='4' />
					<path d='m11 12 8-8M15 8l2 2M17 6l2 2' />
				</svg>
				TCG price enhancement
			</h2>
			<div className='settings-tcg-key__copy'>
				<div>
					<strong>Optional TCG API key</strong>
					<p>TCGdex card search and collection tracking work without a key. Add one only to enhance price coverage where supported.</p>
				</div>
				<span className={`settings-tcg-key__status${status?.configured ? ' is-configured' : ''}`}>
					{loading ? 'Checking…' : status?.configured ? 'Configured' : 'Not configured'}
				</span>
			</div>
			<div className='settings-tcg-key__guide'>
				<div><span>1</span><p><strong>Create a free developer account</strong>Open the Pokémon TCG API developer portal and register or sign in.</p></div>
				<div><span>2</span><p><strong>Copy your API key</strong>Use the key shown in your developer dashboard. Do not paste your account password.</p></div>
				<div><span>3</span><p><strong>Save it below</strong>BeastVault stores an encrypted server-side copy for your account.</p></div>
				<a href='https://dev.pokemontcg.io/' target='_blank' rel='noreferrer'>Open Pokémon TCG API developer portal <span aria-hidden='true'>↗</span></a>
			</div>

			{status?.configured && (
				<div className='settings-tcg-key__configured'>
					<span>Stored key</span>
					<strong>{status.maskedApiKey || '••••••••'}</strong>
					{status.updatedAt && <small>Updated {formatUpdatedAt(status.updatedAt)}</small>}
				</div>
			)}
			{insecureConnection && (
				<div className='settings-tcg-key__feedback settings-tcg-key__feedback--error' role='alert'>
					This connection is not encrypted. Use BeastVault through HTTPS before entering an API key.
				</div>
			)}

			<form className='settings-tcg-key__form' onSubmit={save}>
				<label htmlFor='tcg-api-key'>
					<span>{status?.configured ? 'Replace API key' : 'API key'}</span>
					<input
						id='tcg-api-key'
						type='password'
						autoComplete='new-password'
						value={apiKey}
						onChange={(event) => setApiKey(event.target.value)}
						placeholder={status?.configured ? 'Enter a new key to replace it' : 'Enter your optional API key'}
						disabled={loading || saving}
					/>
				</label>
				<div className='settings-tcg-key__actions'>
					<button type='submit' className='settings-tcg-key__save' disabled={loading || saving || !apiKey.trim()}>
						{saving ? 'Saving…' : 'Save key'}
					</button>
					{status?.configured && (
						<button type='button' className='settings-tcg-key__remove' onClick={remove} disabled={saving}>
							Remove
						</button>
					)}
				</div>
			</form>

			{feedback && (
				<div className={`settings-tcg-key__feedback settings-tcg-key__feedback--${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
					<span>{feedback.text}</span>
					{feedback.type === 'error' && !status && <button type='button' onClick={loadStatus}>Retry</button>}
				</div>
			)}
			<small className='settings-tcg-key__privacy'>This key is for the third-party Pokémon TCG API, not your BeastVault password. It is sent directly to BeastVault and is never stored in Redux or localStorage.</small>
		</section>
	)
}
