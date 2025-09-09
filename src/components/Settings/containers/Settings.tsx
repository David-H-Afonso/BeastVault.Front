import React from 'react'
import { UIOptionsSelector } from '@/components/UIOptionsSelector'
import { ThemeSelector, LayoutSelector } from '@/components/elements'
import '../components/Settings.scss'

const Settings: React.FC = () => {
	return (
		<div className='settings-page'>
			<div className='settings-container'>
				<header className='settings-header'>
					<h1 className='settings-title'>⚙️ Application Settings</h1>
					<p className='settings-description'>
						Configure your BeastVault experience to your preferences
					</p>
				</header>

				<div className='settings-content'>
					{/* Layout Settings */}
					<section className='settings-section'>
						<h2 className='section-title'>🖱️ Layout</h2>
						<div className='section-content'>
							<LayoutSelector />
						</div>
					</section>

					{/* Theme Settings */}
					<section className='settings-section'>
						<h2 className='section-title'>🎨 Appearance</h2>
						<div className='section-content'>
							<ThemeSelector />
						</div>
					</section>

					{/* Display Options */}
					<section className='settings-section'>
						<h2 className='section-title'>🖼️ Display Options</h2>
						<div className='section-content'>
							<UIOptionsSelector />
						</div>
					</section>

					{/* Future sections */}
					<section className='settings-section'>
						<h2 className='section-title'>🔧 Advanced</h2>
						<div className='section-content'>
							<div className='coming-soon'>
								<p>🚧 Advanced settings coming soon...</p>
								<small>
									Features like import/export preferences, performance settings, and more.
								</small>
							</div>
						</div>
					</section>
				</div>
			</div>
		</div>
	)
}

export default Settings
