import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import MainContent from './components/MainContent';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Header />
        <MainContent />
      </div>
    </AuthProvider>
  );
}

export default App;