
import React, { useState, useEffect, useCallback } from 'react';
import { LikeIcon, DislikeIcon, LoveIcon } from './Icons';

type ReactionType = 'like' | 'dislike' | 'love';

interface ReactionCounts {
  like: number;
  dislike: number;
  love: number;
}

const getLocalUserReaction = (postId: number): ReactionType | null => {
  try {
    const reactions = localStorage.getItem('user-post-reactions');
    const parsed = reactions ? JSON.parse(reactions) : {};
    return parsed[postId] || null;
  } catch {
    return null;
  }
};

const setLocalUserReaction = (postId: number, reaction: ReactionType | null) => {
  try {
    const reactions = localStorage.getItem('user-post-reactions');
    const parsed = reactions ? JSON.parse(reactions) : {};
    parsed[postId] = reaction;
    localStorage.setItem('user-post-reactions', JSON.stringify(parsed));
  } catch (error) {
    console.error("Failed to save user reaction", error);
  }
};

interface ReactionButtonsProps {
  postId: number;
}

const ReactionButtons: React.FC<ReactionButtonsProps> = ({ postId }) => {
  const [counts, setCounts] = useState<ReactionCounts | null>(null);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReactions = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`/.netlify/functions/reactions?postId=${postId}`);
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      const data: ReactionCounts = await response.json();
      setCounts(data);
    } catch (err) {
      console.error("Failed to fetch reactions:", err);
      setError("فشل التحميل");
    }
  }, [postId]);

  useEffect(() => {
    setUserReaction(getLocalUserReaction(postId));
    fetchReactions();
  }, [postId, fetchReactions]);

  const handleReaction = async (reaction: ReactionType) => {
    if (!counts) return;

    const oldReaction = userReaction;
    const isTogglingOff = oldReaction === reaction;
    const newReaction = isTogglingOff ? null : reaction;

    const originalCounts = { ...counts };
    const originalUserReaction = oldReaction;
    
    // Optimistic UI Update
    const newCounts = { ...originalCounts };
    let payload: { increment?: ReactionType; decrement?: ReactionType } = {};

    if (isTogglingOff) {
      newCounts[reaction]--;
      payload = { decrement: reaction };
    } else {
      newCounts[reaction]++;
      payload.increment = reaction;
      if (oldReaction) {
        newCounts[oldReaction]--;
        payload.decrement = oldReaction;
      }
    }
    
    setCounts(newCounts);
    setUserReaction(newReaction);
    setLocalUserReaction(postId, newReaction);
    setError(null);

    // Sync with Server
    try {
      const response = await fetch(`/.netlify/functions/reactions?postId=${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update server');
      }
    } catch (err) {
      console.error("Failed to sync reaction:", err);
      // Revert UI on failure
      setCounts(originalCounts);
      setUserReaction(originalUserReaction);
      setLocalUserReaction(postId, originalUserReaction);
      setError("فشل التحديث");
    }
  };

  const reactionConfig: Record<ReactionType, { Icon: React.FC<any>, label: string }> = {
    like: { Icon: LikeIcon, label: 'أعجبني' },
    dislike: { Icon: DislikeIcon, label: 'لم يعجبني' },
    love: { Icon: LoveIcon, label: 'أحببته' },
  };

  if (!counts) {
    return (
      <div className="flex items-center gap-x-3 sm:gap-x-4 h-6">
        {error ? <span className="text-xs text-red-400">{error}</span> : 
        <>
          <div className="w-10 h-4 bg-gray-700 rounded skeleton-pulse"></div>
          <div className="w-10 h-4 bg-gray-700 rounded skeleton-pulse"></div>
          <div className="w-10 h-4 bg-gray-700 rounded skeleton-pulse"></div>
        </>
        }
      </div>
    );
  }

  return (
    <div className="flex items-center gap-x-3 sm:gap-x-4" onClick={(e) => e.stopPropagation()}>
      {Object.keys(reactionConfig).map((key) => {
        const type = key as ReactionType;
        const { Icon, label } = reactionConfig[type];
        const isSelected = userReaction === type;

        return (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            aria-label={label}
            title={label}
            className={`flex items-center gap-x-1.5 transition-colors duration-200 ${
              isSelected ? 'text-red-500' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" filled={isSelected} />
            <span className="text-xs font-medium">{counts[type]}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ReactionButtons;
