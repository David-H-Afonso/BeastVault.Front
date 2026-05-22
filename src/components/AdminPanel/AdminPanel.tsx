import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
	getUsers,
	deleteUser,
	register,
	adminResetPassword,
	updatePassword,
	adminRenameUser,
	adminUpdateRole,
	renameOwnUser,
} from '@/services/Auth'
import { getPopulationStatus, populatePokedex, populateItems } from '@/services/PokedexCache'
import type { UserDto } from '@/models/Auth'
import type { PopulationStatus } from '@/services/PokedexCache'
import './AdminPanel.scss'

const AdminPanel: React.FC = () => {
	const { user, isAdmin } = useAuth()

	const [users, setUsers] = useState<UserDto[]>([])
	const [loadingUsers, setLoadingUsers] = useState(false)
	const [usersError, setUsersError] = useState<string | null>(null)

	// Create user form
	const [newUsername, setNewUsername] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [createLoading, setCreateLoading] = useState(false)
	const [createMessage, setCreateMessage] = useState<{
		type: 'success' | 'error'
		text: string
	} | null>(null)

	// Reset password
	const [resetUserId, setResetUserId] = useState<number | null>(null)
	const [resetPassword, setResetPassword] = useState('')
	const [resetLoading, setResetLoading] = useState(false)
	const [resetMessage, setResetMessage] = useState<{
		type: 'success' | 'error'
		text: string
	} | null>(null)

	// Change own password
	const [currentPassword, setCurrentPassword] = useState('')
	const [ownNewPassword, setOwnNewPassword] = useState('')
	const [ownConfirmPassword, setOwnConfirmPassword] = useState('')
	const [ownPwdLoading, setOwnPwdLoading] = useState(false)
	const [ownPwdMessage, setOwnPwdMessage] = useState<{
		type: 'success' | 'error'
		text: string
	} | null>(null)

	// Delete confirmation
	const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

	// Rename user
	const [renameUserId, setRenameUserId] = useState<number | null>(null)
	const [renameUsername, setRenameUsername] = useState('')
	const [renameLoading, setRenameLoading] = useState(false)
	const [renameMessage, setRenameMessage] = useState<{
		type: 'success' | 'error'
		text: string
	} | null>(null)

	// Change own username
	const [ownNewUsername, setOwnNewUsername] = useState('')
	const [ownRenameLoading, setOwnRenameLoading] = useState(false)
	const [ownRenameMessage, setOwnRenameMessage] = useState<{
		type: 'success' | 'error'
		text: string
	} | null>(null)

	// Pokedex populate
	const [popStatus, setPopStatus] = useState<PopulationStatus | null>(null)
	const [popStartId, setPopStartId] = useState(1)
	const [popEndId, setPopEndId] = useState(1025)
	const [popLoading, setPopLoading] = useState(false)
	const [popMessage, setPopMessage] = useState<{
		type: 'success' | 'error'
		text: string
	} | null>(null)

	// Items populate
	const [itemStartId, setItemStartId] = useState(1)
	const [itemEndId, setItemEndId] = useState(2180)
	const [itemLoading, setItemLoading] = useState(false)
	const [itemMessage, setItemMessage] = useState<{
		type: 'success' | 'error'
		text: string
	} | null>(null)

	const fetchUsers = useCallback(async () => {
		if (!isAdmin) return
		setLoadingUsers(true)
		setUsersError(null)
		try {
			const data = await getUsers()
			setUsers(data)
		} catch (err) {
			setUsersError(err instanceof Error ? err.message : 'Failed to load users')
		} finally {
			setLoadingUsers(false)
		}
	}, [isAdmin])

	useEffect(() => {
		fetchUsers()
	}, [fetchUsers])

	// Fetch pokedex status on mount (admin only)
	const fetchPopStatus = useCallback(async () => {
		if (!isAdmin) return
		try {
			const status = await getPopulationStatus()
			setPopStatus(status)
		} catch {
			/* ignore */
		}
	}, [isAdmin])

	useEffect(() => {
		fetchPopStatus()
	}, [fetchPopStatus])

	// Poll status while populating
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

	useEffect(() => {
		const isAnyPopulating = popStatus?.isPopulating || popStatus?.isPopulatingItems
		if (isAnyPopulating && !pollRef.current) {
			if (popStatus?.isPopulating) setPopLoading(true)
			if (popStatus?.isPopulatingItems) setItemLoading(true)
			pollRef.current = setInterval(() => {
				fetchPopStatus()
			}, 3000)
		} else if (!isAnyPopulating && pollRef.current) {
			clearInterval(pollRef.current)
			pollRef.current = null
			setPopLoading(false)
			setItemLoading(false)
		}
		return () => {
			if (pollRef.current) clearInterval(pollRef.current)
		}
	}, [popStatus?.isPopulating, popStatus?.isPopulatingItems, fetchPopStatus])

	const handlePopulate = async () => {
		setPopLoading(true)
		setPopMessage(null)
		try {
			await populatePokedex(popStartId, popEndId)
			setPopMessage({
				type: 'success',
				text: 'Population started. Progress will update automatically.',
			})
			// Start polling
			fetchPopStatus()
		} catch (err) {
			setPopMessage({
				type: 'error',
				text: err instanceof Error ? err.message : 'Failed to populate',
			})
			setPopLoading(false)
		}
	}

	const handlePopulateItems = async () => {
		setItemLoading(true)
		setItemMessage(null)
		try {
			await populateItems(itemStartId, itemEndId)
			setItemMessage({
				type: 'success',
				text: 'Item population started. Progress will update automatically.',
			})
			fetchPopStatus()
		} catch (err) {
			setItemMessage({
				type: 'error',
				text: err instanceof Error ? err.message : 'Failed to populate items',
			})
			setItemLoading(false)
		}
	}

	const handleCreateUser = async (e: React.FormEvent) => {
		e.preventDefault()
		setCreateMessage(null)

		if (!newUsername.trim()) {
			setCreateMessage({ type: 'error', text: 'Username is required' })
			return
		}
		if (!newPassword) {
			setCreateMessage({ type: 'error', text: 'Password is required' })
			return
		}

		setCreateLoading(true)
		try {
			await register({ username: newUsername.trim(), password: newPassword })
			setCreateMessage({ type: 'success', text: `User "${newUsername.trim()}" created` })
			setNewUsername('')
			setNewPassword('')
			fetchUsers()
		} catch (err) {
			setCreateMessage({
				type: 'error',
				text: err instanceof Error ? err.message : 'Failed to create user',
			})
		} finally {
			setCreateLoading(false)
		}
	}

	const handleDeleteUser = async (id: number) => {
		try {
			await deleteUser(id)
			setDeleteConfirmId(null)
			fetchUsers()
		} catch (err) {
			setUsersError(err instanceof Error ? err.message : 'Failed to delete user')
		}
	}

	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault()
		if (resetUserId === null) return
		setResetMessage(null)

		if (!resetPassword) {
			setResetMessage({ type: 'error', text: 'New password is required' })
			return
		}

		setResetLoading(true)
		try {
			await adminResetPassword(resetUserId, { newPassword: resetPassword })
			setResetMessage({ type: 'success', text: 'Password reset successfully' })
			setResetPassword('')
			setResetUserId(null)
		} catch (err) {
			setResetMessage({
				type: 'error',
				text: err instanceof Error ? err.message : 'Failed to reset password',
			})
		} finally {
			setResetLoading(false)
		}
	}

	const handleChangeOwnPassword = async (e: React.FormEvent) => {
		e.preventDefault()
		setOwnPwdMessage(null)

		if (!ownNewPassword) {
			setOwnPwdMessage({ type: 'error', text: 'New password is required' })
			return
		}
		if (ownNewPassword !== ownConfirmPassword) {
			setOwnPwdMessage({ type: 'error', text: 'Passwords do not match' })
			return
		}

		setOwnPwdLoading(true)
		try {
			await updatePassword({
				currentPassword: currentPassword || null,
				newPassword: ownNewPassword,
			})
			setOwnPwdMessage({ type: 'success', text: 'Password changed successfully' })
			setCurrentPassword('')
			setOwnNewPassword('')
			setOwnConfirmPassword('')
		} catch (err) {
			setOwnPwdMessage({
				type: 'error',
				text: err instanceof Error ? err.message : 'Failed to change password',
			})
		} finally {
			setOwnPwdLoading(false)
		}
	}

	const handleChangeOwnUsername = async (e: React.FormEvent) => {
		e.preventDefault()
		setOwnRenameMessage(null)

		if (!ownNewUsername.trim()) {
			setOwnRenameMessage({ type: 'error', text: 'Username is required' })
			return
		}

		setOwnRenameLoading(true)
		try {
			await renameOwnUser({ newUsername: ownNewUsername.trim() })
			setOwnRenameMessage({ type: 'success', text: 'Username changed. Please log in again.' })
			setOwnNewUsername('')
		} catch (err) {
			setOwnRenameMessage({
				type: 'error',
				text: err instanceof Error ? err.message : 'Failed to change username',
			})
		} finally {
			setOwnRenameLoading(false)
		}
	}

	const handleRenameUser = async (e: React.FormEvent) => {
		e.preventDefault()
		if (renameUserId === null) return
		setRenameMessage(null)

		if (!renameUsername.trim()) {
			setRenameMessage({ type: 'error', text: 'Username is required' })
			return
		}

		setRenameLoading(true)
		try {
			await adminRenameUser(renameUserId, { newUsername: renameUsername.trim() })
			setRenameMessage({ type: 'success', text: 'Username changed' })
			setRenameUsername('')
			setRenameUserId(null)
			fetchUsers()
		} catch (err) {
			setRenameMessage({
				type: 'error',
				text: err instanceof Error ? err.message : 'Failed to rename user',
			})
		} finally {
			setRenameLoading(false)
		}
	}

	const handleToggleRole = async (u: UserDto) => {
		const newRole = u.role === 'Admin' ? 'Standard' : 'Admin'
		try {
			await adminUpdateRole(u.id, { role: newRole })
			fetchUsers()
		} catch (err) {
			setUsersError(err instanceof Error ? err.message : 'Failed to update role')
		}
	}

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	}

	return (
		<div className='admin-panel'>
			<div className='admin-container'>
				<header className='admin-header'>
					<h1 className='admin-title'>Account Management</h1>
					<p className='admin-subtitle'>
						{isAdmin ? 'Manage users and account settings' : 'Manage your account settings'}
					</p>
				</header>

				{/* Change Own Username */}
				<section className='admin-section'>
					<h2 className='section-title'>Change Username</h2>
					<form className='admin-form' onSubmit={handleChangeOwnUsername}>
						<div className='form-field'>
							<label htmlFor='own-new-username'>New Username</label>
							<input
								id='own-new-username'
								type='text'
								value={ownNewUsername}
								onChange={(e) => setOwnNewUsername(e.target.value)}
								placeholder='Enter new username'
								autoComplete='off'
							/>
						</div>
						{ownRenameMessage && (
							<div className={`form-message form-message--${ownRenameMessage.type}`}>
								{ownRenameMessage.text}
							</div>
						)}
						<button className='btn btn--primary' type='submit' disabled={ownRenameLoading}>
							{ownRenameLoading ? 'Changing...' : 'Change Username'}
						</button>
					</form>
				</section>

				{/* Change Own Password */}
				<section className='admin-section'>
					<h2 className='section-title'>Change Password</h2>
					<form className='admin-form' onSubmit={handleChangeOwnPassword}>
						<div className='form-field'>
							<label htmlFor='current-password'>Current Password</label>
							<input
								id='current-password'
								type='password'
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								placeholder='Leave empty if passwordless'
								autoComplete='current-password'
							/>
						</div>
						<div className='form-field'>
							<label htmlFor='new-password'>New Password</label>
							<input
								id='new-password'
								type='password'
								value={ownNewPassword}
								onChange={(e) => setOwnNewPassword(e.target.value)}
								placeholder='Enter new password'
								autoComplete='new-password'
							/>
						</div>
						<div className='form-field'>
							<label htmlFor='confirm-new-password'>Confirm New Password</label>
							<input
								id='confirm-new-password'
								type='password'
								value={ownConfirmPassword}
								onChange={(e) => setOwnConfirmPassword(e.target.value)}
								placeholder='Confirm new password'
								autoComplete='new-password'
							/>
						</div>
						{ownPwdMessage && (
							<div className={`form-message form-message--${ownPwdMessage.type}`}>
								{ownPwdMessage.text}
							</div>
						)}
						<button className='btn btn--primary' type='submit' disabled={ownPwdLoading}>
							{ownPwdLoading ? 'Changing...' : 'Change Password'}
						</button>
					</form>
				</section>

				{/* Admin-only sections */}
				{isAdmin && (
					<>
						{/* User List */}
						<section className='admin-section'>
							<h2 className='section-title'>Users</h2>
							{loadingUsers && <p className='loading-text'>Loading users...</p>}
							{usersError && <div className='form-message form-message--error'>{usersError}</div>}
							{!loadingUsers && users.length > 0 && (
								<div className='users-table-wrapper'>
									<table className='users-table'>
										<thead>
											<tr>
												<th>Username</th>
												<th>Role</th>
												<th>Created</th>
												<th>Actions</th>
											</tr>
										</thead>
										<tbody>
											{users.map((u) => (
												<tr key={u.id}>
													<td>
														{u.username}
														{u.isDefault && <span className='badge badge--default'>default</span>}
														{u.id === user?.userId && <span className='badge badge--you'>you</span>}
													</td>
													<td>
														<span className={`role-badge role-badge--${u.role.toLowerCase()}`}>
															{u.role}
														</span>
													</td>
													<td>{formatDate(u.createdAt)}</td>
													<td className='actions-cell'>
														<button
															className='btn btn--small btn--secondary'
															onClick={() => {
																setRenameUserId(u.id)
																setRenameUsername(u.username)
																setRenameMessage(null)
															}}
															title='Rename user'>
															✏️
														</button>
														<button
															className='btn btn--small btn--secondary'
															onClick={() => handleToggleRole(u)}
															title={u.role === 'Admin' ? 'Remove admin' : 'Make admin'}
															disabled={u.id === user?.userId}>
															{u.role === 'Admin' ? '👤' : '👑'}
														</button>
														<button
															className='btn btn--small btn--secondary'
															onClick={() => {
																setResetUserId(u.id)
																setResetPassword('')
																setResetMessage(null)
															}}
															title='Reset password'>
															🔑
														</button>
														{!u.isDefault && u.id !== user?.userId && (
															<>
																{deleteConfirmId === u.id ? (
																	<span className='delete-confirm'>
																		<button
																			className='btn btn--small btn--danger'
																			onClick={() => handleDeleteUser(u.id)}>
																			Confirm
																		</button>
																		<button
																			className='btn btn--small btn--secondary'
																			onClick={() => setDeleteConfirmId(null)}>
																			Cancel
																		</button>
																	</span>
																) : (
																	<button
																		className='btn btn--small btn--danger'
																		onClick={() => setDeleteConfirmId(u.id)}
																		title='Delete user'>
																		🗑️
																	</button>
																)}
															</>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</section>

						{/* Reset Password Modal */}
						{resetUserId !== null && (
							<div className='modal-overlay' onClick={() => setResetUserId(null)}>
								<div className='modal' onClick={(e) => e.stopPropagation()}>
									<h3 className='modal-title'>
										Reset Password for{' '}
										<strong>{users.find((u) => u.id === resetUserId)?.username}</strong>
									</h3>
									<form onSubmit={handleResetPassword}>
										<div className='form-field'>
											<label htmlFor='reset-new-password'>New Password</label>
											<input
												id='reset-new-password'
												type='password'
												value={resetPassword}
												onChange={(e) => setResetPassword(e.target.value)}
												placeholder='Enter new password'
												autoFocus
												autoComplete='new-password'
											/>
										</div>
										{resetMessage && (
											<div className={`form-message form-message--${resetMessage.type}`}>
												{resetMessage.text}
											</div>
										)}
										<div className='modal-actions'>
											<button className='btn btn--primary' type='submit' disabled={resetLoading}>
												{resetLoading ? 'Resetting...' : 'Reset Password'}
											</button>
											<button
												className='btn btn--secondary'
												type='button'
												onClick={() => setResetUserId(null)}>
												Cancel
											</button>
										</div>
									</form>
								</div>
							</div>
						)}

						{/* Rename User Modal */}
						{renameUserId !== null && (
							<div className='modal-overlay' onClick={() => setRenameUserId(null)}>
								<div className='modal' onClick={(e) => e.stopPropagation()}>
									<h3 className='modal-title'>
										Rename User{' '}
										<strong>{users.find((u) => u.id === renameUserId)?.username}</strong>
									</h3>
									<form onSubmit={handleRenameUser}>
										<div className='form-field'>
											<label htmlFor='rename-username'>New Username</label>
											<input
												id='rename-username'
												type='text'
												value={renameUsername}
												onChange={(e) => setRenameUsername(e.target.value)}
												placeholder='Enter new username'
												autoFocus
												autoComplete='off'
											/>
										</div>
										{renameMessage && (
											<div className={`form-message form-message--${renameMessage.type}`}>
												{renameMessage.text}
											</div>
										)}
										<div className='modal-actions'>
											<button className='btn btn--primary' type='submit' disabled={renameLoading}>
												{renameLoading ? 'Renaming...' : 'Rename'}
											</button>
											<button
												className='btn btn--secondary'
												type='button'
												onClick={() => setRenameUserId(null)}>
												Cancel
											</button>
										</div>
									</form>
								</div>
							</div>
						)}

						{/* Create User */}
						<section className='admin-section'>
							<h2 className='section-title'>Pokédex Cache</h2>
							{popStatus && (
								<div className='pokedex-status'>
									<p>
										<strong>Species cached:</strong> {popStatus.totalSpecies}
									</p>
									<p>
										<strong>Forms cached:</strong> {popStatus.totalForms}
									</p>
									<p>
										<strong>Max Species ID:</strong> {popStatus.maxSpeciesId}
									</p>
									{popStatus.lastUpdated && (
										<p>
											<strong>Last updated:</strong>{' '}
											{new Date(popStatus.lastUpdated).toLocaleString()}
										</p>
									)}
									{popStatus.isPopulating && (
										<div className='populate-progress'>
											<p>
												<strong>Progress:</strong> {popStatus.populatingCurrent} /{' '}
												{popStatus.populatingTotal} species
											</p>
											<div className='progress-bar'>
												<div
													className='progress-bar-fill'
													style={{
														width: `${(popStatus.populatingCurrent / popStatus.populatingTotal) * 100}%`,
													}}
												/>
											</div>
										</div>
									)}
								</div>
							)}
							<div className='admin-form'>
								<div className='form-row'>
									<div className='form-field'>
										<label htmlFor='pop-start'>Start ID</label>
										<input
											id='pop-start'
											type='number'
											min={1}
											max={1025}
											value={popStartId}
											onChange={(e) => setPopStartId(Number(e.target.value))}
											disabled={popLoading}
										/>
									</div>
									<div className='form-field'>
										<label htmlFor='pop-end'>End ID</label>
										<input
											id='pop-end'
											type='number'
											min={1}
											max={1025}
											value={popEndId}
											onChange={(e) => setPopEndId(Number(e.target.value))}
											disabled={popLoading}
										/>
									</div>
								</div>
								{popMessage && (
									<div className={`form-message form-message--${popMessage.type}`}>
										{popMessage.text}
									</div>
								)}
								<button className='btn btn--primary' onClick={handlePopulate} disabled={popLoading}>
									{popLoading
										? `Populating... ${popStatus?.isPopulating ? `(${popStatus.populatingCurrent}/${popStatus.populatingTotal})` : ''}`
										: 'Populate Pokédex Cache'}
								</button>
							</div>
						</section>

						{/* Items Cache */}
						<section className='admin-section'>
							<h2 className='section-title'>Items Cache</h2>
							{popStatus && (
								<div className='pokedex-status'>
									<p>
										<strong>Items cached:</strong> {popStatus.totalItems}
									</p>
									{popStatus.isPopulatingItems && (
										<div className='populate-progress'>
											<p>
												<strong>Progress:</strong> {popStatus.populatingItemsCurrent} /{' '}
												{popStatus.populatingItemsTotal} items
											</p>
											<div className='progress-bar'>
												<div
													className='progress-bar-fill'
													style={{
														width: `${(popStatus.populatingItemsCurrent / popStatus.populatingItemsTotal) * 100}%`,
													}}
												/>
											</div>
										</div>
									)}
								</div>
							)}
							<div className='admin-form'>
								<div className='form-row'>
									<div className='form-field'>
										<label htmlFor='item-start'>Start ID</label>
										<input
											id='item-start'
											type='number'
											min={1}
											max={2180}
											value={itemStartId}
											onChange={(e) => setItemStartId(Number(e.target.value))}
											disabled={itemLoading}
										/>
									</div>
									<div className='form-field'>
										<label htmlFor='item-end'>End ID</label>
										<input
											id='item-end'
											type='number'
											min={1}
											max={2180}
											value={itemEndId}
											onChange={(e) => setItemEndId(Number(e.target.value))}
											disabled={itemLoading}
										/>
									</div>
								</div>
								{itemMessage && (
									<div className={`form-message form-message--${itemMessage.type}`}>
										{itemMessage.text}
									</div>
								)}
								<button
									className='btn btn--primary'
									onClick={handlePopulateItems}
									disabled={itemLoading}>
									{itemLoading
										? `Populating... ${popStatus?.isPopulatingItems ? `(${popStatus.populatingItemsCurrent}/${popStatus.populatingItemsTotal})` : ''}`
										: 'Populate Items Cache'}
								</button>
							</div>
						</section>

						<section className='admin-section'>
							<h2 className='section-title'>Create User</h2>
							<form className='admin-form' onSubmit={handleCreateUser}>
								<div className='form-row'>
									<div className='form-field'>
										<label htmlFor='create-username'>Username</label>
										<input
											id='create-username'
											type='text'
											value={newUsername}
											onChange={(e) => setNewUsername(e.target.value)}
											placeholder='Username'
											autoComplete='off'
										/>
									</div>
									<div className='form-field'>
										<label htmlFor='create-password'>Password</label>
										<input
											id='create-password'
											type='password'
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											placeholder='Password'
											autoComplete='new-password'
										/>
									</div>
								</div>
								{createMessage && (
									<div className={`form-message form-message--${createMessage.type}`}>
										{createMessage.text}
									</div>
								)}
								<button className='btn btn--primary' type='submit' disabled={createLoading}>
									{createLoading ? 'Creating...' : 'Create User'}
								</button>
							</form>
						</section>
					</>
				)}
			</div>
		</div>
	)
}

export default AdminPanel
