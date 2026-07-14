export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
};

// Blog posts are now managed via the database (blog_posts table).
// This static file is kept for type exports only.
export const blogPosts: BlogPost[] = [];
