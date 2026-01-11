import React from 'react'
import ReactDOM from 'react-dom/client'
import { PodcastPlayer } from './features/podcast-player-1turn'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PodcastPlayer />
  </React.StrictMode>,
)
