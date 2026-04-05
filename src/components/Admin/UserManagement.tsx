import { useEffect, useState, type FormEvent } from 'react'
import { useAppSelector } from '@/store/hooks'
import type { AuthUser, RegisterRequest, UpdateUserRequest, UserRole } from '@/models/Auth'
import * as authService from '@/services/Auth'
import './UserManagement.scss'

type FormMode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; user: AuthUser }

export default function UserManagement() {
	const token = useAppSelector((state) => state.auth.token)!
	const currentUser = useAppSelector((state) => state.auth.user)

	const [users, setUsers] = useState<AuthUser[]>([])
	const [error, setError] = useState<string | null>(null)
	const [formMode, setFormMode] = useState<FormMode>({ kind: 'closed' })

	const loadUsers = async () => {
		try {
			setError(null)
			setUsers(await authService.getUsers(token))
		} catch (err: any) {
			setError(err.message)
		}
	}

	useEffect(() => {
		loadUsers()
	}, [])

	const handleDelete = async (user: AuthUser) => {
		if (user.isDefault) return
		if (!globalThis.confirm(`Delete user "${user.username}"?`)) return
		try {
			await authService.deleteUser(token, user.id)
			await loadUsers()
		} catch (err: any) {
			setError(err.message)
		}
	}

	return (
		<div className='user-management'>
			<h1 className='user-management__title'>User Management</h1>
			{error && <div className='user-management__error'>{error}</div>}

			<div className='user-management__actions'>
				<button
					className='user-management__btn user-management__btn--primary'
					onClick={() => setFormMode({ kind: 'create' })}>
					Create User
				</button>
			</div>

			<table className='user-management__table'>
				<thead>
					<tr>
						<th>ID</th>
						<th>Username</th>
						<th>Role</th>
						<th>Password</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{users.map((u) => (
						<tr key={u.id}>
							<td>{u.id}</td>
							<td>{u.username}</td>
							<td>
								<span
									className={`user-management__badge user-management__badge--${u.role.toLowerCase()}`}>
									{u.role}
								</span>
							</td>
							<td>{u.hasPassword ? 'Set' : <span style={{ color: '#f59e0b' }}>None</span>}</td>
							<td>
								<div className='user-management__cell-actions'>
									<button
										className='user-management__btn user-management__btn--primary user-management__btn--small'
										onClick={() => setFormMode({ kind: 'edit', user: u })}>
										Edit
									</button>
									{!u.isDefault && u.id !== currentUser?.id && (
										<button
											className='user-management__btn user-management__btn--danger user-management__btn--small'
											onClick={() => handleDelete(u)}>
											Delete
										</button>
									)}
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{formMode.kind !== 'closed' && (
				<UserFormModal
					mode={formMode}
					token={token}
					onClose={() => setFormMode({ kind: 'closed' })}
					onSaved={loadUsers}
				/>
			)}
		</div>
	)
}

function UserFormModal({
	mode,
	token,
	onClose,
	onSaved,
}: {
	mode: Exclude<FormMode, { kind: 'closed' }>
	token: string
	onClose: () => void
	onSaved: () => Promise<void>
}) {
	const isEdit = mode.kind === 'edit'
	const [username, setUsername] = useState(isEdit ? mode.user.username : '')
	const [password, setPassword] = useState('')
	const [role, setRole] = useState<UserRole>(isEdit ? mode.user.role : 'Standard')
	const [saving, setSaving] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		setSaving(true)
		setFormError(null)
		try {
			if (isEdit) {
				const req: UpdateUserRequest = {}
				if (username !== mode.user.username) req.username = username
				if (password) req.password = password
				if (role !== mode.user.role) req.role = role
				await authService.updateUser(token, mode.user.id, req)
			} else {
				const req: RegisterRequest = { username, role, password: password || undefined }
				await authService.createUser(token, req)
			}
			await onSaved()
			onClose()
		} catch (err: any) {
			setFormError(err.message)
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className='user-form-overlay' onClick={onClose}>
			<div className='user-form' onClick={(e) => e.stopPropagation()}>
				<h2 className='user-form__title'>{isEdit ? 'Edit User' : 'Create User'}</h2>
				<form onSubmit={handleSubmit}>
					<div className='user-form__fields'>
						<div className='user-form__field'>
							<label className='user-form__label' htmlFor='form-username'>
								Username
							</label>
							<input
								id='form-username'
								className='user-form__input'
								type='text'
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
							/>
						</div>
						<div className='user-form__field'>
							<label className='user-form__label' htmlFor='form-password'>
								Password {isEdit && '(leave empty to keep current)'}
							</label>
							<input
								id='form-password'
								className='user-form__input'
								type='password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
						<div className='user-form__field'>
							<label className='user-form__label' htmlFor='form-role'>
								Role
							</label>
							<select
								id='form-role'
								className='user-form__select'
								value={role}
								onChange={(e) => setRole(e.target.value as UserRole)}>
								<option value='Standard'>Standard</option>
								<option value='Admin'>Admin</option>
							</select>
						</div>
					</div>
					{formError && <div className='user-management__error'>{formError}</div>}
					<div className='user-form__actions'>
						<button
							type='button'
							className='user-management__btn'
							style={{
								background: 'var(--border-color, #2a2a4a)',
								color: 'var(--text-primary, #e0e0e0)',
							}}
							onClick={onClose}>
							Cancel
						</button>
						<button
							type='submit'
							className='user-management__btn user-management__btn--primary'
							disabled={saving || !username}>
							{saving ? 'Saving...' : isEdit ? 'Save' : 'Create'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
