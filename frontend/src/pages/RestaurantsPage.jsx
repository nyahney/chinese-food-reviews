import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

function RestaurantCard({ restaurant }) {
  return (
    <Link
      to={`/restaurants/${restaurant.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-shadow"
    >
      <h2 className="font-bold text-gray-900 text-lg leading-snug">{restaurant.name}</h2>
      {restaurant.city && (
        <p className="mt-1 text-sm text-gray-500">{restaurant.city}</p>
      )}
      {restaurant.address && (
        <p className="mt-2 text-xs text-gray-400">{restaurant.address}</p>
      )}
    </Link>
  );
}

export default function RestaurantsPage() {
  const { user } = useAuth();

  const [restaurants, setRestaurants] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const debounceRef = useRef(null);

  function handleSearchChange(e) {
    const value = e.target.value;
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
    }, 300);
  }

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    async function fetchRestaurants() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ limit: 20, offset: 0 });
        if (search.trim()) params.set('search', search.trim());

        const response = await fetch(`${API_URL}/api/restaurants?${params}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to load restaurants');
        }

        const data = await response.json();
        setRestaurants(data.restaurants);
        setTotal(data.total);
      } catch (err) {
        setError('Something went wrong loading restaurants. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurants();
  }, [search]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Restaurants</h1>
          {user && (
            <Link
              to="/restaurants/new"
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium whitespace-nowrap"
            >
              Add Restaurant
            </Link>
          )}
        </div>

        <div className="mb-5">
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search restaurants..."
            className="w-full sm:w-80 border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {!loading && !error && (
          <p className="text-sm text-gray-500 mb-4">
            Showing {restaurants.length} of {total} restaurant{total !== 1 ? 's' : ''}
          </p>
        )}

        {loading && (
          <div className="flex justify-center items-center py-24 text-gray-500">
            Loading...
          </div>
        )}

        {error && !loading && (
          <div className="rounded-md bg-red-50 border border-red-200 px-5 py-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && restaurants.length === 0 && (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg font-medium">No restaurants found</p>
            <p className="mt-1 text-sm">
              {search.trim()
                ? `No results for "${search.trim()}". Try a different search.`
                : 'Be the first to add a restaurant!'}
            </p>
          </div>
        )}

        {!loading && !error && restaurants.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}