"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Review {
  id: number;
  date_created: string;
  review: string;
  rating: number;
  reviewer: string;
  reviewer_email: string;
  verified: boolean;
}

interface ReviewsSectionProps {
  productId: number;
  productName: string;
}

export default function ReviewsSection({ productId, productName }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rating: 5,
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        cache: 'no-store'
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setReviews(data);
      }
    } catch (err) {
      // console.error("Failed to load reviews", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverage = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewer: formData.name,
          reviewer_email: formData.email,
          rating: formData.rating,
          review: formData.message,
          productName: productName
        })
      });

      if (!res.ok) throw new Error("Failed to submit");
      const newReview = await res.json();

      toast.success("Beoordeling ingediend! Deze verschijnt na goedkeuring.");
      setFormData({ name: "", email: "", rating: 5, message: "" });
      setShowForm(false);

      // Optimistically add it to the UI if it looks like a valid review object
      if (newReview && newReview.id) {
        setReviews(prev => [newReview, ...prev]);
      } else {
        fetchReviews();
      }
    } catch (err) {
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, size = 5 }: { rating: number, size?: number }) => (
    <div className="flex text-[#FF9E0D]">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={i <= rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth={i <= rating ? 0 : 1} className={`size-${size}`}>
          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
        </svg>
      ))}
    </div>
  );

  const average = calculateAverage();
  const totalReviews = reviews.length;

  return (
    <div className="bg-[#F8F9FA] rounded-[20px] p-4 lg:p-6 font-sans">
      {/* <h2 className="text-[#1C2530] text-[28px] font-bold mb-8">Reviews</h2> */}

      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Detail Card */}
        <div className="bg-[#E4EFFF] rounded-[20px] py-8 px-6 lg:px-10 flex-[2] flex flex-col justify-center">
          <h3 className="text-[#1C2530] font-bold text-xl lg:text-2xl mb-4 leading-tight break-words">{productName}</h3>
          <div className="border-b border-[#0066FF1A] mb-6 w-full"></div>
          <p className="text-[#3D4752] text-lg lg:text-xl leading-relaxed">
            <span className="text-[#1C2530] font-bold">{average}</span> sterren op basis van <span className="text-[#1C2530] font-bold">{totalReviews}</span> beoordelingen
          </p>
        </div>

        {/* Rating Card */}
        <div className="bg-[#E4EFFF] rounded-[20px] py-8 px-6 w-full lg:w-[280px] flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex flex-col items-center">
            <span className="text-[#1C2530] font-bold text-5xl lg:text-6xl leading-none">{average}</span>
            <span className="text-[#3D4752] font-semibold text-lg mt-1 whitespace-nowrap">van de 5</span>
          </div>
          <StarRating rating={Number(average)} size={6} />
        </div>
      </div>

      <div className="mb-8 border-b border-[#E8E1DC] pb-8">
        <h3 className="text-[#1C2530] font-bold text-xl mb-6">Recente beoordelingen</h3>

        <div className="space-y-4">
          {loading ? (
            <p>Beoordelingen laden...</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500 italic">Nog geen beoordelingen. Wees de eerste!</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-[20px] p-6 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <h4 className="text-[#1C2530] font-bold text-lg">
                    {/* Typically WP reviews don't have a title field, just the body. 
                                    Sometimes users put summary in body. We'll use the first sentence or generic "Review" if empty title. */}
                    Beoordeling
                  </h4>
                  <StarRating rating={review.rating} size={5} />
                </div>
                <div className="flex items-center gap-2 text-[#03B955] text-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                  </svg>
                  Geverifieerde klant van Bouwbeslag.nl
                </div>
                <div
                  className="text-[#3D4752] text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: review.review }}
                />
                <p className="text-[#9CA3AF] text-sm mt-1">
                  Geplaatst op {new Date(review.date_created).toLocaleDateString("nl-NL", { day: 'numeric', month: 'short', year: 'numeric' })} door {review.reviewer}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Review Form Toggle */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#0066FF] text-white px-8 py-3 rounded-full font-bold hover:bg-[#0052cc] transition-colors"
        >
          Schrijf een review
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[20px] border border-gray-200 mt-8">
          <h3 className="text-xl font-bold mb-4">Schrijf jouw review</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jouw naam</label>
              <input required type="text" className="w-full border rounded-md p-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input required type="email" className="w-full border rounded-md p-2" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sterren</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={star <= formData.rating ? "#FF9E0D" : "none"} stroke="#FF9E0D" strokeWidth="1" className="size-8">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beoordeling</label>
              <textarea required className="w-full border rounded-md p-2" rows={4} value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })}></textarea>
            </div>
            <div className="flex gap-4">
              <button type="submit" disabled={submitting} className="bg-[#0066FF] text-white px-6 py-2 rounded-full font-bold hover:bg-[#0052cc] disabled:opacity-50">
                {submitting ? "Versturen..." : "Plaats beoordeling"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 font-medium hover:underline">Annuleren</button>
            </div>
          </div>
        </form>
      )}

    </div>
  );
}
