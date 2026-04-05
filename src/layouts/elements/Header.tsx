import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './Header.scss'
import { ThemeSelector } from '@/components/elements'
import { BeastVaultBanner } from '@/assets/images'
import { UploadAndScanFiles } from '@/components/elements/UploadAndScanFiles/UploadAndScanFiles'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout } from '@/store/features/auth/authSlice'

export const Header: React.FC = () => {
	const location = useLocation()
	const navigate = useNavigate()
	const dispatch = useAppDispatch()
	const user = useAppSelector((state) => state.auth.user)
	const [isUploadModalOpen, setUploadModalOpen] = useState(false)

	const onCloseModal = () => {
		setUploadModalOpen(false)
	}

	const handleLogout = () => {
		dispatch(logout())
		navigate('/login')
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
					{user?.role === 'Admin' && (
						<Link
							to='/admin/users'
							className={`nav-link ${location.pathname === '/admin/users' ? 'active' : ''}`}>
							Users
						</Link>
					)}
				</nav>

				<div className='quick-actions'>
					<ThemeSelector />
					<button className='import-btn' onClick={() => setUploadModalOpen(true)}>
						+
					</button>
					<button className='nav-link logout-btn' onClick={handleLogout} title='Log out'>
						{user?.username ?? 'User'} ↪
					</button>
					<UploadAndScanFiles isOpen={isUploadModalOpen} onClose={onCloseModal} />
				</div>
			</div>
		</header>
	)
}
