import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

function ReviewCard({ review }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-2">
        <RatingPill rating={review.rating} />
        <span className="text-sm font-medium text-gray-800">{review.author_username}</span>
        <span className="text-xs text-gray-400 ml-auto">{formatDate(review.created_at)}</span>
      </div>
      {review.body && (
        <p className="text-sm text-gray-700 leading-relaxed">{review.body}</p>
      )}
    </div>
  );
}

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [rating, setRating] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const [restaurantRes, reviewsRes] = await Promise.all([
          fetch(`${API_URL}/api/restaurants/${id}`, { credentials: 'include' }),
          fetch(`${API_URL}/api/restaurants/${id}/reviews?limit=20&offset=0`, { credentials: 'include' }),
        ]);

        if (restaurantRes.status === 404) {
          setNotFound(true);
          return;
        }

        if (!restaurantRes.ok || !reviewsRes.ok) {
          throw new Error('Failed to load restaurant');
        }

        const [restaurantData, reviewsData] = await Promise.all([
          restaurantRes.json(),
          reviewsRes.json(),
        ]);

        setRestaurant(restaurantData);
        setReviews(reviewsData.reviews);
      } catch (err) {
        setError('Something went wrong loading this restaurant. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  async function handleSubmitReview(e) {
    e.preventDefault();
    setFormError(null);

    if (!rating) {
      setFormError('Please select a rating.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ restaurant_id: id, rating: parseInt(rating, 10), body: body.trim() || undefined }),
      });

      if (response.status === 409) {
        setFormError("You've already reviewed this restaurant.");
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to post review');
      }

      const newReview = await response.json();
      const enriched = { ...newReview, author_username: user.username };
      setReviews((prev) => [enriched, ...prev]);
      setRating('');
      setBody('');
    } catch (err) {
      if (!formError) {
        setFormError('Something went wrong posting your review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-24 text-gray-500">
        Loading...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center py-24 text-gray-400">
          <p className="text-lg font-medium text-gray-700">Restaurant not found</p>
          <p className="mt-1 text-sm">This restaurant doesn't exist or may have been removed.</p>
          <Link to="/restaurants" className="mt-4 inline-block text-red-600 hover:underline text-sm">
            Back to Restaurants
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-md bg-red-50 border border-red-200 px-5 py-4 text-red-700 text-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <Link to="/restaurants" className="text-sm text-gray-500 hover:text-red-600">
            ← Back to Restaurants
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
          {restaurant.city && (
            <p className="mt-1 text-base text-gray-500">{restaurant.city}</p>
          )}
          {restaurant.address && (
            <p className="mt-1 text-sm text-gray-400">{restaurant.address}</p>
          )}
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
            {averageRating !== null ? (
              <span>Average rating: <span className="font-semibold text-gray-800">{averageRating} / 10</span></span>
            ) : (
              <span className="text-gray-400">No ratings yet</span>
            )}
            <span className="text-gray-300">·</span>
            <span>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews</h2>

          {user ? (
            <form onSubmit={handleSubmitReview} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Post a Review</h3>

              {formError && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-4">
                  {formError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  required
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="" disabled>Rating (required)</option>
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} / 10</option>
                  ))}
                </select>
              </div>

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What did you think? (optional)"
                maxLength={5000}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-y mb-3"
              />

              <button
                type="submit"
                disabled={submitting}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Posting...' : 'Post Review'}
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-500 mb-6">
              <Link to="/login" className="text-red-600 hover:underline">Log in</Link> to post a review.
            </p>
          )}

          {reviews.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-base font-medium">No reviews yet</p>
              <p className="mt-1 text-sm">Be the first to review this restaurant!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}