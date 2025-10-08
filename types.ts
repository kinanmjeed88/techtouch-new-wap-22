export type Category = 'general' | 'android-apps' | 'movie-apps' | 'sports-apps' | 'games' | string;

export interface Post {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
  link?: string;
  fileUrl?: string;
  youtubeUrl?: string;
  relatedPosts?: string[];
  category: Category;
}

export interface Profile {
  name?: string;
  age?: number;
  city?: string;
  bio?: string;
  contactLink?: string;
}

export interface SiteSettings {
    logoUrl: string;
    announcementText: string;
    announcementLink?: string;
    announcementTextColor?: string;
    colors?: {
        header: string;
        card: string;
        primary: string;
        siteName?: string;
        cardTitle?: string;
        cardDescription?: string;
    };
    socials?: {
        facebook?: string;
        tiktok?: string;
        youtube?: string;
        telegram?: string;
    };
}