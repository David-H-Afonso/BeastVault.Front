import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import banner from '../assets/BeastVault-banner.svg'
import './Header.scss'

export const Header: React.FC = () => {
	const location = useLocation()

	return (
		<header className='app-header'>
			<div className='header-content'>
				<Link to='/' className='header-logo'>
					<img src={banner} alt='BeastVault' className='logo-image' />
				</Link>

				<nav className='header-nav'>
					<Link to='/' className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
						🏠 Home
					</Link>
					<Link
						to='/settings'
						className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
						⚙️ Settings
					</Link>
				</nav>
			</div>
		</header>
	)
}
