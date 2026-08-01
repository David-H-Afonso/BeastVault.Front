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
	{ to: '/saves', label: 'Saves', exact: true },
	{ to: '/cards', label: 'Cards', exact: true },
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
									{item.label}
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
											to='/settings'
											role='menuitem'
											className='app-header__user-action'
											onClick={() => setUserMenuOpen(false)}>
											<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
												<circle cx='12' cy='12' r='3' />
												<path d='M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12' />
											</svg>
											Settings
										</Link>
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
					to='/saves'
					className={`mobile-nav__item${isActive('/saves', true) ? ' is-active' : ''}`}
					aria-label='Saves'
					aria-current={isActive('/saves', true) ? 'page' : undefined}>
					<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
						<path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z' />
						<path d='M17 21v-8H7v8' />
						<path d='M7 3v5h8' />
					</svg>
					<span>Saves</span>
				</Link>

				<Link
					to='/cards'
					className={`mobile-nav__item${isActive('/cards', true) ? ' is-active' : ''}`}
					aria-label='Cards'
					aria-current={isActive('/cards', true) ? 'page' : undefined}>
					<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
						<rect x='3' y='4' width='16' height='16' rx='2' />
						<path d='M7 8h8M7 12h8M7 16h5' />
						<path d='M19 8h2v12a2 2 0 0 1-2 2H7v-2' />
					</svg>
					<span>Cards</span>
				</Link>
			</nav>
		</>
	)
}
