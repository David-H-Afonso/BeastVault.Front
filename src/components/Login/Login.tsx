import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import './Login.scss'

const Login: React.FC = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const { login, register, isAuthenticated, loading, error, clearError } = useAuth()

	const [mode, setMode] = useState<'login' | 'register'>('login')
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [localError, setLocalError] = useState<string | null>(null)

	useEffect(() => {
		if (isAuthenticated) {
			const from = location.state?.from as
				| { pathname?: string; search?: string; hash?: string }
				| undefined
			const destination = from?.pathname?.startsWith('/')
				? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
				: '/'
			navigate(destination, { replace: true })
		}
	}, [isAuthenticated, location.state, navigate])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLocalError(null)
		clearError()

		if (!username.trim()) {
			setLocalError('Username is required')
			return
		}

		if (mode === 'register') {
			if (!password) {
				setLocalError('Password is required')
				return
			}
			if (password !== confirmPassword) {
				setLocalError('Passwords do not match')
				return
			}
			await register({ username: username.trim(), password })
		} else {
			await login({ username: username.trim(), password: password || null })
		}
	}

	const toggleMode = () => {
		setMode(mode === 'login' ? 'register' : 'login')
		setLocalError(null)
		clearError()
		setPassword('')
		setConfirmPassword('')
	}

	const displayError = localError || error

	return (
		<div className='login'>
			<div className='login__card'>
				<div className='login__header'>
					<h1 className='login__title'>Beast Vault</h1>
					<p className='login__subtitle'>
						{mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
					</p>
				</div>

				<form className='login__form' onSubmit={handleSubmit}>
					<div className='login__field'>
						<label className='login__label' htmlFor='username'>
							Username
						</label>
						<input
							id='username'
							className='login__input'
							type='text'
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder='Enter your username'
							autoComplete='username'
							autoFocus
						/>
					</div>

					<div className='login__field'>
						<label className='login__label' htmlFor='password'>
							Password
							{mode === 'login' && (
								<span className='login__optional'>(optional for default admin)</span>
							)}
						</label>
						<input
							id='password'
							className='login__input'
							type='password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder={
								mode === 'login' ? 'Enter password (or leave empty)' : 'Choose a password'
							}
							autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
						/>
					</div>

					{mode === 'register' && (
						<div className='login__field'>
							<label className='login__label' htmlFor='confirmPassword'>
								Confirm Password
							</label>
							<input
								id='confirmPassword'
								className='login__input'
								type='password'
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder='Confirm your password'
								autoComplete='new-password'
							/>
						</div>
					)}

					{displayError && <div className='login__error'>{displayError}</div>}

					<button className='login__button' type='submit' disabled={loading}>
						{loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
					</button>
				</form>

				<div className='login__footer'>
					<button className='login__toggle' type='button' onClick={toggleMode}>
						{mode === 'login'
							? "Don't have an account? Register"
							: 'Already have an account? Sign In'}
					</button>
				</div>
			</div>
		</div>
	)
}

export default Login
