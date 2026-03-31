import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import bookmarkDataRaw from '../bookmarks.json';
import { IBookmarkData } from '../types/bookmark';
import BookmarkGrid from '../components/BookmarkGrid';

const bookmarkData = bookmarkDataRaw as IBookmarkData;
const bookmarkCategories = bookmarkData.categories.filter(c => c.id !== 'interviews');

interface IBookmarksPageProps {
  onShare: (e: React.MouseEvent, url: string) => void;
}

const BookmarksPage: React.FC<IBookmarksPageProps> = ({ onShare }) => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const activeCategory = bookmarkCategories.find(c => c.id === categoryId) ?? bookmarkCategories[0];

  if (!bookmarkCategories.find(c => c.id === categoryId)) {
    return <Navigate to={`/bookmarks/${bookmarkCategories[0].id}`} replace />;
  }

  return (
    <BookmarkGrid
      category={activeCategory}
      allCategories={bookmarkCategories}
      onShare={onShare}
    />
  );
};

export default BookmarksPage;
