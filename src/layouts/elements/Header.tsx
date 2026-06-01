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
				<div className='header-content'>
					<Link to='/' className='header-logo' aria-label='Beast Vault home'>
						<BeastVaultBanner width={140} height={51} />
					</Link>

					{/* Desktop nav — hidden on mobile */}
					<nav className='header-nav' aria-label='Main navigation'>
						<Link to='/' className={`nav-link ${isActive('/', true) ? 'active' : ''}`}>
							Home
						</Link>
						<Link to='/dex' className={`nav-link ${isActive('/dex') ? 'active' : ''}`}>
							Pokédex
						</Link>
						<Link
							to='/settings'
							className={`nav-link ${isActive('/settings', true) ? 'active' : ''}`}>
							Settings
						</Link>
						<Link to='/admin' className={`nav-link ${isActive('/admin', true) ? 'active' : ''}`}>
							{isAdmin ? 'Admin' : 'Account'}
						</Link>
					</nav>

					<div className='quick-actions'>
						<ThemeSelector />
						<button
							className='import-btn'
							onClick={() => setUploadModalOpen(true)}
							aria-label='Upload Pokémon'>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								width='18'
								height='18'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2.5'
								strokeLinecap='round'
								strokeLinejoin='round'
								aria-hidden='true'>
								<line x1='12' y1='5' x2='12' y2='19' />
								<line x1='5' y1='12' x2='19' y2='12' />
							</svg>
							<span className='import-btn__label'>Import</span>
						</button>
						{user && (
							<div className='user-menu'>
								<span className='user-name'>{user.username}</span>
								<button
									className='logout-btn'
									onClick={logout}
									title='Sign out'
									aria-label='Sign out'>
									<svg
										xmlns='http://www.w3.org/2000/svg'
										width='18'
										height='18'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'
										strokeLinecap='round'
										strokeLinejoin='round'>
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
			<nav className='mobile-bottom-nav' aria-label='Mobile navigation'>
				<Link
					to='/'
					className={`mobile-nav-item ${isActive('/', true) ? 'mobile-nav-item--active' : ''}`}
					aria-label='Home'
					aria-current={isActive('/', true) ? 'page' : undefined}>
					<svg
						width='22'
						height='22'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						aria-hidden='true'>
						<path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' />
						<polyline points='9 22 9 12 15 12 15 22' />
					</svg>
					<span>Home</span>
				</Link>

				<Link
					to='/dex'
					className={`mobile-nav-item ${isActive('/dex') ? 'mobile-nav-item--active' : ''}`}
					aria-label='Pokédex'
					aria-current={isActive('/dex') ? 'page' : undefined}>
					<svg
						width='22'
						height='22'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						aria-hidden='true'>
						<circle cx='12' cy='12' r='10' />
						<line x1='2' y1='12' x2='22' y2='12' />
						<circle cx='12' cy='12' r='3' />
					</svg>
					<span>Pokédex</span>
				</Link>

				<button
					className='mobile-nav-item mobile-nav-item--action'
					onClick={() => setUploadModalOpen(true)}
					aria-label='Upload Pokémon'>
					<span className='mobile-nav-item__plus' aria-hidden='true'>
						+
					</span>
					<span>Upload</span>
				</button>

				<Link
					to='/settings'
					className={`mobile-nav-item ${isActive('/settings', true) ? 'mobile-nav-item--active' : ''}`}
					aria-label='Settings'
					aria-current={isActive('/settings', true) ? 'page' : undefined}>
					<svg
						width='22'
						height='22'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						aria-hidden='true'>
						<circle cx='12' cy='12' r='3' />
						<path d='M19.07 4.93A10 10 0 1 0 4.93 19.07 10 10 0 0 0 19.07 4.93z' />
					</svg>
					<span>Settings</span>
				</Link>

				<Link
					to='/admin'
					className={`mobile-nav-item ${isActive('/admin', true) ? 'mobile-nav-item--active' : ''}`}
					aria-label={isAdmin ? 'Admin' : 'Account'}
					aria-current={isActive('/admin', true) ? 'page' : undefined}>
					<svg
						width='22'
						height='22'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						aria-hidden='true'>
						<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
						<circle cx='12' cy='7' r='4' />
					</svg>
					<span>{isAdmin ? 'Admin' : 'Account'}</span>
				</Link>
			</nav>
		</>
	)
}
