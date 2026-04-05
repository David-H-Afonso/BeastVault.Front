import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loginUser, clearError } from '@/store/features/auth/authSlice'
import './Login.scss'

export default function Login() {
	const dispatch = useAppDispatch()
	const { isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth)

	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')

	if (isAuthenticated) {
		return <Navigate to='/' replace />
	}

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault()
		dispatch(clearError())
		dispatch(loginUser({ username, password: password || undefined }))
	}

	return (
		<div className='login-page'>
			<div className='login-card'>
				<h1 className='login-card__title'>Beast Vault</h1>
				<form className='login-card__form' onSubmit={handleSubmit}>
					<div className='login-card__field'>
						<label className='login-card__label' htmlFor='username'>
							Username
						</label>
						<input
							id='username'
							className='login-card__input'
							type='text'
							autoComplete='username'
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
						/>
					</div>
					<div className='login-card__field'>
						<label className='login-card__label' htmlFor='password'>
							Password
						</label>
						<input
							id='password'
							className='login-card__input'
							type='password'
							autoComplete='current-password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>
					{error && <div className='login-card__error'>{error}</div>}
					<button className='login-card__submit' type='submit' disabled={isLoading || !username}>
						{isLoading ? 'Logging in...' : 'Log in'}
					</button>
				</form>
			</div>
		</div>
	)
}
