import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Header.scss'
import { ThemeSelector } from '@/components/elements'
import { BeastVaultBanner } from '@/assets/images'
import { UploadAndScanFiles } from '@/components/elements/UploadAndScanFiles/UploadAndScanFiles'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS: { to: string; label: string; exact?: boolean }[] = [
	{ to: '/', label: 'Home', exact: true },
	{ to: '/dex', label: 'Pokédex' },
	{ to: '/settings', label: 'Settings', exact: true },
	{ to: '/admin', label: 'Account', exact: true },
]

export const Header: React.FC = () => {
	const location = useLocation()
	const [isUploadModalOpen, setUploadModalOpen] = useState(false)
	const [isUserMenuOpen, setUserMenuOpen] = useState(false)
	const { user, isAdmin, logout } = useAuth()

	const userMenuRef = useRef<HTMLDivElement | null>(null)
	const userTriggerRef = useRef<HTMLButtonElement | null>(null)

	const onCloseModal = () => {
		setUploadModalOpen(false)
	}

	const isActive = (path: string, exact = false) =>
		exact ? location.pathname === path : location.pathname.startsWith(path)

	// Close the user menu on outside click / Escape, returning focus to the trigger.
	useEffect(() => {
		if (!isUserMenuOpen) return
		const onPointer = (event: MouseEvent) => {
			if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
				setUserMenuOpen(false)
			}
		}
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setUserMenuOpen(false)
				userTriggerRef.current?.focus()
			}
		}
		document.addEventListener('mousedown', onPointer)
		document.addEventListener('keydown', onKey)
		return () => {
			document.removeEventListener('mousedown', onPointer)
			document.removeEventListener('keydown', onKey)
		}
	}, [isUserMenuOpen])

	const accountLabel = isAdmin ? 'Admin' : 'Account'
	const userInitial = user?.username?.charAt(0).toUpperCase() ?? '?'

	return (
		<>
			<header className='app-header'>
				<div className='app-header__inner'>
					<Link to='/' className='app-header__logo' aria-label='Beast Vault home'>
						<BeastVaultBanner width={140} height={51} />
					</Link>

					{/* Desktop centered segmented nav — hidden on mobile */}
					<nav className='app-header__nav' aria-label='Main navigation'>
						{NAV_ITEMS.map((item) => {
							const active = isActive(item.to, item.exact)
							return (
								<Link
									key={item.to}
									to={item.to}
									className={`app-header__link${active ? ' is-active' : ''}`}
									aria-current={active ? 'page' : undefined}>
									{item.to === '/admin' ? accountLabel : item.label}
								</Link>
							)
						})}
					</nav>

					<div className='app-header__actions'>
						<button
							className='app-header__import'
							onClick={() => setUploadModalOpen(true)}
							aria-label='Add Pokémon'>
							<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
								<line x1='12' y1='5' x2='12' y2='19' />
								<line x1='5' y1='12' x2='19' y2='12' />
							</svg>
							<span className='app-header__import-label'>Import</span>
						</button>

						{user && (
							<div className='app-header__user' ref={userMenuRef}>
								<button
									ref={userTriggerRef}
									type='button'
									className='app-header__user-trigger'
									onClick={() => setUserMenuOpen((open) => !open)}
									aria-haspopup='menu'
									aria-expanded={isUserMenuOpen}
									aria-label={`Account menu for ${user.username}`}>
									<span className='app-header__avatar' aria-hidden='true'>
										{userInitial}
									</span>
									<svg
										className={`app-header__user-chevron${isUserMenuOpen ? ' is-open' : ''}`}
										width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
										<polyline points='6 9 12 15 18 9' />
									</svg>
								</button>

								{isUserMenuOpen && (
									<div className='app-header__user-menu' role='menu' aria-label='Account'>
										<div className='app-header__user-meta'>
											<span className='app-header__avatar app-header__avatar--lg' aria-hidden='true'>
												{userInitial}
											</span>
											<span className='app-header__user-text'>
												<span className='app-header__user-name'>{user.username}</span>
												<span className='app-header__user-role'>{accountLabel}</span>
											</span>
										</div>
										<ThemeSelector />
										<Link
											to='/admin'
											role='menuitem'
											className='app-header__user-action'
											onClick={() => setUserMenuOpen(false)}>
											<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
												<circle cx='12' cy='8' r='4' />
												<path d='M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1' />
											</svg>
											{accountLabel}
										</Link>
										<button
											type='button'
											role='menuitem'
											className='app-header__user-action app-header__user-action--danger'
											onClick={() => {
												setUserMenuOpen(false)
												logout()
											}}>
											<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
												<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
												<polyline points='16 17 21 12 16 7' />
												<line x1='21' y1='12' x2='9' y2='12' />
											</svg>
											Sign out
										</button>
									</div>
								)}
							</div>
						)}

						<UploadAndScanFiles isOpen={isUploadModalOpen} onClose={onCloseModal} />
					</div>
				</div>
			</header>

			{/* Mobile bottom tab navigation */}
			<nav className='mobile-nav' aria-label='Mobile navigation'>
				<Link
					to='/'
					className={`mobile-nav__item${isActive('/', true) ? ' is-active' : ''}`}
					aria-label='Home'
					aria-current={isActive('/', true) ? 'page' : undefined}>
					<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
						<path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' />
						<polyline points='9 22 9 12 15 12 15 22' />
					</svg>
					<span>Home</span>
				</Link>

				<Link
					to='/dex'
					className={`mobile-nav__item${isActive('/dex') ? ' is-active' : ''}`}
					aria-label='Pokédex'
					aria-current={isActive('/dex') ? 'page' : undefined}>
					<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
						<circle cx='12' cy='12' r='10' />
						<line x1='2' y1='12' x2='22' y2='12' />
						<circle cx='12' cy='12' r='3' />
					</svg>
					<span>Pokédex</span>
				</Link>

				<button
					className='mobile-nav__item mobile-nav__item--fab'
					onClick={() => setUploadModalOpen(true)}
					aria-label='Add Pokémon'>
					<span className='mobile-nav__fab' aria-hidden='true'>
						<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
							<line x1='12' y1='5' x2='12' y2='19' />
							<line x1='5' y1='12' x2='19' y2='12' />
						</svg>
					</span>
					<span>Add</span>
				</button>

				<Link
					to='/settings'
					className={`mobile-nav__item${isActive('/settings', true) ? ' is-active' : ''}`}
					aria-label='Settings'
					aria-current={isActive('/settings', true) ? 'page' : undefined}>
					<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
						<circle cx='12' cy='12' r='3' />
						<path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' />
					</svg>
					<span>Settings</span>
				</Link>

				<Link
					to='/admin'
					className={`mobile-nav__item${isActive('/admin', true) ? ' is-active' : ''}`}
					aria-label={accountLabel}
					aria-current={isActive('/admin', true) ? 'page' : undefined}>
					<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
						<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
						<circle cx='12' cy='7' r='4' />
					</svg>
					<span>{accountLabel}</span>
				</Link>
			</nav>
		</>
	)
}
