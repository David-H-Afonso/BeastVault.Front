import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { RouterProvider } from 'react-router-dom'
import { store, persistor } from './store'
import { router } from './Router'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Provider store={store}>
			<PersistGate loading={<div>Loading...</div>} persistor={persistor}>
				<RouterProvider router={router} />
			</PersistGate>
		</Provider>
	</StrictMode>
)
