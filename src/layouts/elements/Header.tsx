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
								⏻
							</button>
						</div>
					)}
					<UploadAndScanFiles isOpen={isUploadModalOpen} onClose={onCloseModal} />
				</div>
			</div>
		</header>
	)
}
