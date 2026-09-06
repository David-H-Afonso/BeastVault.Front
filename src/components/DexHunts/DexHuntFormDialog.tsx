import { useState, type FormEvent } from 'react'
import type { DexHuntGame, DexHuntListSummary } from '@/services/DexHunts'
import { DexHuntDialog } from './DexHuntDialog'

interface DexHuntFormDialogProps {
	games: DexHuntGame[]
	list?: DexHuntListSummary
	busy: boolean
	error: string | null
	onClose: () => void
	onSubmit: (value: { name: string; gameId: number; description: string | null }) => void
}

export function DexHuntFormDialog({ games, list, busy, error, onClose, onSubmit }: DexHuntFormDialogProps) {
	const [name, setName] = useState(list?.name ?? '')
	const [gameId, setGameId] = useState(list?.gameId ?? games[0]?.id ?? 0)
	const [description, setDescription] = useState(list?.description ?? '')
	const submit = (event: FormEvent) => {
		event.preventDefault()
		onSubmit({ name, gameId, description: description.trim() || null })
	}

	return (
		<DexHuntDialog
			title={list ? 'Edit Dex Hunt' : 'Create a Dex Hunt'}
			description='Choose the game this checklist belongs to. Targets stay separate from your vault.'
			onClose={onClose}>
			<form className='dex-hunt-form' onSubmit={submit}>
				<label>
					<span>Name</span>
					<input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required placeholder='Paldea Pokédex gaps' />
				</label>
				<label>
					<span>Game</span>
					<select value={gameId} onChange={(event) => setGameId(Number(event.target.value))} required>
						{Array.from(new Set(games.map((game) => game.generation))).map((generation) => (
							<optgroup key={generation} label={`Generation ${generation}`}>
								{games.filter((game) => game.generation === generation).map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}
							</optgroup>
						))}
					</select>
				</label>
				<label>
					<span>Description <small>optional</small></span>
					<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={3} placeholder='Trades, exclusives and encounters still missing.' />
				</label>
				{error && <p className='dex-hunt-form__error' role='alert'>{error}</p>}
				<footer className='dex-hunt-dialog__actions'>
					<button type='button' className='dex-hunt-button dex-hunt-button--quiet' onClick={onClose}>Cancel</button>
					<button type='submit' className='dex-hunt-button dex-hunt-button--primary' disabled={busy || !name.trim() || gameId === 0}>{busy ? 'Saving…' : list ? 'Save changes' : 'Create hunt'}</button>
				</footer>
			</form>
		</DexHuntDialog>
	)
}
