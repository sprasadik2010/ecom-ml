import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Tag,
  BookOpen
} from 'lucide-react';

export const Blog: React.FC = () => {
  const [selectedTag, setSelectedTag] = useState<string>('All');

  const tags = ['All', 'Growth Strategy', 'Lifestyle & Fashion', 'SW Points', 'Guides'];

  const articles = [
    {
      id: 1,
      title: 'How to Maximize Your Earnings with Sales Wallet (SW) Points',
      excerpt: 'Learn the exact math behind team leg volume matching, personal activation requirements, and how to balance your Left and Right teams effectively.',
      category: 'Growth Strategy',
      author: 'Buyway Business Desk',
      date: 'October 12, 2026',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
      tag: 'Growth Strategy'
    },
    {
      id: 2,
      title: 'Spring & Summer 2026 Fashion Trends: What to Expect in Our Catalog',
      excerpt: 'From pastel linen wear to smart utility accessories, discover the season’s best curated lifestyle designs created for all-day comfort and elegance.',
      category: 'Lifestyle & Fashion',
      author: 'Style & Trends Editor',
      date: 'October 08, 2026',
      readTime: '4 min read',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80',
      tag: 'Lifestyle & Fashion'
    },
    {
      id: 3,
      title: 'Understanding the 20% Sponsor Matching Cut in Direct Selling',
      excerpt: 'Discover why mentoring your direct recruits creates powerful compounding returns when your team members achieve rank promotions and node matching.',
      category: 'SW Points',
      author: 'Genealogy Specialist',
      date: 'September 28, 2026',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80',
      tag: 'Growth Strategy'
    },
    {
      id: 4,
      title: 'A Beginner’s Guide to Tracked India Post Parcel Logistics',
      excerpt: 'How Buyway processes every order, generates official Article tracking codes, and ensures reliable dispatch right to your doorstep.',
      category: 'Guides',
      author: 'Logistics Operations',
      date: 'September 19, 2026',
      readTime: '3 min read',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
      tag: 'Guides'
    },
  ];

  const filteredArticles = selectedTag === 'All'
    ? articles
    : articles.filter(a => a.tag === selectedTag);

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#7A6369]">
          <Link to="/" className="hover:text-[#A8435D] transition-colors">Home</Link>
          <ChevronRight size={13} />
          <span className="font-semibold text-[#331B21]">Blog & Insights</span>
        </nav>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#A8435D] block">
            Articles & Updates
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl text-[#331B21] font-normal">
            Buyway Journal
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6369] leading-relaxed">
            Tips, educational guides, lifestyle trends, and business strategies to help you get the most out of your shopping and direct selling experience.
          </p>
        </div>

        {/* Category Tag Filters */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {tags.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedTag === t
                  ? 'bg-[#B8586E] text-white shadow-sm'
                  : 'bg-white border border-[#EFE2DE] text-[#4A343A] hover:bg-[#FDF4F6] hover:text-[#A8435D]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
          {filteredArticles.map(article => (
            <article
              key={article.id}
              className="bg-white rounded-3xl overflow-hidden border border-[#EFE2DE] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group"
            >
              <div className="aspect-[16/9] overflow-hidden relative">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 px-3 py-1 bg-white/95 backdrop-blur-sm text-[#A8435D] text-[11px] font-bold rounded-full shadow-sm">
                  {article.category}
                </span>
              </div>

              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-[11px] text-[#9E868D]">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      {article.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {article.readTime}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl text-[#331B21] font-semibold group-hover:text-[#B8586E] transition-colors leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#7A6369] leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#F2E8E5] flex items-center justify-between">
                  <span className="text-xs text-[#9E868D] font-medium flex items-center gap-1.5">
                    <User size={13} />
                    {article.author}
                  </span>
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#A8435D] group-hover:gap-2 transition-all"
                  >
                    <span>Read Article</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>
    </div>
  );
};
