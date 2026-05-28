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

	return (
		<header className='app-header'>
			<div className='header-content'>
				<Link to='/' className='header-logo'>
					<BeastVaultBanner width={140} height={51} />
				</Link>

				<nav className='header-nav'>
					<Link to='/' className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
						Home
					</Link>
					<Link
						to='/dex'
						className={`nav-link ${location.pathname.startsWith('/dex') ? 'active' : ''}`}>
						Pokédex
					</Link>
					<Link
						to='/settings'
						className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
						Settings
					</Link>
					<Link
						to='/admin'
						className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
						{isAdmin ? 'Admin' : 'Account'}
					</Link>
				</nav>

				<div className='quick-actions'>
					<ThemeSelector />
					<button className='import-btn' onClick={() => setUploadModalOpen(true)}>
						+
					</button>
					{user && (
						<div className='user-menu'>
							<span className='user-name'>{user.username}</span>
							<button className='logout-btn' onClick={logout} title='Sign out'>
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
	)
}
