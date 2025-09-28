export type Category = 'general' | 'android-apps' | 'movie-apps' | 'sports-apps' | 'games';

export interface Post {
  id: number;
  title: string;
  description: string;
  content: string;
  imageUrl: string;
  timestamp: string;
  link: string;
  fileUrl: string;
  category: Category;
}

export interface SiteSettings {
    logoUrl: string;
    announcementText: string;
    announcementLink?: string;
    colors: {
        header: string;
        card: string;
        primary: string;
    };
    socials?: {
        facebook?: string;
        tiktok?: string;
        youtube?: string;
        telegram?: string;
    };
}
