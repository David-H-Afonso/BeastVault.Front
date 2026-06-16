import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Header.scss'
import { ThemeSelector } from '@/components/elements'
import { BeastVaultBanner } from '@/assets/images'
import { UploadAndScanFiles } from '@/components/elements/UploadAndScanFiles/UploadAndScanFiles'
import { useAuth } from '@/hooks/useAuth'

export const Header: React.FC = () => {
	const location = useLocation()
	const [isUploadModalOpen, setUploadModalOpen] = useState(false)
	const { user, isAdmin, logout } = useAuth()

	const onCloseModal = () => {
		setUploadModalOpen(false)
	}

	const isActive = (path: string, exact = false) =>
		exact ? location.pathname === path : location.pathname.startsWith(path)

	return (
		<>
			<header className='app-header'>
				<div className='app-header__inner'>
					<Link to='/' className='app-header__logo' aria-label='Beast Vault home'>
						<BeastVaultBanner width={140} height={51} />
					</Link>

					{/* Desktop nav */}
					<nav className='app-header__nav' aria-label='Main navigation'>
						<Link to='/' className={`app-header__link${isActive('/', true) ? ' is-active' : ''}`}>
							Home
						</Link>
						<Link to='/dex' className={`app-header__link${isActive('/dex') ? ' is-active' : ''}`}>
							Pokédex
						</Link>
						<Link to='/settings' className={`app-header__link${isActive('/settings', true) ? ' is-active' : ''}`}>
							Settings
						</Link>
						<Link to='/admin' className={`app-header__link${isActive('/admin', true) ? ' is-active' : ''}`}>
							{isAdmin ? 'Admin' : 'Account'}
						</Link>
					</nav>

					<div className='app-header__actions'>
						<ThemeSelector />
						<button
							className='app-header__import'
							onClick={() => setUploadModalOpen(true)}
							aria-label='Upload Pokémon'>
							<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
								<line x1='12' y1='5' x2='12' y2='19' />
								<line x1='5' y1='12' x2='19' y2='12' />
							</svg>
							<span className='app-header__import-label'>Import</span>
						</button>
						{user && (
							<div className='app-header__user'>
								<span className='app-header__username'>{user.username}</span>
								<button
									className='app-header__logout'
									onClick={logout}
									title='Sign out'
									aria-label='Sign out'>
									<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
										<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
										<polyline points='16 17 21 12 16 7' />
										<line x1='21' y1='12' x2='9' y2='12' />
									</svg>
								</button>
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
					aria-label='Upload Pokémon'>
					<span className='mobile-nav__fab' aria-hidden='true'>
						<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
							<line x1='12' y1='5' x2='12' y2='19' />
							<line x1='5' y1='12' x2='19' y2='12' />
						</svg>
					</span>
					<span>Upload</span>
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
					aria-label={isAdmin ? 'Admin' : 'Account'}
					aria-current={isActive('/admin', true) ? 'page' : undefined}>
					<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
						<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
						<circle cx='12' cy='7' r='4' />
					</svg>
					<span>{isAdmin ? 'Admin' : 'Account'}</span>
				</Link>
			</nav>
		</>
	)
}
