import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import RestaurantsPage from './pages/RestaurantsPage';
import AddRestaurantPage from './pages/AddRestaurantPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';

function Navbar() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <nav className="border-b border-gray-200 px-6 py-3 bg-white">
        <span className="text-gray-500">Loading...</span>
      </nav>
    );
  }

  return (
    <nav className="border-b border-gray-200 px-6 py-3 bg-white flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/" className="font-bold text-lg text-red-600">
          🥟 Chinese Food Reviews
        </Link>
        <Link to="/restaurants" className="text-gray-600 hover:text-red-600 text-sm">
          Restaurants
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-gray-700">Hi, {user.username}</span>
            <button
              onClick={logout}
              className="text-gray-600 hover:text-red-600"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-600 hover:text-red-600">
              Log in
            </Link>
            <Link
              to="/signup"
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
        <Route path="/restaurants/new" element={<AddRestaurantPage />} />
        <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;