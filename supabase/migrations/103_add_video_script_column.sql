-- Add video_script column to content_posts table for video content

ALTER TABLE content_posts
ADD COLUMN IF NOT EXISTS video_script TEXT;

COMMENT ON COLUMN content_posts.video_script IS 'Full video script with dialogue, timing, and directions for video content';
