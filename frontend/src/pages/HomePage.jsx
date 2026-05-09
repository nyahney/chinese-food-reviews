import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function RatingPill({ rating }) {
  let colorClass;
  if (rating >= 8) {
    colorClass = 'bg-green-100 text-green-800';
  } else if (rating >= 5) {
    colorClass = 'bg-yellow-100 text-yellow-800';
  } else {
    colorClass = 'bg-red-100 text-red-800';
  }
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
      {rating}/10
    </span>
  );
}

function ReviewFeedCard({ review }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <RatingPill rating={review.rating} />
        <Link
          to={`/restaurants/${review.restaurant_id}`}
          className="font-semibold text-gray-900 hover:text-red-600"
        >
          {review.restaurant_name}
        </Link>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        by {review.author_username} on {formatDate(review.created_at)}
      </p>
      {review.body && (
        <p className="text-sm text-gray-700 leading-relaxed">{review.body}</p>
      )}
    </div>
  );
}

export default function HomePage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/api/reviews?limit=20&offset=0`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to load reviews');
        }

        const data = await response.json();
        setReviews(data.reviews);
      } catch (err) {
        setError('Something went wrong loading reviews. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Recent Reviews</h1>
          <p className="mt-1 text-gray-500">What people are saying</p>
        </div>

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

        {!loading && !error && reviews.length === 0 && (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg font-medium">No reviews yet</p>
            <p className="mt-1 text-sm">
              Be the first to{' '}
              <Link to="/restaurants" className="text-red-600 hover:underline">
                review a restaurant
              </Link>
              !
            </p>
          </div>
        )}

        {!loading && !error && reviews.length > 0 && (
          <div className="flex flex-col gap-4">
            {reviews.map((review) => (
              <ReviewFeedCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}