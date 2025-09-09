import { configureStore } from '@reduxjs/toolkit'
import styleSettingsReducer from './styleSettingsSlice'
import layoutReducer from './layoutSlice'

export const store = configureStore({
	reducer: {
		styleSettings: styleSettingsReducer,
		layout: layoutReducer,
	},
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
