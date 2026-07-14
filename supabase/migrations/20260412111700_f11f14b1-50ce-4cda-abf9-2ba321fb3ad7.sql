-- Add parent_id column for threaded replies
ALTER TABLE public.blog_comments 
ADD COLUMN parent_id uuid REFERENCES public.blog_comments(id) ON DELETE CASCADE DEFAULT NULL;

-- Index for faster lookups of replies
CREATE INDEX idx_blog_comments_parent_id ON public.blog_comments(parent_id);
