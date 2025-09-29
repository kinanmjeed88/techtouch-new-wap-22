
import React, { useState, useEffect } from 'react';
import { LikeIcon, DislikeIcon, LoveIcon } from './Icons';

type ReactionType = 'like' | 'dislike' | 'love';

interface Reactions {
  [postId: string]: {
    counts: {
      like: number;
      dislike: number;
      love: number;
    };
    userReaction: ReactionType | null;
  };
}

const getReactionsFromStorage = (): Reactions => {
  try {
    const storedReactions = localStorage.getItem('post-reactions');
    return storedReactions ? JSON.parse(storedReactions) : {};
  } catch (error) {
    console.error("Failed to parse reactions from localStorage", error);
    return {};
  }
};

const setReactionsToStorage = (reactions: Reactions) => {
  try {
    localStorage.setItem('post-reactions', JSON.stringify(reactions));
  } catch (error) {
    console.error("Failed to save reactions to localStorage", error);
  }
};

interface ReactionButtonsProps {
  postId: number;
}

const ReactionButtons: React.FC<ReactionButtonsProps> = ({ postId }) => {
  const [counts, setCounts] = useState({ like: 0, dislike: 0, love: 0 });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);

  useEffect(() => {
    const allReactions = getReactionsFromStorage();
    const postReactions = allReactions[postId];
    if (postReactions) {
      setCounts(postReactions.counts);
      setUserReaction(postReactions.userReaction);
    }
  }, [postId]);

  const handleReaction = (reaction: ReactionType) => {
    let newCounts = { ...counts };
    let newUserReaction: ReactionType | null = reaction;

    if (userReaction === reaction) {
      newCounts[reaction]--;
      newUserReaction = null;
    } else {
      if (userReaction) {
        newCounts[userReaction]--;
      }
      newCounts[reaction]++;
    }
    
    setCounts(newCounts);
    setUserReaction(newUserReaction);

    const allReactions = getReactionsFromStorage();
    allReactions[postId] = {
      counts: newCounts,
      userReaction: newUserReaction,
    };
    setReactionsToStorage(allReactions);
  };

  const reactionTypes: ReactionType[] = ['like', 'dislike', 'love'];
  
  const reactionConfig: Record<ReactionType, { Icon: React.FC<any>, label: string }> = {
    like: { Icon: LikeIcon, label: 'أعجبني' },
    dislike: { Icon: DislikeIcon, label: 'لم يعجبني' },
    love: { Icon: LoveIcon, label: 'أحببته' },
  };

  return (
    <div className="flex items-center gap-x-3 sm:gap-x-4" onClick={(e) => e.stopPropagation()}>
      {reactionTypes.map((type) => {
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
