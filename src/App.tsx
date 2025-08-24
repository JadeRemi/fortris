import GameCanvas from './components/GameCanvas'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
  return (
    <div className="App">
      <ErrorBoundary>
        <GameCanvas />
      </ErrorBoundary>
    </div>
  )
}

export default App
